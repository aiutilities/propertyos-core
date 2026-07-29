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
  DeliveryStateStore,
} from '../ports/delivery-state-store';

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
  logger?: CommunicationLogger;
}

export class CommunicationDispatcher {
  private readonly logger: CommunicationLogger;

  constructor(
    private readonly dependencies:
      CommunicationDispatcherDependencies,
  ) {
    this.logger =
      dependencies.logger ??
      new NoopCommunicationLogger();
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

        await this.markFailed(
          input,
          error,
          result.providerName,
          result.metadata,
        );

        return {
          communicationId:
            input.communicationId,
          status: 'FAILED',
          providerName:
            result.providerName,
          error,
          metadata: result.metadata,
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
            channel: input.channel,
            recipient: input.recipient,
            providerName:
              result.providerName,
            providerMessageId:
              result.providerMessageId,
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
        metadata: result.metadata,
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
          channel: input.channel,
          providerName: provider.name,
          error: message,
        },
      );

      await this.markFailed(
        input,
        message,
        provider.name,
      );

      return {
        communicationId:
          input.communicationId,
        status: 'FAILED',
        providerName:
          provider.name,
        error: message,
      };
    }
  }

  private async markFailed(
    input: DispatchCommunicationInput,
    error: string,
    providerName?: string,
    providerMetadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.dependencies
      .deliveryStateStore
      .updateDeliveryState({
        communicationId:
          input.communicationId,
        status: 'FAILED',
        metadata: {
          providerName,
          deliveryError: error,
          providerMetadata:
            providerMetadata ?? {},
        },
      });

    await this.dependencies
      .eventPublisher
      .publish({
        type: 'communication.failed',
        source:
          'forgeos.communication.dispatcher',
        payload: {
          communicationId:
            input.communicationId,
          channel: input.channel,
          recipient: input.recipient,
          providerName,
          reason: error,
        },
        correlationId:
          input.correlationId,
        causationId:
          input.causationId,
      });
  }
}
