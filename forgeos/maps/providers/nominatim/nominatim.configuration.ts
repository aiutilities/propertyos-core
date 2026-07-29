import {
  NominatimConfiguration,
  NominatimConfigurationInput,
} from './nominatim.types';

const DEFAULT_ENDPOINT =
  'https://nominatim.openstreetmap.org';

const DEFAULT_TIMEOUT_MILLISECONDS =
  10_000;

const PUBLIC_ENDPOINT_MINIMUM_INTERVAL =
  1_000;

function resolvePositiveInteger(
  value:
    number | undefined,

  fallback:
    number,

  fieldName:
    string,

  errors:
    string[],
): number {
  if (value === undefined) {
    return fallback;
  }

  if (
    !Number.isInteger(value) ||
    value < 1
  ) {
    errors.push(
      `${fieldName} must be a positive integer`,
    );

    return fallback;
  }

  return value;
}

export function resolveNominatimConfiguration(
  input:
    NominatimConfigurationInput,
): NominatimConfiguration {
  const errors:
    string[] = [];

  const endpoint =
    input.endpoint
      ?.trim() ||
    DEFAULT_ENDPOINT;

  let normalizedEndpoint =
    endpoint;

  try {
    const parsed =
      new URL(endpoint);

    if (
      parsed.protocol !==
        'https:' &&
      parsed.protocol !==
        'http:'
    ) {
      errors.push(
        'Nominatim endpoint must use HTTP or HTTPS',
      );
    }

    normalizedEndpoint =
      parsed
        .toString()
        .replace(
          /\/$/,
          '',
        );
  } catch {
    errors.push(
      'Nominatim endpoint must be a valid absolute URL',
    );
  }

  const userAgent =
    input.userAgent
      ?.trim();

  if (
    !userAgent ||
    userAgent.length < 8
  ) {
    errors.push(
      'Nominatim user agent must identify the application and contain at least 8 characters',
    );
  }

  const email =
    input.email
      ?.trim();

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    errors.push(
      'Nominatim email must be valid when provided',
    );
  }

  const timeoutMilliseconds =
    resolvePositiveInteger(
      input.timeoutMilliseconds,
      DEFAULT_TIMEOUT_MILLISECONDS,
      'Nominatim timeout',
      errors,
    );

  let minimumRequestIntervalMilliseconds =
    resolvePositiveInteger(
      input.minimumRequestIntervalMilliseconds,
      PUBLIC_ENDPOINT_MINIMUM_INTERVAL,
      'Nominatim minimum request interval',
      errors,
    );

  const usesPublicEndpoint =
    normalizedEndpoint ===
      DEFAULT_ENDPOINT;

  if (
    usesPublicEndpoint &&
    minimumRequestIntervalMilliseconds <
      PUBLIC_ENDPOINT_MINIMUM_INTERVAL
  ) {
    errors.push(
      'Public Nominatim requests must be limited to no more than one request per second',
    );

    minimumRequestIntervalMilliseconds =
      PUBLIC_ENDPOINT_MINIMUM_INTERVAL;
  }

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',

    endpoint:
      normalizedEndpoint,

    userAgent,
    email,

    timeoutMilliseconds,
    minimumRequestIntervalMilliseconds,

    errors,
  };
}
