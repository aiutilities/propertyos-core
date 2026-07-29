export interface GeoCoordinate {
  latitude:
    number;

  longitude:
    number;
}

export interface GeoCoordinateValidationResult {
  valid:
    boolean;

  errors:
    readonly string[];
}

export function validateGeoCoordinate(
  coordinate:
    GeoCoordinate,
): GeoCoordinateValidationResult {
  const errors:
    string[] = [];

  if (
    !Number.isFinite(
      coordinate.latitude,
    ) ||
    coordinate.latitude < -90 ||
    coordinate.latitude > 90
  ) {
    errors.push(
      'Latitude must be a finite number between -90 and 90',
    );
  }

  if (
    !Number.isFinite(
      coordinate.longitude,
    ) ||
    coordinate.longitude < -180 ||
    coordinate.longitude > 180
  ) {
    errors.push(
      'Longitude must be a finite number between -180 and 180',
    );
  }

  return {
    valid:
      errors.length === 0,

    errors,
  };
}

export function assertGeoCoordinate(
  coordinate:
    GeoCoordinate,
): void {
  const result =
    validateGeoCoordinate(
      coordinate,
    );

  if (!result.valid) {
    throw new Error(
      `INVALID_GEO_COORDINATE: ${result.errors.join('; ')}`,
    );
  }
}
