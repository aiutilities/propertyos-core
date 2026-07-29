import {
  GeoBoundingBox,
} from './geometry';

import {
  MapPlace,
} from './place';

export interface GeocodeRequest {
  query:
    string;

  countryCode?:
    string;

  language?:
    string;

  limit?:
    number;

  bounds?:
    GeoBoundingBox;

  metadata?:
    Record<string, unknown>;
}

export interface GeocodeResult {
  providerName:
    string;

  places:
    readonly MapPlace[];

  metadata?:
    Record<string, unknown>;
}
