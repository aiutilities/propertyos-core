import {
  WebhookCommunicationProviderConfiguration,
  WebhookProviderConfigurationResult,
} from './webhook-provider.types';

export const DEFAULT_WEBHOOK_TIMEOUT_MILLISECONDS =
  10_000;

export const MAX_WEBHOOK_TIMEOUT_MILLISECONDS =
  60_000;

function normalizeOptional(
  value: string | undefined,
): string | undefined {
  const normalized = value?.trim();

  return normalized
    ? normalized
    : undefined;
}

function resolveTimeout(
  value: number | undefined,
  errors: string[],
): number {
  if (value === undefined) {
    return DEFAULT_WEBHOOK_TIMEOUT_MILLISECONDS;
  }

  if (
    !Number.isInteger(value) ||
    value < 100 ||
    value >
      MAX_WEBHOOK_TIMEOUT_MILLISECONDS
  ) {
    errors.push(
      'Webhook timeout must be an integer between 100 and 60000 milliseconds',
    );

    return DEFAULT_WEBHOOK_TIMEOUT_MILLISECONDS;
  }

  return value;
}

export function resolveWebhookProviderConfiguration(
  input: WebhookCommunicationProviderConfiguration,
): WebhookProviderConfigurationResult {
  const errors: string[] = [];

  const endpointValue =
    normalizeOptional(input.endpoint);

  let endpoint: string | undefined;

  if (!endpointValue) {
    errors.push(
      'Webhook endpoint is required',
    );
  } else {
    try {
      const parsed =
        new URL(endpointValue);

      if (
        parsed.protocol !== 'http:' &&
        parsed.protocol !== 'https:'
      ) {
        errors.push(
          'Webhook endpoint must use HTTP or HTTPS',
        );
      }

      if (
        input.requireHttps &&
        parsed.protocol !== 'https:'
      ) {
        errors.push(
          'Webhook endpoint must use HTTPS',
        );
      }

      if (
        parsed.username ||
        parsed.password
      ) {
        errors.push(
          'Webhook endpoint must not contain credentials',
        );
      }

      if (parsed.hash) {
        errors.push(
          'Webhook endpoint must not contain a fragment',
        );
      }

      endpoint = parsed.toString();
    } catch {
      errors.push(
        'Webhook endpoint must be a valid absolute URL',
      );
    }
  }

  const bearerToken =
    normalizeOptional(
      input.bearerToken,
    );

  const minimumTokenLength =
    input.minimumTokenLength ?? 0;

  if (
    minimumTokenLength > 0 &&
    !bearerToken
  ) {
    errors.push(
      'Webhook bearer token is required',
    );
  } else if (
    bearerToken &&
    bearerToken.length <
      minimumTokenLength
  ) {
    errors.push(
      `Webhook bearer token must contain at least ${minimumTokenLength} characters`,
    );
  }

  const timeoutMilliseconds =
    resolveTimeout(
      input.timeoutMilliseconds,
      errors,
    );

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',
    endpoint,
    bearerToken,
    timeoutMilliseconds,
    errors,
  };
}
