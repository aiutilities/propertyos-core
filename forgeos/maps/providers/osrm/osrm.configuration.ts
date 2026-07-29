import {
  MAP_TRAVEL_MODES,
  MapTravelMode,
} from '../../contracts';

import {
  OsrmConfiguration,
  OsrmConfigurationInput,
} from './osrm.types';

const DEFAULT_ENDPOINT =
  'https://router.project-osrm.org';

const DEFAULT_TIMEOUT_MILLISECONDS =
  10_000;

const DEFAULT_PROFILES:
  Partial<
    Record<
      MapTravelMode,
      string
    >
  > = {
    DRIVING:
      'driving',

    WALKING:
      'walking',

    CYCLING:
      'cycling',
  };

export function resolveOsrmConfiguration(
  input:
    OsrmConfigurationInput,
): OsrmConfiguration {
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
        'OSRM endpoint must use HTTP or HTTPS',
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
      'OSRM endpoint must be a valid absolute URL',
    );
  }

  const timeoutMilliseconds =
    input.timeoutMilliseconds ??
    DEFAULT_TIMEOUT_MILLISECONDS;

  if (
    !Number.isInteger(
      timeoutMilliseconds,
    ) ||
    timeoutMilliseconds < 1
  ) {
    errors.push(
      'OSRM timeout must be a positive integer',
    );
  }

  const userAgent =
    input.userAgent
      ?.trim();

  if (
    input.userAgent !==
      undefined &&
    (
      !userAgent ||
      userAgent.length < 8
    )
  ) {
    errors.push(
      'OSRM user agent must contain at least 8 characters when provided',
    );
  }

  const profiles = {
    ...DEFAULT_PROFILES,
    ...input.profiles,
  };

  for (
    const mode of
      MAP_TRAVEL_MODES
  ) {
    const profile =
      profiles[mode];

    if (
      profile !== undefined &&
      (
        typeof profile !==
          'string' ||
        profile.trim()
          .length === 0
      )
    ) {
      errors.push(
        `OSRM profile for ${mode} must not be empty`,
      );
    }
  }

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',

    endpoint:
      normalizedEndpoint,

    timeoutMilliseconds:
      Number.isInteger(
        timeoutMilliseconds,
      ) &&
      timeoutMilliseconds > 0
        ? timeoutMilliseconds
        : DEFAULT_TIMEOUT_MILLISECONDS,

    userAgent,

    profiles,

    errors,
  };
}
