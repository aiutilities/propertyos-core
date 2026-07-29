import {
  assertGeoCoordinate,
  GeoCoordinate,
} from '../contracts';

const EARTH_RADIUS_METERS =
  6_371_008.8;

function degreesToRadians(
  degrees:
    number,
): number {
  return (
    degrees *
    Math.PI /
    180
  );
}

export function calculateGeoDistanceMeters(
  origin:
    GeoCoordinate,

  destination:
    GeoCoordinate,
): number {
  assertGeoCoordinate(
    origin,
  );

  assertGeoCoordinate(
    destination,
  );

  const latitudeDelta =
    degreesToRadians(
      destination.latitude -
      origin.latitude,
    );

  const longitudeDelta =
    degreesToRadians(
      destination.longitude -
      origin.longitude,
    );

  const originLatitude =
    degreesToRadians(
      origin.latitude,
    );

  const destinationLatitude =
    degreesToRadians(
      destination.latitude,
    );

  const haversine =
    Math.sin(
      latitudeDelta / 2,
    ) ** 2 +
    Math.cos(
      originLatitude,
    ) *
    Math.cos(
      destinationLatitude,
    ) *
    Math.sin(
      longitudeDelta / 2,
    ) ** 2;

  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(
        haversine,
      ),

      Math.sqrt(
        1 - haversine,
      ),
    );

  return (
    EARTH_RADIUS_METERS *
    angularDistance
  );
}
