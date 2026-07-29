import {
  assertGeoCoordinate,
  GeoCoordinate,
  GeoPolygon,
} from '../contracts';

const EPSILON =
  1e-10;

function isPointOnSegment(
  point:
    GeoCoordinate,

  start:
    GeoCoordinate,

  end:
    GeoCoordinate,
): boolean {
  const cross =
    (
      point.latitude -
      start.latitude
    ) *
    (
      end.longitude -
      start.longitude
    ) -
    (
      point.longitude -
      start.longitude
    ) *
    (
      end.latitude -
      start.latitude
    );

  if (
    Math.abs(
      cross,
    ) > EPSILON
  ) {
    return false;
  }

  const minimumLatitude =
    Math.min(
      start.latitude,
      end.latitude,
    ) - EPSILON;

  const maximumLatitude =
    Math.max(
      start.latitude,
      end.latitude,
    ) + EPSILON;

  const minimumLongitude =
    Math.min(
      start.longitude,
      end.longitude,
    ) - EPSILON;

  const maximumLongitude =
    Math.max(
      start.longitude,
      end.longitude,
    ) + EPSILON;

  return (
    point.latitude >=
      minimumLatitude &&
    point.latitude <=
      maximumLatitude &&
    point.longitude >=
      minimumLongitude &&
    point.longitude <=
      maximumLongitude
  );
}

function isInsideRing(
  point:
    GeoCoordinate,

  ring:
    readonly GeoCoordinate[],
): boolean {
  if (
    ring.length < 3
  ) {
    throw new Error(
      'INVALID_GEO_POLYGON: Polygon ring must contain at least three coordinates',
    );
  }

  let inside =
    false;

  for (
    let current = 0,
      previous =
        ring.length - 1;

    current <
      ring.length;

    previous =
      current++
  ) {
    const start =
      ring[previous];

    const end =
      ring[current];

    assertGeoCoordinate(
      start,
    );

    assertGeoCoordinate(
      end,
    );

    if (
      isPointOnSegment(
        point,
        start,
        end,
      )
    ) {
      return true;
    }

    const intersects =
      (
        start.latitude >
        point.latitude
      ) !==
      (
        end.latitude >
        point.latitude
      ) &&
      point.longitude <
        (
          (
            end.longitude -
            start.longitude
          ) *
          (
            point.latitude -
            start.latitude
          )
        ) /
        (
          end.latitude -
          start.latitude
        ) +
        start.longitude;

    if (intersects) {
      inside =
        !inside;
    }
  }

  return inside;
}

export function isCoordinateInsidePolygon(
  point:
    GeoCoordinate,

  polygon:
    GeoPolygon,
): boolean {
  assertGeoCoordinate(
    point,
  );

  if (
    !isInsideRing(
      point,
      polygon.exterior,
    )
  ) {
    return false;
  }

  return !(
    polygon.holes ?? []
  ).some(
    (hole) =>
      isInsideRing(
        point,
        hole,
      ),
  );
}
