import {
  OverpassConfiguration,
  OverpassConfigurationInput,
} from './overpass.types';

const DEFAULT_ENDPOINT =
  'https://overpass-api.de/api/interpreter';

const DEFAULT_TIMEOUT_MILLISECONDS =
  20_000;

const DEFAULT_QUERY_TIMEOUT_SECONDS =
  15;

const DEFAULT_USER_AGENT =
  'ForgeOS Places/0.1';

export function resolveOverpassConfiguration(
  input: OverpassConfigurationInput = {},
): OverpassConfiguration {
  const errors: string[] = [];

  const endpoint =
    (
      input.endpoint ??
      DEFAULT_ENDPOINT
    ).trim();

  const timeoutMilliseconds =
    input.timeoutMilliseconds ??
    DEFAULT_TIMEOUT_MILLISECONDS;

  const queryTimeoutSeconds =
    input.queryTimeoutSeconds ??
    DEFAULT_QUERY_TIMEOUT_SECONDS;

  const userAgent =
    (
      input.userAgent ??
      DEFAULT_USER_AGENT
    ).trim();

  try {
    const url =
      new URL(endpoint);

    if (
      ![
        'http:',
        'https:',
      ].includes(url.protocol)
    ) {
      errors.push(
        'Overpass endpoint must use HTTP or HTTPS',
      );
    }
  } catch {
    errors.push(
      'Overpass endpoint must be a valid URL',
    );
  }

  if (
    !Number.isInteger(
      timeoutMilliseconds,
    ) ||
    timeoutMilliseconds < 1
  ) {
    errors.push(
      'Overpass timeoutMilliseconds must be a positive integer',
    );
  }

  if (
    !Number.isInteger(
      queryTimeoutSeconds,
    ) ||
    queryTimeoutSeconds < 1 ||
    queryTimeoutSeconds > 180
  ) {
    errors.push(
      'Overpass queryTimeoutSeconds must be an integer between 1 and 180',
    );
  }

  if (!userAgent) {
    errors.push(
      'Overpass userAgent must not be empty',
    );
  }

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',

    endpoint,

    timeoutMilliseconds:
      Number.isInteger(
        timeoutMilliseconds,
      ) &&
      timeoutMilliseconds > 0
        ? timeoutMilliseconds
        : DEFAULT_TIMEOUT_MILLISECONDS,

    queryTimeoutSeconds:
      Number.isInteger(
        queryTimeoutSeconds,
      ) &&
      queryTimeoutSeconds > 0 &&
      queryTimeoutSeconds <= 180
        ? queryTimeoutSeconds
        : DEFAULT_QUERY_TIMEOUT_SECONDS,

    userAgent:
      userAgent ||
      DEFAULT_USER_AGENT,

    errors,
  };
}
