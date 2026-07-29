import {
  RazorpayConfiguration,
  RazorpayConfigurationResult,
} from './razorpay.types';

export const DEFAULT_RAZORPAY_ENDPOINT =
  'https://api.razorpay.com/v1';

export const DEFAULT_RAZORPAY_TIMEOUT_MILLISECONDS =
  10_000;

export const MAX_RAZORPAY_TIMEOUT_MILLISECONDS =
  60_000;

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
    return DEFAULT_RAZORPAY_TIMEOUT_MILLISECONDS;
  }

  if (
    !Number.isInteger(value) ||
    value < 100 ||
    value >
      MAX_RAZORPAY_TIMEOUT_MILLISECONDS
  ) {
    errors.push(
      'Razorpay timeout must be an integer between 100 and 60000 milliseconds',
    );

    return DEFAULT_RAZORPAY_TIMEOUT_MILLISECONDS;
  }

  return value;
}

export function resolveRazorpayConfiguration(
  input: RazorpayConfiguration,
): RazorpayConfigurationResult {
  const errors: string[] = [];

  const keyId =
    normalize(input.keyId);

  const keySecret =
    normalize(input.keySecret);

  const webhookSecret =
    normalize(
      input.webhookSecret,
    );

  if (
    !keyId ||
    !/^rzp_(test|live)_[A-Za-z0-9]+$/.test(
      keyId,
    )
  ) {
    errors.push(
      'Razorpay Key ID must use the expected rzp_test_ or rzp_live_ format',
    );
  }

  if (
    !keySecret ||
    keySecret.length < 16
  ) {
    errors.push(
      'Razorpay Key Secret must contain at least 16 characters',
    );
  }

  if (
    !webhookSecret ||
    webhookSecret.length < 12
  ) {
    errors.push(
      'Razorpay webhook secret must contain at least 12 characters',
    );
  }

  const endpointValue =
    normalize(input.endpoint) ??
    DEFAULT_RAZORPAY_ENDPOINT;

  let endpoint =
    DEFAULT_RAZORPAY_ENDPOINT;

  try {
    const parsed =
      new URL(endpointValue);

    if (
      parsed.protocol !==
      'https:'
    ) {
      errors.push(
        'Razorpay endpoint must use HTTPS',
      );
    }

    if (
      parsed.username ||
      parsed.password
    ) {
      errors.push(
        'Razorpay endpoint must not contain credentials',
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
      'Razorpay endpoint must be a valid absolute URL',
    );
  }

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',

    keyId,
    keySecret,
    webhookSecret,
    endpoint,

    timeoutMilliseconds:
      resolveTimeout(
        input.timeoutMilliseconds,
        errors,
      ),

    errors,
  };
}
