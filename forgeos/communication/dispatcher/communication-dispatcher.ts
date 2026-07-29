import {
  randomUUID,
} from 'node:crypto';

import {
  CommunicationEventPublisher,
} from '../ports/communication-event-publisher';

import {
  CommunicationLogger,
  NoopCommunicationLogger,
} from '../ports/communication-logger';

import {
  CommunicationRetryScheduler,
  NoopCommunicationRetryScheduler,
} from '../ports/communication-retry-scheduler';

import {
  DeliveryStateStore,
} from '../ports/delivery-state-store';

import {
  CommunicationRetryEvaluator,
} from '../policies/retry-policy';

import {
  CommunicationProviderRegistry,
} from '../registry/provider-registry';

import {
  DispatchCommunicationInput,
  DispatchCommunicationResult,
} from './communication-dispatcher.types';

import {
  createProviderDeliveryRequest,
} from './provider-delivery-request.factory';

export interface CommunicationDispatcherDependencies {
  providers: CommunicationProviderRegistry;
  deliveryStateStore: DeliveryStateStore;
  eventPublisher: CommunicationEventPublisher;
  retryScheduler?: CommunicationRetryScheduler;
  logger?: CommunicationLogger;
}

export class CommunicationDispatcher {
  private readonly logger: CommunicationLogger;
  private readonly retryScheduler:
    CommunicationRetryScheduler;

  constructor(
    private readonly dependencies:
      CommunicationDispatcherDependencies,
  ) {
    this.logger =
      dependencies.logger ??
      new NoopCommunicationLogger();

    this.retryScheduler =
      dependencies.retryScheduler ??
      new NoopCommunicationRetryScheduler();
  }

