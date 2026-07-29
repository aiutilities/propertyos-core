import {
  Place,
  PlaceCategory,
} from '../../contracts';

import {
  PhotonFeature,
  PhotonFeatureCollection,
} from './photon.types';

const CATEGORY_MAP:
  Readonly<
    Record<
      string,
      PlaceCategory
    >
  > = {
    'amenity:atm':
      'ATM',

    'amenity:bank':
      'BANK',

    'amenity:bar':
      'BAR',

    'amenity:cafe':
      'CAFE',

    'amenity:charging_station':
      'CHARGING_STATION',

    'amenity:cinema':
      'CINEMA',

    'amenity:clinic':
      'CLINIC',

    'amenity:college':
      'COLLEGE',

    'amenity:community_centre':
      'COMMUNITY_CENTRE',

    'amenity:dentist':
      'DENTIST',

    'amenity:fire_station':
      'FIRE_STATION',

    'amenity:fuel':
      'FUEL_STATION',

    'amenity:hospital':
      'HOSPITAL',

    'amenity:library':
      'LIBRARY',

    'amenity:parking':
      'PARKING',

    'amenity:pharmacy':
      'PHARMACY',

    'amenity:police':
      'POLICE_STATION',

    'amenity:post_office':
      'POST_OFFICE',

    'amenity:restaurant':
      'RESTAURANT',

    'amenity:school':
      'SCHOOL',

    'amenity:theatre':
      'THEATRE',

    'amenity:university':
      'UNIVERSITY',

    'amenity:veterinary':
      'VETERINARY_CLINIC',

    'building:hotel':
      'HOTEL',

    'leisure:fitness_centre':
      'GYM',

    'leisure:park':
      'PARK',

    'place_of_worship:hindu':
      'TEMPLE',

    'railway:station':
      'RAILWAY_STATION',

    'railway:subway_entrance':
      'METRO_STATION',

    'shop:convenience':
      'CONVENIENCE_STORE',

    'shop:mall':
      'SHOPPING_MALL',

    'shop:supermarket':
      'SUPERMARKET',

    'tourism:hotel':
      'HOTEL',
  };

function asTrimmedString(
  value:
    unknown,
): string | undefined {
  return typeof value ===
    'string' &&
    value.trim()
      .length > 0
    ? value.trim()
    : undefined;
}

function resolveCategory(
  osmKey:
    string | undefined,

  osmValue:
    string | undefined,
): PlaceCategory {
  if (
    osmKey &&
    osmValue
  ) {
    const exact =
      CATEGORY_MAP[
        `${osmKey}:${osmValue}`
      ];

    if (exact) {
      return exact;
    }
  }

  if (
    osmValue ===
      'bus_stop'
  ) {
    return 'BUS_STOP';
  }

  if (
    osmValue ===
      'airport' ||
    osmValue ===
      'aerodrome'
  ) {
    return 'AIRPORT';
  }

  return 'OTHER';
}

function resolveName(
  feature:
    PhotonFeature,
): string {
  const properties =
    feature.properties;

  return (
    asTrimmedString(
      properties.name,
    ) ??
    asTrimmedString(
      properties.street,
    ) ??
    asTrimmedString(
      properties.city,
    ) ??
    asTrimmedString(
      properties.district,
    ) ??
    asTrimmedString(
      properties.country,
    ) ??
    'Unnamed place'
  );
}

function resolveId(
  feature:
    PhotonFeature,
): string {
  const properties =
    feature.properties;

  if (
    properties.osm_type !==
      undefined &&
    properties.osm_id !==
      undefined
  ) {
    return [
      properties.osm_type,
      properties.osm_id,
    ].join(':');
  }

  const [
    longitude,
    latitude,
  ] =
    feature.geometry
      .coordinates;

  return [
    'photon',
    longitude,
    latitude,
    resolveName(
      feature,
    ),
  ].join(':');
}

export function mapPhotonFeature(
  feature:
    PhotonFeature,

  providerName:
    string,
): Place {
  const properties =
    feature.properties;

  const [
    longitude,
    latitude,
  ] =
    feature.geometry
      .coordinates;

  const primaryCategory =
    resolveCategory(
      properties.osm_key,
      properties.osm_value,
    );

  const addressLine1 =
    [
      properties.housenumber,
      properties.street,
    ]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    undefined;

  const formattedAddress =
    [
      addressLine1,
      properties.district,
      properties.city,
      properties.state,
      properties.postcode,
      properties.country,
    ]
      .filter(
        (
          value,
        ): value is string =>
          Boolean(
            value &&
            value.trim(),
          ),
      )
      .join(', ');

  return {
    id:
      resolveId(
        feature,
      ),

    providerName,

    name:
      resolveName(
        feature,
      ),

    coordinate: {
      latitude,
      longitude,
    },

    address: {
      formattedAddress,

      addressLine1,

      locality:
        properties.district,

      district:
        properties.county,

      city:
        properties.city,

      state:
        properties.state,

      postalCode:
        properties.postcode,

      country:
        properties.country,

      countryCode:
        properties.countrycode
          ?.toUpperCase(),
    },

    primaryCategory,

    categories: [
      primaryCategory,
    ],

    providerCategories:
      [
        properties.osm_key,
        properties.osm_value,
      ]
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        ),

    metadata: {
      osmKey:
        properties.osm_key,

      osmValue:
        properties.osm_value,

      osmType:
        properties.osm_type,

      osmId:
        properties.osm_id,

      extent:
        properties.extent,

      extra:
        properties.extra,

      photonType:
        properties.type,
    },
  };
}

export function isPhotonFeature(
  value:
    unknown,
): value is PhotonFeature {
  if (
    typeof value !==
      'object' ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as {
      type?:
        unknown;

      geometry?:
        unknown;

      properties?:
        unknown;
    };

  if (
    candidate.type !==
      'Feature' ||
    typeof candidate.geometry !==
      'object' ||
    candidate.geometry ===
      null ||
    typeof candidate.properties !==
      'object' ||
    candidate.properties ===
      null
  ) {
    return false;
  }

  const geometry =
    candidate.geometry as {
      type?:
        unknown;

      coordinates?:
        unknown;
    };

  return (
    geometry.type ===
      'Point' &&
    Array.isArray(
      geometry.coordinates,
    ) &&
    geometry.coordinates.length >=
      2 &&
    geometry.coordinates.every(
      (coordinate) =>
        typeof coordinate ===
          'number' &&
        Number.isFinite(
          coordinate,
        ),
    )
  );
}

export function isPhotonFeatureCollection(
  value:
    unknown,
): value is PhotonFeatureCollection {
  if (
    typeof value !==
      'object' ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as {
      type?:
        unknown;

      features?:
        unknown;
    };

  return (
    candidate.type ===
      'FeatureCollection' &&
    Array.isArray(
      candidate.features,
    )
  );
}
