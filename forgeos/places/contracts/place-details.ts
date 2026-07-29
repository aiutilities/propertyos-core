import {
  Place,
} from './place';

export interface PlaceDetailsRequest {
  placeId:
    string;

  providerName?:
    string;

  language?:
    string;
}

export interface PlaceDetailsResult {
  providerName:
    string;

  place?:
    Place;

  metadata?:
    Record<string, unknown>;
}
