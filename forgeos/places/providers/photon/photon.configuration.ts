import {
  PhotonConfiguration,
  PhotonConfigurationInput,
} from './photon.types';

const DEFAULT_ENDPOINT =
  'https://photon.komoot.io';

const DEFAULT_TIMEOUT_MILLISECONDS =
  10_000;

const DEFAULT_USER_AGENT =
  'ForgeOS Places/0.1';

export function resolvePhotonConfiguration(
  input:
    PhotonConfigurationInput = {},
): PhotonConfiguration {
  const errors:
    string[] = [];

  const endpoint =
    (
      input.endpoint ??
      DEFAULT_ENDPOINT
    )
      .trim()
      .replace(
        /\/+$/,
        '',
      );

  const timeoutMilliseconds =
    input.timeoutMilliseconds ??
    DEFAULT_TIMEOUT_MILLISECONDS;

  const userAgent =
    (
      input.userAgent ??
      DEFAULT_USER_AGENT
    ).trim();

  try {
    const url =
      new URL(
        endpoint,
      );

    if (
      ![
        'http:',
        'https:',
      ].includes(
        url.protocol,
      )
    ) {
      errors.push(
        'Photon endpoint must use HTTP or HTTPS',
      );
    }
  } catch {
    errors.push(
      'Photon endpoint must be a valid URL',
    );
  }

  if (
    !Number.isInteger(
      timeoutMilliseconds,
    ) ||
    timeoutMilliseconds < 1
  ) {
    errors.push(
      'Photon timeoutMilliseconds must be a positive integer',
    );
  }

  if (!userAgent) {
    errors.push(
      'Photon userAgent must not be empty',
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

    userAgent:
      userAgent ||
      DEFAULT_USER_AGENT,

    errors,
  };
}
