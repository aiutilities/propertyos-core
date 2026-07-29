import {
  MapTravelMode,
  OsrmProvider,
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

function optionalProfile(
  value: string | undefined,
): string | undefined {
  const normalized =
    value?.trim();

  return normalized
    ? normalized
    : undefined;
}

export function createPropertyOSOsrmProvider() {
  const profiles:
    Partial<
      Record<
        MapTravelMode,
        string
      >
    > = {};

  const driving =
    optionalProfile(
      process.env
        .MAPS_OSRM_DRIVING_PROFILE,
    );

  const walking =
    optionalProfile(
      process.env
        .MAPS_OSRM_WALKING_PROFILE,
    );

  const cycling =
    optionalProfile(
      process.env
        .MAPS_OSRM_CYCLING_PROFILE,
    );

  if (driving) {
    profiles.DRIVING =
      driving;
  }

  if (walking) {
    profiles.WALKING =
      walking;
  }

  if (cycling) {
    profiles.CYCLING =
      cycling;
  }

  return new OsrmProvider({
    configuration: {
      endpoint:
        process.env
          .MAPS_OSRM_ENDPOINT,

      timeoutMilliseconds:
        optionalPositiveInteger(
          process.env
            .MAPS_OSRM_TIMEOUT_MS,
        ),

      userAgent:
        process.env
          .MAPS_OSRM_USER_AGENT,

      profiles,
    },
  });
}
