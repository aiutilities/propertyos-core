import {
  GeoCoordinate,
} from './coordinate';

import {
  MapPlace,
} from './place';

export interface NearbySearchRequest {
  center:
    GeoCoordinate;

  radiusMeters:
    number;

  query?:
    string;

  categories?:
    readonly string[];

  limit?:
    number;

  language?:
    string;

  metadata?:
    Record<string, unknown>;
}

export interface NearbyPlace extends MapPlace {
  distanceMeters:
    number;
}

export interface NearbySearchResult {
  providerName:
    string;

  places:
    readonly NearbyPlace[];

  metadata?:
    Record<string, unknown>;
}
