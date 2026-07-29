import {
  NominatimProvider,
} from '@forgeos/maps';

function optionalPositiveInteger(
  value: string | undefined,
): number | undefined {
  if (
    value === undefined ||
    value.trim() === ''
  ) {
    return undefined;
  }

  const parsed =
    Number(value);

  return Number.isInteger(parsed) &&
    parsed > 0
    ? parsed
    : undefined;
}

export function createPropertyOSNominatimProvider() {
  return new NominatimProvider({
    configuration: {
      endpoint:
        process.env
          .MAPS_NOMINATIM_ENDPOINT,

      userAgent:
        process.env
          .MAPS_NOMINATIM_USER_AGENT,

      email:
        process.env
          .MAPS_NOMINATIM_EMAIL,

      timeoutMilliseconds:
        optionalPositiveInteger(
          process.env
            .MAPS_NOMINATIM_TIMEOUT_MS,
        ),

      minimumRequestIntervalMilliseconds:
        optionalPositiveInteger(
          process.env
            .MAPS_NOMINATIM_MIN_INTERVAL_MS,
        ),
    },
  });
}
