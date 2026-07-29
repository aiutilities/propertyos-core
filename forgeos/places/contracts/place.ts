import {
  GeoCoordinate,
  MapAddress,
} from '@forgeos/maps';

import {
  PlaceCategory,
} from './place-category';

import {
  PlaceContact,
} from './place-contact';

import {
  PlaceOpeningHours,
} from './place-opening-hours';

export interface PlacePhoto {
  reference:
    string;

  width?:
    number;

  height?:
    number;

  attribution?:
    readonly string[];
}

export interface PlaceRating {
  value:
    number;

  reviewCount?:
    number;

  scale?:
    number;
}

export interface Place {
  id:
    string;

  providerName:
    string;

  name:
    string;

  coordinate:
    GeoCoordinate;

  address?:
    MapAddress;

  primaryCategory?:
    PlaceCategory;

  categories:
    readonly PlaceCategory[];

  providerCategories?:
    readonly string[];

  contact?:
    PlaceContact;

  openingHours?:
    PlaceOpeningHours;

  rating?:
    PlaceRating;

  photos?:
    readonly PlacePhoto[];

  distanceMeters?:
    number;

  permanentlyClosed?:
    boolean;

  metadata?:
    Record<string, unknown>;
}
