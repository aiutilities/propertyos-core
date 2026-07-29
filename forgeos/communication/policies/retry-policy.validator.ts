import {
  CommunicationRetryPolicy,
} from './retry-policy.types';

export interface RetryPolicyValidation {
  status: 'READY' | 'BLOCKED';
  errors: readonly string[];
}

export function validateRetryPolicy(
  policy: CommunicationRetryPolicy,
): RetryPolicyValidation {
  const errors: string[] = [];

  if (
    !Number.isInteger(
      policy.maximumAttempts,
    ) ||
    policy.maximumAttempts < 1
  ) {
    errors.push(
      'Retry maximum attempts must be an integer of at least 1',
    );
  }

  if (
    !Number.isInteger(
      policy.initialDelayMilliseconds,
    ) ||
    policy.initialDelayMilliseconds < 0
  ) {
    errors.push(
      'Retry initial delay must be a non-negative integer',
    );
  }

  if (
    !Number.isFinite(
      policy.backoffMultiplier,
    ) ||
    policy.backoffMultiplier < 1
  ) {
    errors.push(
      'Retry backoff multiplier must be at least 1',
    );
  }

  if (
    policy.maximumDelayMilliseconds !==
      undefined &&
    (
      !Number.isInteger(
        policy.maximumDelayMilliseconds,
      ) ||
      policy.maximumDelayMilliseconds < 0
    )
  ) {
    errors.push(
      'Retry maximum delay must be a non-negative integer',
    );
  }

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',
    errors,
  };
}
