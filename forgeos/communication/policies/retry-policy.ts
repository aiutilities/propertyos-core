import {
  CommunicationRetryPolicy,
  RetryEvaluation,
  RetryEvaluationInput,
} from './retry-policy.types';

import {
  validateRetryPolicy,
} from './retry-policy.validator';

function calculateDelay(
  policy: CommunicationRetryPolicy,
  nextAttemptNumber: number,
): number {
  const exponent =
    Math.max(
      nextAttemptNumber - 2,
      0,
    );

  const calculated =
    policy.initialDelayMilliseconds *
    Math.pow(
      policy.backoffMultiplier,
      exponent,
    );

  if (
    policy.maximumDelayMilliseconds ===
      undefined
  ) {
    return Math.round(calculated);
  }

  return Math.min(
    Math.round(calculated),
    policy.maximumDelayMilliseconds,
  );
}

export class CommunicationRetryEvaluator {
  constructor(
    private readonly policy:
      CommunicationRetryPolicy,
  ) {
    const validation =
      validateRetryPolicy(policy);

    if (
      validation.status ===
      'BLOCKED'
    ) {
      throw new Error(
        `COMMUNICATION_RETRY_POLICY_BLOCKED: ${validation.errors.join('; ')}`,
      );
    }
  }

  evaluate(
    input: RetryEvaluationInput,
  ): RetryEvaluation {
    if (
      input.attemptNumber >=
      this.policy.maximumAttempts
    ) {
      return {
        shouldRetry: false,
        reason:
          'ATTEMPTS_EXHAUSTED',
      };
    }

    if (input.retryable !== true) {
      return {
        shouldRetry: false,
        reason:
          'PROVIDER_NOT_RETRYABLE',
      };
    }

    if (
      this.policy
        .retryableErrorCodes &&
      this.policy
        .retryableErrorCodes
        .length > 0 &&
      (
        !input.errorCode ||
        !this.policy
          .retryableErrorCodes
          .includes(
            input.errorCode,
          )
      )
    ) {
      return {
        shouldRetry: false,
        reason:
          'ERROR_CODE_NOT_ALLOWED',
      };
    }

    const nextAttemptNumber =
      input.attemptNumber + 1;

    return {
      shouldRetry: true,
      nextAttemptNumber,
      delayMilliseconds:
        calculateDelay(
          this.policy,
          nextAttemptNumber,
        ),
      reason:
        'RETRY_ALLOWED',
    };
  }
}
