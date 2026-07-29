import {
  GeoCoordinate,
} from './coordinate';

export interface MapAddress {
  formattedAddress:
    string;

  addressLine1?:
    string;

  addressLine2?:
    string;

  locality?:
    string;

  district?:
    string;

  city?:
    string;

  state?:
    string;

  postalCode?:
    string;

  country?:
    string;

  countryCode?:
    string;
}

export interface MapPlace {
  id:
    string;

  providerName:
    string;

  name?:
    string;

  coordinate:
    GeoCoordinate;

  address:
    MapAddress;

  categories?:
    readonly string[];

  confidence?:
    number;

  metadata?:
    Record<string, unknown>;
}