  async dispatch(
    input: DispatchCommunicationInput,
  ): Promise<DispatchCommunicationResult> {
    const provider =
      this.dependencies.providers.get(
        input.channel,
      );

    if (!provider) {
      const error =
        `No communication provider registered for ${input.channel}`;

      await this.markFailed(
        input,
        error,
      );

      return {
        communicationId:
          input.communicationId,
        status: 'FAILED',
        error,
      };
    }

    try {
      const result = await provider.send(
        createProviderDeliveryRequest(
          input,
          randomUUID(),
        ),
      );

      if (!result.success) {
        const error =
          result.errorMessage ??
          'Provider delivery failed';

        const retryResult =
          await this.tryScheduleRetry(
            input,
            provider.name,
            result.retryable,
            result.errorCode,
            error,
            result.metadata,
          );

        if (retryResult) {
          return retryResult;
        }

        await this.markFailed(
          input,
          error,
          result.providerName,
          result.metadata,
          result.errorCode,
        );

        return {
          communicationId:
            input.communicationId,
          status: 'FAILED',
          providerName:
            result.providerName,
          errorCode:
            result.errorCode,
          error,
          metadata:
            result.metadata,
        };
      }

      const metadata = {
        providerName:
          result.providerName,
        providerMessageId:
          result.providerMessageId,
        providerMetadata:
          result.metadata ?? {},
        deliveredAt:
          result.acceptedAt ??
          new Date().toISOString(),
        attemptNumber:
          input.attemptNumber ?? 1,
      };

      await this.dependencies
        .deliveryStateStore
        .updateDeliveryState({
          communicationId:
            input.communicationId,
          status: 'SENT',
          metadata,
        });

      await this.dependencies
        .eventPublisher
        .publish({
          type: 'communication.sent',
          source:
            'forgeos.communication.dispatcher',
          payload: {
            communicationId:
              input.communicationId,
            channel:
              input.channel,
            recipient:
              input.recipient,
            providerName:
              result.providerName,
            providerMessageId:
              result.providerMessageId,
            attemptNumber:
              input.attemptNumber ?? 1,
          },
          correlationId:
            input.correlationId,
          causationId:
            input.causationId,
        });

      return {
        communicationId:
          input.communicationId,
        status: 'SENT',
        providerName:
          result.providerName,
        providerMessageId:
          result.providerMessageId,
        metadata:
          result.metadata,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown provider error';

      this.logger.error(
        'Communication dispatch failed',
        {
          communicationId:
            input.communicationId,
          channel:
            input.channel,
          providerName:
            provider.name,
          error: message,
        },
      );

      const retryResult =
        await this.tryScheduleRetry(
          input,
          provider.name,
          true,
          'PROVIDER_EXCEPTION',
          message,
        );

      if (retryResult) {
        return retryResult;
      }

      await this.markFailed(
        input,
        message,
        provider.name,
        undefined,
        'PROVIDER_EXCEPTION',
      );

      return {
        communicationId:
          input.communicationId,
        status: 'FAILED',
        providerName:
          provider.name,
        errorCode:
          'PROVIDER_EXCEPTION',
        error: message,
      };
    }
  }

  private async tryScheduleRetry(
    input: DispatchCommunicationInput,
    providerName: string,
    retryable: boolean | undefined,
    errorCode: string | undefined,
    errorMessage: string,
    providerMetadata?:
      Record<string, unknown>,
  ): Promise<
    DispatchCommunicationResult | null
  > {
    if (!input.retryPolicy) {
      return null;
    }

    const evaluator =
      new CommunicationRetryEvaluator(
        input.retryPolicy,
      );

    const evaluation =
      evaluator.evaluate({
        attemptNumber:
          input.attemptNumber ?? 1,
        retryable,
        errorCode,
      });

    if (
      !evaluation.shouldRetry ||
      evaluation.nextAttemptNumber ===
        undefined ||
      evaluation.delayMilliseconds ===
        undefined
    ) {
      return null;
    }

    const metadata = {
      providerName,
      errorCode,
      deliveryError:
        errorMessage,
      providerMetadata:
        providerMetadata ?? {},
      attemptNumber:
        input.attemptNumber ?? 1,
      nextAttemptNumber:
        evaluation.nextAttemptNumber,
      retryDelayMilliseconds:
        evaluation.delayMilliseconds,
    };

    await this.retryScheduler.scheduleRetry({
      communication: input,
      nextAttemptNumber:
        evaluation.nextAttemptNumber,
      delayMilliseconds:
        evaluation.delayMilliseconds,
      providerName,
      errorCode,
      errorMessage,
      metadata,
    });

    await this.dependencies
      .eventPublisher
      .publish({
        type:
          'communication.retry.scheduled',
        source:
          'forgeos.communication.dispatcher',
        payload: {
          communicationId:
            input.communicationId,
          channel:
            input.channel,
          recipient:
            input.recipient,
          providerName,
          errorCode,
          reason:
            errorMessage,
          attemptNumber:
            input.attemptNumber ?? 1,
          nextAttemptNumber:
            evaluation.nextAttemptNumber,
          delayMilliseconds:
            evaluation.delayMilliseconds,
        },
        correlationId:
          input.correlationId,
        causationId:
          input.causationId,
      });

    return {
      communicationId:
        input.communicationId,
      status:
        'RETRY_SCHEDULED',
      providerName,
      errorCode,
      error:
        errorMessage,
      nextAttemptNumber:
        evaluation.nextAttemptNumber,
      retryDelayMilliseconds:
        evaluation.delayMilliseconds,
      metadata:
        providerMetadata,
    };
  }

  private async markFailed(
    input: DispatchCommunicationInput,
    error: string,
    providerName?: string,
    providerMetadata?:
      Record<string, unknown>,
    errorCode?: string,
  ): Promise<void> {
    await this.dependencies
      .deliveryStateStore
      .updateDeliveryState({
        communicationId:
          input.communicationId,
        status: 'FAILED',
        metadata: {
          providerName,
          errorCode,
          deliveryError:
            error,
          providerMetadata:
            providerMetadata ?? {},
          attemptNumber:
            input.attemptNumber ?? 1,
        },
      });

    await this.dependencies
      .eventPublisher
      .publish({
        type:
          'communication.failed',
        source:
          'forgeos.communication.dispatcher',
        payload: {
          communicationId:
            input.communicationId,
          channel:
            input.channel,
          recipient:
            input.recipient,
          providerName,
          errorCode,
          reason:
            error,
          attemptNumber:
            input.attemptNumber ?? 1,
        },
        correlationId:
          input.correlationId,
        causationId:
          input.causationId,
      });
  }
}
