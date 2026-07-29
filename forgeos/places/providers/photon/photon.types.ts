export interface PhotonConfigurationInput {
  endpoint?:
    string;

  timeoutMilliseconds?:
    number;

  userAgent?:
    string;
}

export interface PhotonConfiguration {
  status:
    'READY' |
    'BLOCKED';

  endpoint:
    string;

  timeoutMilliseconds:
    number;

  userAgent:
    string;

  errors:
    readonly string[];
}

export interface PhotonGeometry {
  type:
    'Point';

  coordinates:
    readonly [
      number,
      number,
    ];
}

export interface PhotonFeatureProperties {
  name?:
    string;

  street?:
    string;

  housenumber?:
    string;

  postcode?:
    string;

  district?:
    string;

  city?:
    string;

  county?:
    string;

  state?:
    string;

  country?:
    string;

  countrycode?:
    string;

  osm_key?:
    string;

  osm_value?:
    string;

  osm_type?:
    string;

  osm_id?:
    number | string;

  type?:
    string;

  extent?:
    readonly number[];

  extra?:
    Record<string, unknown>;
}

export interface PhotonFeature {
  type:
    'Feature';

  geometry:
    PhotonGeometry;

  properties:
    PhotonFeatureProperties;
}

export interface PhotonFeatureCollection {
  type:
    'FeatureCollection';

  features:
    readonly PhotonFeature[];
}
