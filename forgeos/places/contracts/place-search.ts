import {
  GeoBoundingBox,
  GeoCoordinate,
} from '@forgeos/maps';

import {
  Place,
} from './place';

import {
  PlaceCategory,
} from './place-category';

export interface PlaceSearchRequest {
  query:
    string;

  coordinateBias?:
    GeoCoordinate;

  radiusMeters?:
    number;

  bounds?:
    GeoBoundingBox;

  categories?:
    readonly PlaceCategory[];

  countryCode?:
    string;

  language?:
    string;

  limit?:
    number;
}

export interface PlaceSearchResult {
  providerName:
    string;

  places:
    readonly Place[];

  nextPageToken?:
    string;

  metadata?:
    Record<string, unknown>;
}
