import {
  GeoCoordinate,
} from './coordinate';

import {
  MapPlace,
} from './place';

export interface ReverseGeocodeRequest {
  coordinate:
    GeoCoordinate;

  language?:
    string;

  limit?:
    number;

  metadata?:
    Record<string, unknown>;
}

export interface ReverseGeocodeResult {
  providerName:
    string;

  places:
    readonly MapPlace[];

  metadata?:
    Record<string, unknown>;
}
