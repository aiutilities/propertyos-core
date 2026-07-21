import {
  Injectable,
} from '@nestjs/common';
import {
  AiProviderFailoverError,
} from '../errors/ai-provider-failover.error';
import {
  AiProviderFailoverAttemptEvidence,
  AiProviderFailoverEvidence,
  AiProviderFailoverFailureCode,
  AiProviderFailoverRequest,
  AiProviderFailoverSuccess,
} from '../types/ai-provider-failover.types';

const DEFAULT_RETRYABLE_FAILURE_CODES:
  readonly AiProviderFailoverFailureCode[] = [
    'AI_PROVIDER_TIMEOUT',
    'AI_PROVIDER_RATE_LIMITED',
    'AI_PROVIDER_OUTAGE',
  ];

@Injectable()
export class AiProviderFailoverService {
  async execute<TResponse>(
    request:
      AiProviderFailoverRequest<TResponse>,
  ): Promise<
    AiProviderFailoverSuccess<TResponse>
  > {
    const normalized =
      this.normalizeRequest(
        request,
      );

    const attempts:
      AiProviderFailoverAttemptEvidence[] = [];

    const providersAttempted:
      string[] = [];

    let globalAttemptNumber =
      0;

    for (
      let providerIndex = 0;
      providerIndex <
      normalized.candidates.length;
      providerIndex += 1
    ) {
      const candidate =
        normalized.candidates[
          providerIndex
        ];

      providersAttempted.push(
        candidate.providerName,
      );

      for (
        let attemptNumber = 1;
        attemptNumber <=
        normalized
          .maximumAttemptsPerProvider;
        attemptNumber += 1
      ) {
        globalAttemptNumber +=
          1;

        const startedAt =
          new Date()
            .toISOString();

        try {
          const response =
            await normalized.execute(
              {
                ...candidate,
              },
              {
                providerIndex,
                attemptNumber,
                globalAttemptNumber,
              },
            );

          const completedAt =
            new Date()
              .toISOString();

          attempts.push({
            providerName:
              candidate.providerName,
            model:
              candidate.model,
            providerIndex,
            attemptNumber,
            globalAttemptNumber,
            outcome:
              'SUCCEEDED',
            startedAt,
            completedAt,
          });

          return {
            providerName:
              candidate.providerName,
            model:
              candidate.model,
            response,
            evidence:
              this.createEvidence({
                attempts,
                providersAttempted,
                successfulProviderName:
                  candidate.providerName,
                exhausted:
                  false,
              }),
          };
        } catch (
          error
        ) {
          const completedAt =
            new Date()
              .toISOString();

          const failureCode =
            this.resolveFailureCode(
              error,
            );

          const retryable =
            normalized
              .retryableFailureCodes
              .includes(
                failureCode,
              );

          attempts.push({
            providerName:
              candidate.providerName,
            model:
              candidate.model,
            providerIndex,
            attemptNumber,
            globalAttemptNumber,
            outcome:
              'FAILED',
            failureCode,
            retryable,
            startedAt,
            completedAt,
          });

          const attemptsRemain =
            attemptNumber <
            normalized
              .maximumAttemptsPerProvider;

          if (
            retryable &&
            attemptsRemain
          ) {
            await this.delay(
              normalized.retryDelayMs,
            );

            continue;
          }

          break;
        }
      }
    }

    throw new AiProviderFailoverError(
      this.createEvidence({
        attempts,
        providersAttempted,
        exhausted:
          true,
      }),
    );
  }

  private normalizeRequest<TResponse>(
    request:
      AiProviderFailoverRequest<TResponse>,
  ): Required<
    AiProviderFailoverRequest<TResponse>
  > {
    if (
      request.candidates.length ===
      0
    ) {
      throw new Error(
        'At least one AI provider failover candidate is required',
      );
    }

    const maximumAttemptsPerProvider =
      request
        .maximumAttemptsPerProvider ??
      2;

    if (
      !Number.isInteger(
        maximumAttemptsPerProvider,
      ) ||
      maximumAttemptsPerProvider <
        1 ||
      maximumAttemptsPerProvider >
        5
    ) {
      throw new Error(
        'Maximum attempts per provider must be an integer between 1 and 5',
      );
    }

    const retryDelayMs =
      request.retryDelayMs ??
      0;

    if (
      !Number.isInteger(
        retryDelayMs,
      ) ||
      retryDelayMs < 0 ||
      retryDelayMs > 5_000
    ) {
      throw new Error(
        'Retry delay must be an integer between 0 and 5000 milliseconds',
      );
    }

    for (
      const candidate of
        request.candidates
    ) {
      if (
        candidate.providerName
          .trim()
          .length === 0
      ) {
        throw new Error(
          'Failover candidate provider name is required',
        );
      }

      if (
        candidate.model
          .trim()
          .length === 0
      ) {
        throw new Error(
          'Failover candidate model is required',
        );
      }
    }

    const retryableFailureCodes =
      request
        .retryableFailureCodes ??
      DEFAULT_RETRYABLE_FAILURE_CODES;

    return {
      candidates:
        request.candidates.map(
          candidate => ({
            providerName:
              candidate.providerName
                .trim(),
            model:
              candidate.model
                .trim(),
          }),
        ),
      maximumAttemptsPerProvider,
      retryDelayMs,
      retryableFailureCodes: [
        ...retryableFailureCodes,
      ],
      execute:
        request.execute,
    };
  }

  private resolveFailureCode(
    error:
      unknown,
  ): AiProviderFailoverFailureCode {
    if (
      typeof error ===
        'object' &&
      error !== null &&
      'code' in error &&
      typeof (
        error as {
          code?: unknown;
        }
      ).code ===
        'string'
    ) {
      const code =
        (
          error as {
            code: string;
          }
        ).code;

      if (
        this.isFailureCode(
          code,
        )
      ) {
        return code;
      }
    }

    if (
      error instanceof Error
    ) {
      return 'AI_PROVIDER_NON_RETRYABLE_FAILURE';
    }

    return 'AI_PROVIDER_UNKNOWN_FAILURE';
  }

  private isFailureCode(
    value:
      string,
  ): value is
    AiProviderFailoverFailureCode {
    return [
      'AI_PROVIDER_TIMEOUT',
      'AI_PROVIDER_RATE_LIMITED',
      'AI_PROVIDER_OUTAGE',
      'AI_PROVIDER_MALFORMED_RESPONSE',
      'AI_PROVIDER_NON_RETRYABLE_FAILURE',
      'AI_PROVIDER_UNKNOWN_FAILURE',
    ].includes(
      value,
    );
  }

  private createEvidence(
    input: {
      attempts:
        readonly AiProviderFailoverAttemptEvidence[];
      providersAttempted:
        readonly string[];
      successfulProviderName?:
        string;
      exhausted:
        boolean;
    },
  ): AiProviderFailoverEvidence {
    return {
      attempts:
        input.attempts.map(
          attempt => ({
            ...attempt,
          }),
        ),
      providersAttempted: [
        ...input.providersAttempted,
      ],
      totalAttempts:
        input.attempts.length,
      failoverCount:
        Math.max(
          0,
          input.providersAttempted
            .length -
            1,
        ),
      ...(input
        .successfulProviderName
        ? {
            successfulProviderName:
              input
                .successfulProviderName,
          }
        : {}),
      exhausted:
        input.exhausted,
    };
  }

  private async delay(
    delayMs:
      number,
  ): Promise<void> {
    if (
      delayMs === 0
    ) {
      return;
    }

    await new Promise<void>(
      resolve => {
        setTimeout(
          resolve,
          delayMs,
        );
      },
    );
  }
}
