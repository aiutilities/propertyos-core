import {
  CommunicationDispatcher,
} from '../dispatcher/communication-dispatcher';

import {
  CommunicationEventPublisher,
} from '../ports/communication-event-publisher';

import {
  CommunicationLogger,
  NoopCommunicationLogger,
} from '../ports/communication-logger';

import {
  validateCommunicationFallbackPolicy,
} from './communication-fallback.validator';

import {
  CommunicationFallbackAttempt,
  DispatchWithFallbackInput,
  DispatchWithFallbackResult,
} from './communication-fallback.types';

export interface CommunicationFallbackEngineDependencies {
  dispatcher:
    CommunicationDispatcher;

  eventPublisher:
    CommunicationEventPublisher;

  logger?:
    CommunicationLogger;
}

export class CommunicationFallbackEngine {
  private readonly logger:
    CommunicationLogger;

  constructor(
    private readonly dependencies:
      CommunicationFallbackEngineDependencies,
  ) {
    this.logger =
      dependencies.logger ??
      new NoopCommunicationLogger();
  }

  async dispatch(
    input:
      DispatchWithFallbackInput,
  ): Promise<DispatchWithFallbackResult> {
    const validation =
      validateCommunicationFallbackPolicy(
        input.fallbackPolicy,
      );

    if (
      validation.status ===
      'BLOCKED'
    ) {
      throw new Error(
        `COMMUNICATION_FALLBACK_POLICY_BLOCKED: ${validation.errors.join('; ')}`,
      );
    }

    const channelOrder =
      this.resolveChannelOrder(input);

    const attempts:
      CommunicationFallbackAttempt[] = [];

    await this.dependencies
      .eventPublisher
      .publish({
        type:
          'communication.fallback.started',
        source:
          'forgeos.communication.fallback',
        payload: {
          communicationId:
            input.communicationId,
          primaryChannel:
            input.primaryChannel,
          channelOrder,
        },
        correlationId:
          input.correlationId,
        causationId:
          input.causationId,
      });

    for (
      const channel
      of channelOrder
    ) {
      const result =
        await this.dependencies
          .dispatcher
          .dispatch({
            communicationId:
              input.communicationId,
            channel,
            recipient:
              input.recipient,
            subject:
              input.subject,
            message:
              input.message,
            metadata: {
              ...input.metadata,
              fallbackChannel:
                channel,
              fallbackAttempt:
                attempts.length + 1,
            },
            correlationId:
              input.correlationId,
            causationId:
              input.causationId,
            attemptNumber:
              input.attemptNumber,
            retryPolicy:
              input.retryPolicy,
          });

      attempts.push({
        channel,
        result,
      });

      if (
        result.status ===
        'RETRY_SCHEDULED'
      ) {
        await this.publishCompleted(
          input,
          attempts,
          result.status,
        );

        return {
          communicationId:
            input.communicationId,
          status:
            'RETRY_SCHEDULED',
          attempts,
          terminalResult:
            result,
        };
      }

      if (
        result.status ===
        'SENT'
      ) {
        await this.publishCompleted(
          input,
          attempts,
          result.status,
          channel,
        );

        return {
          communicationId:
            input.communicationId,
          status:
            'SENT',
          successfulChannel:
            channel,
          attempts,
          terminalResult:
            result,
        };
      }

      if (
        !input.fallbackPolicy
          .continueOnFailure
      ) {
        break;
      }
    }

    const terminalResult =
      attempts.length > 0
        ? attempts[attempts.length - 1].result
        : {
        communicationId:
          input.communicationId,
        status:
          'FAILED' as const,
        error:
          'No fallback delivery attempt was executed',
      };

    this.logger.warn?.(
      'Communication fallback exhausted',
      {
        communicationId:
          input.communicationId,
        attempts:
          attempts.length,
      },
    );

    await this.publishCompleted(
      input,
      attempts,
      'FAILED',
    );

    return {
      communicationId:
        input.communicationId,
      status:
        'FAILED',
      attempts,
      terminalResult,
    };
  }

  private resolveChannelOrder(
    input:
      DispatchWithFallbackInput,
  ) {
    if (
      !input.fallbackPolicy.enabled
    ) {
      return [
        input.primaryChannel,
      ] as const;
    }

    const channels =
      input.fallbackPolicy
        .channelOrder;

    if (
      channels.includes(
        input.primaryChannel,
      )
    ) {
      return channels;
    }

    return [
      input.primaryChannel,
      ...channels,
    ];
  }

  private async publishCompleted(
    input:
      DispatchWithFallbackInput,
    attempts:
      readonly CommunicationFallbackAttempt[],
    status:
      | 'SENT'
      | 'FAILED'
      | 'RETRY_SCHEDULED',
    successfulChannel?: string,
  ): Promise<void> {
    await this.dependencies
      .eventPublisher
      .publish({
        type:
          'communication.fallback.completed',
        source:
          'forgeos.communication.fallback',
        payload: {
          communicationId:
            input.communicationId,
          status,
          successfulChannel,
          attempts:
            attempts.map(
              (attempt) => ({
                channel:
                  attempt.channel,
                status:
                  attempt.result.status,
                providerName:
                  attempt.result
                    .providerName,
                errorCode:
                  attempt.result
                    .errorCode,
                error:
                  attempt.result.error,
              }),
            ),
        },
        correlationId:
          input.correlationId,
        causationId:
          input.causationId,
      });
  }
}
