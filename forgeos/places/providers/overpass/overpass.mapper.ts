import {
  GeoCoordinate,
} from '@forgeos/maps';

import {
  Place,
  PlaceCategory,
} from '../../contracts';

import {
  OverpassElement,
  OverpassResponse,
} from './overpass.types';

const EARTH_RADIUS_METERS =
  6_371_000;

const CATEGORY_MAP:
  Readonly<
    Record<
      string,
      PlaceCategory
    >
  > = {
    'aeroway:aerodrome':
      'AIRPORT',

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

    'amenity:marketplace':
      'MARKET',

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

    'highway:bus_stop':
      'BUS_STOP',

    'leisure:fitness_centre':
      'GYM',

    'leisure:park':
      'PARK',

    'office:government':
      'GOVERNMENT_OFFICE',

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

    'tourism:attraction':
      'LANDMARK',

    'tourism:guest_house':
      'ACCOMMODATION',

    'tourism:hostel':
      'ACCOMMODATION',

    'tourism:hotel':
      'HOTEL',
  };

function radians(
  value:
    number,
): number {
  return (
    value *
    Math.PI /
    180
  );
}

function distanceMeters(
  origin:
    GeoCoordinate,

  destination:
    GeoCoordinate,
): number {
  const latitudeDelta =
    radians(
      destination.latitude -
      origin.latitude,
    );

  const longitudeDelta =
    radians(
      destination.longitude -
      origin.longitude,
    );

  const originLatitude =
    radians(
      origin.latitude,
    );

  const destinationLatitude =
    radians(
      destination.latitude,
    );

  const value =
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

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(
      Math.sqrt(value),
      Math.sqrt(
        1 - value,
      ),
    )
  );
}

function coordinateOf(
  element:
    OverpassElement,
): GeoCoordinate | undefined {
  const latitude =
    element.lat ??
    element.center?.lat;

  const longitude =
    element.lon ??
    element.center?.lon;

  if (
    typeof latitude !==
      'number' ||
    typeof longitude !==
      'number' ||
    !Number.isFinite(
      latitude,
    ) ||
    !Number.isFinite(
      longitude,
    )
  ) {
    return undefined;
  }

  return {
    latitude,
    longitude,
  };
}

function categoryOf(
  tags:
    Record<
      string,
      string
    >,
): PlaceCategory {
  for (
    const [
      key,
      value,
    ] of
      Object.entries(
        tags,
      )
  ) {
    const category =
      CATEGORY_MAP[
        `${key}:${value}`
      ];

    if (category) {
      return category;
    }
  }

  if (
    tags.amenity ===
      'place_of_worship' &&
    tags.religion ===
      'hindu'
  ) {
    return 'TEMPLE';
  }

  return 'OTHER';
}

function formattedAddress(
  tags:
    Record<
      string,
      string
    >,
): string {
  const addressLine1 =
    [
      tags['addr:housenumber'],
      tags['addr:street'],
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

  return [
    addressLine1,
    tags['addr:suburb'],
    tags['addr:city'],
    tags['addr:state'],
    tags['addr:postcode'],
    tags['addr:country'],
  ]
    .filter(Boolean)
    .join(', ');
}

export function mapOverpassElement(
  element:
    OverpassElement,

  origin:
    GeoCoordinate,

  providerName:
    string,
): Place | undefined {
  const coordinate =
    coordinateOf(
      element,
    );

  if (!coordinate) {
    return undefined;
  }

  const tags =
    element.tags ??
    {};

  const name =
    tags.name ??
    tags.brand ??
    tags.operator ??
    'Unnamed place';

  const primaryCategory =
    categoryOf(
      tags,
    );

  const addressLine1 =
    [
      tags['addr:housenumber'],
      tags['addr:street'],
    ]
      .filter(Boolean)
      .join(' ')
      .trim() ||
    undefined;

  const providerCategories =
    Object.entries(
      tags,
    )
      .filter(
        (
          [
            key,
          ],
        ) =>
          [
            'aeroway',
            'amenity',
            'highway',
            'leisure',
            'office',
            'railway',
            'shop',
            'tourism',
          ].includes(
            key,
          ),
      )
      .map(
        (
          [
            key,
            value,
          ],
        ) =>
          `${key}:${value}`,
      );

  const phone =
    tags.phone ??
    tags['contact:phone'];

  const email =
    tags.email ??
    tags['contact:email'];

  const website =
    tags.website ??
    tags['contact:website'];

  const openingHours =
    tags.opening_hours;

  return {
    id:
      `${element.type}:${element.id}`,

    providerName,

    name,

    coordinate,

    address: {
      formattedAddress:
        formattedAddress(
          tags,
        ),

      addressLine1,

      locality:
        tags['addr:suburb'],

      district:
        tags['addr:district'],

      city:
        tags['addr:city'],

      state:
        tags['addr:state'],

      postalCode:
        tags['addr:postcode'],

      country:
        tags['addr:country'],

      countryCode:
        tags['addr:country']
          ?.toUpperCase(),
    },

    primaryCategory,

    categories: [
      primaryCategory,
    ],

    providerCategories,

    contact:
      phone ||
      email ||
      website
        ? {
            phone,
            email,
            website,
          }
        : undefined,

    openingHours:
      openingHours
        ? {
            weekdayText: [
              openingHours,
            ],
          }
        : undefined,

    distanceMeters:
      distanceMeters(
        origin,
        coordinate,
      ),

    metadata: {
      osmType:
        element.type,

      osmId:
        element.id,

      tags,
    },
  };
}

export function isOverpassResponse(
  value:
    unknown,
): value is OverpassResponse {
  if (
    typeof value !==
      'object' ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as {
      elements?:
        unknown;
    };

  return Array.isArray(
    candidate.elements,
  );
}
