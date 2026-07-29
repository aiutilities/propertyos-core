import {
  assertGeoCoordinate,
  GeoBoundingBox,
  GeoCoordinate,
} from '../contracts';

const EARTH_RADIUS_METERS =
  6_371_008.8;

function radiansToDegrees(
  radians:
    number,
): number {
  return (
    radians *
    180 /
    Math.PI
  );
}

function normalizeLongitude(
  longitude:
    number,
): number {
  return (
    (
      longitude +
      540
    ) %
    360
  ) - 180;
}

export function createGeoBoundingBox(
  center:
    GeoCoordinate,

  radiusMeters:
    number,
): GeoBoundingBox {
  assertGeoCoordinate(
    center,
  );

  if (
    !Number.isFinite(
      radiusMeters,
    ) ||
    radiusMeters < 0
  ) {
    throw new Error(
      'INVALID_GEO_RADIUS: Radius must be a finite non-negative number',
    );
  }

  const latitudeDelta =
    radiansToDegrees(
      radiusMeters /
      EARTH_RADIUS_METERS,
    );

  const latitudeRadians =
    center.latitude *
    Math.PI /
    180;

  const longitudeDelta =
    Math.abs(
      Math.cos(
        latitudeRadians,
      ),
    ) < 1e-12
      ? 180
      : radiansToDegrees(
          radiusMeters /
          (
            EARTH_RADIUS_METERS *
            Math.cos(
              latitudeRadians,
            )
          ),
        );

  return {
    southWest: {
      latitude:
        Math.max(
          -90,
          center.latitude -
          latitudeDelta,
        ),

      longitude:
        normalizeLongitude(
          center.longitude -
          longitudeDelta,
        ),
    },

    northEast: {
      latitude:
        Math.min(
          90,
          center.latitude +
          latitudeDelta,
        ),

      longitude:
        normalizeLongitude(
          center.longitude +
          longitudeDelta,
        ),
    },
  };
}
