export interface PaymentWebhookRetryPolicy {
  maximumAttempts: number;

  initialDelayMilliseconds: number;

  backoffMultiplier: number;

  maximumDelayMilliseconds: number;
}

export const DEFAULT_PAYMENT_WEBHOOK_RETRY_POLICY:
  PaymentWebhookRetryPolicy = {
    maximumAttempts: 5,

    initialDelayMilliseconds:
      30_000,

    backoffMultiplier: 2,

    maximumDelayMilliseconds:
      3_600_000,
  };

export function validatePaymentWebhookRetryPolicy(
  policy:
    PaymentWebhookRetryPolicy,
): readonly string[] {
  const errors: string[] = [];

  if (
    !Number.isInteger(
      policy.maximumAttempts,
    ) ||
    policy.maximumAttempts < 1 ||
    policy.maximumAttempts > 20
  ) {
    errors.push(
      'Payment webhook maximum attempts must be an integer between 1 and 20',
    );
  }

  if (
    !Number.isSafeInteger(
      policy.initialDelayMilliseconds,
    ) ||
    policy.initialDelayMilliseconds < 0
  ) {
    errors.push(
      'Payment webhook initial delay must be a non-negative safe integer',
    );
  }

  if (
    !Number.isFinite(
      policy.backoffMultiplier,
    ) ||
    policy.backoffMultiplier < 1 ||
    policy.backoffMultiplier > 10
  ) {
    errors.push(
      'Payment webhook backoff multiplier must be between 1 and 10',
    );
  }

  if (
    !Number.isSafeInteger(
      policy.maximumDelayMilliseconds,
    ) ||
    policy.maximumDelayMilliseconds < 0
  ) {
    errors.push(
      'Payment webhook maximum delay must be a non-negative safe integer',
    );
  }

  if (
    policy.maximumDelayMilliseconds <
    policy.initialDelayMilliseconds
  ) {
    errors.push(
      'Payment webhook maximum delay must not be less than the initial delay',
    );
  }

  return errors;
}

export function calculatePaymentWebhookRetryDelay(
  attemptNumber: number,
  policy:
    PaymentWebhookRetryPolicy,
): number {
  if (
    !Number.isInteger(
      attemptNumber,
    ) ||
    attemptNumber < 1
  ) {
    throw new Error(
      'PAYMENT_WEBHOOK_RETRY_ATTEMPT_INVALID',
    );
  }

  const exponentialDelay =
    policy.initialDelayMilliseconds *
    Math.pow(
      policy.backoffMultiplier,
      attemptNumber - 1,
    );

  return Math.min(
    Math.round(
      exponentialDelay,
    ),
    policy.maximumDelayMilliseconds,
  );
}
