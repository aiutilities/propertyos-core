import {
  GeoCoordinate,
  MapPlace,
  NearbyPlace,
} from '../contracts';

import {
  calculateGeoDistanceMeters,
} from './distance';

export interface FindNearbyPlacesInput {
  center:
    GeoCoordinate;

  places:
    readonly MapPlace[];

  radiusMeters?:
    number;

  limit?:
    number;
}

export function findNearbyPlaces(
  input:
    FindNearbyPlacesInput,
): NearbyPlace[] {
  if (
    input.radiusMeters !==
      undefined &&
    (
      !Number.isFinite(
        input.radiusMeters,
      ) ||
      input.radiusMeters < 0
    )
  ) {
    throw new Error(
      'INVALID_GEO_RADIUS: Radius must be a finite non-negative number',
    );
  }

  if (
    input.limit !==
      undefined &&
    (
      !Number.isInteger(
        input.limit,
      ) ||
      input.limit < 1
    )
  ) {
    throw new Error(
      'INVALID_GEO_LIMIT: Limit must be a positive integer',
    );
  }

  const places =
    input.places
      .map(
        (place): NearbyPlace => ({
          ...place,

          distanceMeters:
            calculateGeoDistanceMeters(
              input.center,
              place.coordinate,
            ),
        }),
      )
      .filter(
        (place) =>
          input.radiusMeters ===
            undefined ||
          place.distanceMeters <=
            input.radiusMeters,
      )
      .sort(
        (left, right) =>
          left.distanceMeters -
          right.distanceMeters,
      );

  return input.limit ===
    undefined
    ? places
    : places.slice(
        0,
        input.limit,
      );
}
