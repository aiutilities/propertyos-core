import {
  MapAddress,
  MapPlace,
} from '../../contracts';

import {
  NominatimAddressResponse,
  NominatimPlaceResponse,
} from './nominatim.types';

function firstDefined(
  ...values:
    (
      string |
      undefined
    )[]
): string | undefined {
  return values.find(
    (value) =>
      value !== undefined &&
      value.trim().length > 0,
  );
}

function mapAddress(
  place:
    NominatimPlaceResponse,
): MapAddress {
  const address =
    place.address ?? {};

  const road =
    firstDefined(
      address.road,
      address.pedestrian,
      address.footway,
    );

  const addressLine1 =
    [
      address.house_number,
      road,
    ]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    undefined;

  return {
    formattedAddress:
      place.display_name,

    addressLine1,

    locality:
      firstDefined(
        address.neighbourhood,
        address.suburb,
      ),

    district:
      firstDefined(
        address.city_district,
        address.county,
      ),

    city:
      firstDefined(
        address.city,
        address.town,
        address.village,
        address.municipality,
      ),

    state:
      address.state,

    postalCode:
      address.postcode,

    country:
      address.country,

    countryCode:
      address.country_code
        ?.toUpperCase(),
  };
}

function parseCoordinate(
  value:
    string,

  fieldName:
    string,
): number {
  const parsed =
    Number(value);

  if (
    !Number.isFinite(parsed)
  ) {
    throw new Error(
      `INVALID_NOMINATIM_RESPONSE: ${fieldName} must be numeric`,
    );
  }

  return parsed;
}

export function mapNominatimPlace(
  place:
    NominatimPlaceResponse,

  providerName:
    string,
): MapPlace {
  const categories =
    [
      place.category,
      place.type,
    ]
      .filter(
        (
          value,
        ): value is string =>
          Boolean(value),
      );

  return {
    id:
      String(
        place.place_id,
      ),

    providerName,

    name:
      place.name,

    coordinate: {
      latitude:
        parseCoordinate(
          place.lat,
          'latitude',
        ),

      longitude:
        parseCoordinate(
          place.lon,
          'longitude',
        ),
    },

    address:
      mapAddress(place),

    categories:
      categories.length > 0
        ? categories
        : undefined,

    confidence:
      place.importance,

    metadata: {
      osmType:
        place.osm_type,

      osmId:
        place.osm_id,

      boundingBox:
        place.boundingbox,

      extraTags:
        place.extratags,

      nameDetails:
        place.namedetails,
    },
  };
}

export function isNominatimPlaceResponse(
  value:
    unknown,
): value is NominatimPlaceResponse {
  if (
    typeof value !==
      'object' ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as Record<
      string,
      unknown
    >;

  return (
    (
      typeof candidate.place_id ===
        'number' ||
      typeof candidate.place_id ===
        'string'
    ) &&
    typeof candidate.lat ===
      'string' &&
    typeof candidate.lon ===
      'string' &&
    typeof candidate.display_name ===
      'string'
  );
}

export function isNominatimAddressResponse(
  value:
    unknown,
): value is NominatimAddressResponse {
  return (
    typeof value ===
      'object' &&
    value !== null
  );
}
