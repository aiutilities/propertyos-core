import {
  Fast2SmsConfiguration,
  Fast2SmsConfigurationResult,
} from './fast2sms.types';

export const DEFAULT_FAST2SMS_ENDPOINT =
  'https://www.fast2sms.com/dev/bulkV2';

export const DEFAULT_FAST2SMS_TIMEOUT_MILLISECONDS =
  10_000;

export const MAX_FAST2SMS_TIMEOUT_MILLISECONDS =
  60_000;

function normalizeOptional(
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
    return DEFAULT_FAST2SMS_TIMEOUT_MILLISECONDS;
  }

  if (
    !Number.isInteger(value) ||
    value < 100 ||
    value >
      MAX_FAST2SMS_TIMEOUT_MILLISECONDS
  ) {
    errors.push(
      'Fast2SMS timeout must be an integer between 100 and 60000 milliseconds',
    );

    return DEFAULT_FAST2SMS_TIMEOUT_MILLISECONDS;
  }

  return value;
}

export function resolveFast2SmsConfiguration(
  input: Fast2SmsConfiguration,
): Fast2SmsConfigurationResult {
  const errors: string[] = [];

  const apiKey =
    normalizeOptional(
      input.apiKey,
    );

  if (!apiKey) {
    errors.push(
      'Fast2SMS API key is required',
    );
  } else if (
    apiKey.length < 20
  ) {
    errors.push(
      'Fast2SMS API key must contain at least 20 characters',
    );
  }

  const senderId =
    normalizeOptional(
      input.senderId,
    )
      ?.toUpperCase();

  if (
    !senderId ||
    !/^[A-Z0-9]{3,6}$/.test(
      senderId,
    )
  ) {
    errors.push(
      'Fast2SMS sender ID must contain 3 to 6 uppercase letters or digits',
    );
  }

  const endpointValue =
    normalizeOptional(
      input.endpoint,
    ) ??
    DEFAULT_FAST2SMS_ENDPOINT;

  let endpoint =
    DEFAULT_FAST2SMS_ENDPOINT;

  try {
    const parsed =
      new URL(endpointValue);

    if (
      parsed.protocol !==
      'https:'
    ) {
      errors.push(
        'Fast2SMS endpoint must use HTTPS',
      );
    }

    if (
      parsed.username ||
      parsed.password
    ) {
      errors.push(
        'Fast2SMS endpoint must not contain credentials',
      );
    }

    if (parsed.hash) {
      errors.push(
        'Fast2SMS endpoint must not contain a fragment',
      );
    }

    endpoint =
      parsed.toString();
  } catch {
    errors.push(
      'Fast2SMS endpoint must be a valid absolute URL',
    );
  }

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',

    apiKey,
    senderId,
    endpoint,

    timeoutMilliseconds:
      resolveTimeout(
        input.timeoutMilliseconds,
        errors,
      ),

    includeSmsDetails:
      input.includeSmsDetails ??
      false,

    errors,
  };
}
