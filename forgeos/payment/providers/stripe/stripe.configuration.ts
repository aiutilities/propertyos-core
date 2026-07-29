import {
  StripeConfiguration,
  StripeConfigurationResult,
} from './stripe.types';

export const DEFAULT_STRIPE_ENDPOINT =
  'https://api.stripe.com/v1';

export const DEFAULT_STRIPE_TIMEOUT_MILLISECONDS =
  10_000;

export const MAX_STRIPE_TIMEOUT_MILLISECONDS =
  60_000;

export const DEFAULT_STRIPE_WEBHOOK_TOLERANCE_SECONDS =
  300;

export const MAX_STRIPE_WEBHOOK_TOLERANCE_SECONDS =
  3600;

function normalize(
  value: string | undefined,
): string | undefined {
  const normalized =
    value?.trim();

  return normalized
    ? normalized
    : undefined;
}

function resolveTimeout(
  value: number | undefined,
  errors: string[],
): number {
  if (value === undefined) {
    return DEFAULT_STRIPE_TIMEOUT_MILLISECONDS;
  }

  if (
    !Number.isInteger(value) ||
    value < 100 ||
    value >
      MAX_STRIPE_TIMEOUT_MILLISECONDS
  ) {
    errors.push(
      'Stripe timeout must be an integer between 100 and 60000 milliseconds',
    );

    return DEFAULT_STRIPE_TIMEOUT_MILLISECONDS;
  }

  return value;
}

function resolveWebhookTolerance(
  value: number | undefined,
  errors: string[],
): number {
  if (value === undefined) {
    return DEFAULT_STRIPE_WEBHOOK_TOLERANCE_SECONDS;
  }

  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value >
      MAX_STRIPE_WEBHOOK_TOLERANCE_SECONDS
  ) {
    errors.push(
      'Stripe webhook tolerance must be an integer between 0 and 3600 seconds',
    );

    return DEFAULT_STRIPE_WEBHOOK_TOLERANCE_SECONDS;
  }

  return value;
}

export function resolveStripeConfiguration(
  input: StripeConfiguration,
): StripeConfigurationResult {
  const errors: string[] = [];

  const secretKey =
    normalize(
      input.secretKey,
    );

  const webhookSecret =
    normalize(
      input.webhookSecret,
    );

  if (
    !secretKey ||
    !/^sk_(test|live)_[A-Za-z0-9_]+$/.test(
      secretKey,
    )
  ) {
    errors.push(
      'Stripe secret key must use the expected sk_test_ or sk_live_ format',
    );
  }

  if (
    !webhookSecret ||
    !/^whsec_[A-Za-z0-9_]+$/.test(
      webhookSecret,
    )
  ) {
    errors.push(
      'Stripe webhook secret must use the expected whsec_ format',
    );
  }

  const endpointValue =
    normalize(
      input.endpoint,
    ) ??
    DEFAULT_STRIPE_ENDPOINT;

  let endpoint =
    DEFAULT_STRIPE_ENDPOINT;

  try {
    const parsed =
      new URL(endpointValue);

    if (
      parsed.protocol !==
      'https:'
    ) {
      errors.push(
        'Stripe endpoint must use HTTPS',
      );
    }

    if (
      parsed.username ||
      parsed.password
    ) {
      errors.push(
        'Stripe endpoint must not contain credentials',
      );
    }

    if (parsed.hash) {
      errors.push(
        'Stripe endpoint must not contain a fragment',
      );
    }

    parsed.pathname =
      parsed.pathname.replace(
        /\/+$/,
        '',
      );

    endpoint =
      parsed.toString().replace(
        /\/$/,
        '',
      );
  } catch {
    errors.push(
      'Stripe endpoint must be a valid absolute URL',
    );
  }

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',

    secretKey,
    webhookSecret,
    endpoint,

    timeoutMilliseconds:
      resolveTimeout(
        input.timeoutMilliseconds,
        errors,
      ),

    webhookToleranceSeconds:
      resolveWebhookTolerance(
        input.webhookToleranceSeconds,
        errors,
      ),

    automaticPaymentMethods:
      input.automaticPaymentMethods ??
      true,

    manualCapture:
      input.manualCapture ??
      false,

    errors,
  };
}
