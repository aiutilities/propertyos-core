import {
  GeoCoordinate,
} from '@forgeos/maps';

import {
  Place,
} from './place';

import {
  PlaceCategory,
} from './place-category';

export interface PlaceNearbyRequest {
  coordinate:
    GeoCoordinate;

  radiusMeters:
    number;

  categories?:
    readonly PlaceCategory[];

  keyword?:
    string;

  language?:
    string;

  limit?:
    number;
}

export interface PlaceNearbyResult {
  providerName:
    string;

  places:
    readonly Place[];

  nextPageToken?:
    string;

  metadata?:
    Record<string, unknown>;
}
