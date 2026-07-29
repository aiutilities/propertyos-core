export interface NominatimConfigurationInput {
  endpoint?:
    string;

  userAgent?:
    string;

  email?:
    string;

  timeoutMilliseconds?:
    number;

  minimumRequestIntervalMilliseconds?:
    number;
}

export interface NominatimConfiguration {
  status:
    'READY' |
    'BLOCKED';

  endpoint:
    string;

  userAgent?:
    string;

  email?:
    string;

  timeoutMilliseconds:
    number;

  minimumRequestIntervalMilliseconds:
    number;

  errors:
    readonly string[];
}

export interface NominatimAddressResponse {
  house_number?:
    string;

  road?:
    string;

  pedestrian?:
    string;

  footway?:
    string;

  neighbourhood?:
    string;

  suburb?:
    string;

  city_district?:
    string;

  city?:
    string;

  town?:
    string;

  village?:
    string;

  municipality?:
    string;

  county?:
    string;

  state?:
    string;

  postcode?:
    string;

  country?:
    string;

  country_code?:
    string;
}

export interface NominatimPlaceResponse {
  place_id:
    number | string;

  osm_type?:
    string;

  osm_id?:
    number | string;

  lat:
    string;

  lon:
    string;

  display_name:
    string;

  name?:
    string;

  type?:
    string;

  category?:
    string;

  importance?:
    number;

  boundingbox?:
    readonly string[];

  address?:
    NominatimAddressResponse;

  extratags?:
    Record<string, string>;

  namedetails?:
    Record<string, string>;
}

export interface NominatimErrorResponse {
  error?:
    string;
}
