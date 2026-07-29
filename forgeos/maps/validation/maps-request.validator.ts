import {
  GeocodeRequest,
  GeoCoordinate,
  NearbySearchRequest,
  ReverseGeocodeRequest,
  RouteRequest,
  validateGeoCoordinate,
} from '../contracts';

import {
  MapsRequestValidationError,
} from './maps-request-validation.error';

function coordinateErrors(
  fieldName:
    string,

  coordinate:
    GeoCoordinate,
): string[] {
  return validateGeoCoordinate(
    coordinate,
  ).errors.map(
    (error) =>
      `${fieldName}: ${error}`,
  );
}

function validateOptionalLimit(
  limit:
    number | undefined,

  errors:
    string[],
): void {
  if (
    limit !== undefined &&
    (
      !Number.isInteger(
        limit,
      ) ||
      limit < 1 ||
      limit > 100
    )
  ) {
    errors.push(
      'Limit must be an integer between 1 and 100',
    );
  }
}

function validateOptionalLanguage(
  language:
    string | undefined,

  errors:
    string[],
): void {
  if (
    language !== undefined &&
    (
      language.trim().length < 2 ||
      language.trim().length > 20
    )
  ) {
    errors.push(
      'Language must contain between 2 and 20 characters',
    );
  }
}

export function validateGeocodeRequest(
  request:
    GeocodeRequest,
): void {
  const errors:
    string[] = [];

  if (
    typeof request.query !==
      'string' ||
    request.query.trim().length < 2
  ) {
    errors.push(
      'Geocode query must contain at least two characters',
    );
  }

  if (
    request.countryCode !==
      undefined &&
    !/^[A-Za-z]{2}$/.test(
      request.countryCode,
    )
  ) {
    errors.push(
      'Country code must use the ISO 3166-1 alpha-2 format',
    );
  }

  validateOptionalLimit(
    request.limit,
    errors,
  );

  validateOptionalLanguage(
    request.language,
    errors,
  );

  if (request.bounds) {
    errors.push(
      ...coordinateErrors(
        'Bounds south-west',
        request.bounds
          .southWest,
      ),

      ...coordinateErrors(
        'Bounds north-east',
        request.bounds
          .northEast,
      ),
    );

    if (
      request.bounds
        .southWest
        .latitude >
      request.bounds
        .northEast
        .latitude
    ) {
      errors.push(
        'Bounds south-west latitude must not exceed north-east latitude',
      );
    }
  }

  if (
    errors.length > 0
  ) {
    throw new MapsRequestValidationError(
      'geocode',
      errors,
    );
  }
}

export function validateReverseGeocodeRequest(
  request:
    ReverseGeocodeRequest,
): void {
  const errors = [
    ...coordinateErrors(
      'Coordinate',
      request.coordinate,
    ),
  ];

  validateOptionalLimit(
    request.limit,
    errors,
  );

  validateOptionalLanguage(
    request.language,
    errors,
  );

  if (
    errors.length > 0
  ) {
    throw new MapsRequestValidationError(
      'reverse-geocode',
      errors,
    );
  }
}

export function validateRouteRequest(
  request:
    RouteRequest,
): void {
  const errors = [
    ...coordinateErrors(
      'Origin',
      request.origin,
    ),

    ...coordinateErrors(
      'Destination',
      request.destination,
    ),
  ];

  for (
    const [
      index,
      waypoint,
    ] of (
      request.waypoints ??
      []
    ).entries()
  ) {
    errors.push(
      ...coordinateErrors(
        `Waypoint ${index}`,
        waypoint,
      ),
    );
  }

  if (
    (
      request.waypoints ??
      []
    ).length > 25
  ) {
    errors.push(
      'Route cannot contain more than 25 waypoints',
    );
  }

  if (
    request.departureTime !==
      undefined &&
    Number.isNaN(
      Date.parse(
        request.departureTime,
      ),
    )
  ) {
    errors.push(
      'Departure time must be a valid ISO date-time value',
    );
  }

  if (
    errors.length > 0
  ) {
    throw new MapsRequestValidationError(
      'route',
      errors,
    );
  }
}

export function validateNearbySearchRequest(
  request:
    NearbySearchRequest,
): void {
  const errors = [
    ...coordinateErrors(
      'Center',
      request.center,
    ),
  ];

  if (
    !Number.isFinite(
      request.radiusMeters,
    ) ||
    request.radiusMeters <= 0 ||
    request.radiusMeters >
      100_000
  ) {
    errors.push(
      'Nearby radius must be greater than zero and no more than 100000 metres',
    );
  }

  validateOptionalLimit(
    request.limit,
    errors,
  );

  validateOptionalLanguage(
    request.language,
    errors,
  );

  if (
    request.query !==
      undefined &&
    request.query
      .trim()
      .length < 2
  ) {
    errors.push(
      'Nearby query must contain at least two characters',
    );
  }

  if (
    request.categories !==
      undefined &&
    request.categories.some(
      (category) =>
        category
          .trim()
          .length === 0,
    )
  ) {
    errors.push(
      'Nearby categories must not contain empty values',
    );
  }

  if (
    errors.length > 0
  ) {
    throw new MapsRequestValidationError(
      'nearby-search',
      errors,
    );
  }
}
