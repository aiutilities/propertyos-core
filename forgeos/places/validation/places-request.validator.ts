import {
  PLACE_CATEGORIES,
  PlaceDetailsRequest,
  PlaceNearbyRequest,
  PlaceSearchRequest,
} from '../contracts';

function isValidCoordinate(
  coordinate:
    unknown,
): coordinate is {
  latitude:
    number;

  longitude:
    number;
} {
  if (
    typeof coordinate !==
      'object' ||
    coordinate === null
  ) {
    return false;
  }

  const candidate =
    coordinate as {
      latitude?:
        unknown;

      longitude?:
        unknown;
    };

  return (
    typeof candidate.latitude ===
      'number' &&
    Number.isFinite(
      candidate.latitude,
    ) &&
    candidate.latitude >=
      -90 &&
    candidate.latitude <=
      90 &&
    typeof candidate.longitude ===
      'number' &&
    Number.isFinite(
      candidate.longitude,
    ) &&
    candidate.longitude >=
      -180 &&
    candidate.longitude <=
      180
  );
}

import {
  PlacesRequestValidationError,
} from './places-request-validation.error';

function validateLimit(
  limit:
    number | undefined,

  errors:
    string[],
): void {
  if (
    limit !== undefined &&
    (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    )
  ) {
    errors.push(
      'limit must be an integer between 1 and 100',
    );
  }
}

function validateRadius(
  radiusMeters:
    number | undefined,

  errors:
    string[],

  required:
    boolean,
): void {
  if (
    required &&
    radiusMeters === undefined
  ) {
    errors.push(
      'radiusMeters is required',
    );

    return;
  }

  if (
    radiusMeters !== undefined &&
    (
      !Number.isFinite(
        radiusMeters,
      ) ||
      radiusMeters <= 0 ||
      radiusMeters > 50_000
    )
  ) {
    errors.push(
      'radiusMeters must be between 1 and 50000',
    );
  }
}

function validateCategories(
  categories:
    readonly string[] |
    undefined,

  errors:
    string[],
): void {
  if (!categories) {
    return;
  }

  if (
    categories.length === 0
  ) {
    errors.push(
      'categories must not be empty when provided',
    );

    return;
  }

  for (
    const category of
      categories
  ) {
    if (
      !PLACE_CATEGORIES.includes(
        category as
          typeof PLACE_CATEGORIES[number],
      )
    ) {
      errors.push(
        `unsupported place category: ${category}`,
      );
    }
  }
}

export function validatePlaceSearchRequest(
  request:
    PlaceSearchRequest,
): void {
  const errors:
    string[] = [];

  if (
    typeof request.query !==
      'string' ||
    request.query.trim()
      .length < 2
  ) {
    errors.push(
      'query must contain at least 2 characters',
    );
  }

  if (
    request.coordinateBias &&
    !isValidCoordinate(
      request.coordinateBias,
    )
  ) {
    errors.push(
      'coordinateBias must be a valid coordinate',
    );
  }

  validateRadius(
    request.radiusMeters,
    errors,
    false,
  );

  validateCategories(
    request.categories,
    errors,
  );

  validateLimit(
    request.limit,
    errors,
  );

  if (
    request.countryCode !==
      undefined &&
    !/^[A-Za-z]{2}$/.test(
      request.countryCode,
    )
  ) {
    errors.push(
      'countryCode must contain two letters',
    );
  }

  if (
    errors.length > 0
  ) {
    throw new PlacesRequestValidationError(
      errors,
    );
  }
}

export function validatePlaceNearbyRequest(
  request:
    PlaceNearbyRequest,
): void {
  const errors:
    string[] = [];

  if (
    !isValidCoordinate(
      request.coordinate,
    )
  ) {
    errors.push(
      'coordinate must be valid',
    );
  }

  validateRadius(
    request.radiusMeters,
    errors,
    true,
  );

  validateCategories(
    request.categories,
    errors,
  );

  validateLimit(
    request.limit,
    errors,
  );

  if (
    request.keyword !==
      undefined &&
    request.keyword.trim()
      .length < 2
  ) {
    errors.push(
      'keyword must contain at least 2 characters',
    );
  }

  if (
    errors.length > 0
  ) {
    throw new PlacesRequestValidationError(
      errors,
    );
  }
}

export function validatePlaceDetailsRequest(
  request:
    PlaceDetailsRequest,
): void {
  const errors:
    string[] = [];

  if (
    typeof request.placeId !==
      'string' ||
    request.placeId.trim()
      .length === 0
  ) {
    errors.push(
      'placeId is required',
    );
  }

  if (
    request.providerName !==
      undefined &&
    request.providerName.trim()
      .length === 0
  ) {
    errors.push(
      'providerName must not be empty',
    );
  }

  if (
    errors.length > 0
  ) {
    throw new PlacesRequestValidationError(
      errors,
    );
  }
}
