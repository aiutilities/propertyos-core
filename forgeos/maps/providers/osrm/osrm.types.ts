import {
  MapTravelMode,
} from '../../contracts';

export interface OsrmConfigurationInput {
  endpoint?:
    string;

  timeoutMilliseconds?:
    number;

  userAgent?:
    string;

  profiles?:
    Partial<
      Record<
        MapTravelMode,
        string
      >
    >;
}

export interface OsrmConfiguration {
  status:
    'READY' |
    'BLOCKED';

  endpoint:
    string;

  timeoutMilliseconds:
    number;

  userAgent?:
    string;

  profiles:
    Partial<
      Record<
        MapTravelMode,
        string
      >
    >;

  errors:
    readonly string[];
}

export interface OsrmGeoJsonLineString {
  type:
    'LineString';

  coordinates:
    readonly (
      readonly [
        number,
        number,
      ]
    )[];
}

export interface OsrmManeuver {
  location?:
    readonly [
      number,
      number,
    ];

  type?:
    string;

  modifier?:
    string;

  instruction?:
    string;
}

export interface OsrmRouteStepResponse {
  distance:
    number;

  duration:
    number;

  name?:
    string;

  mode?:
    string;

  geometry?:
    OsrmGeoJsonLineString;

  maneuver?:
    OsrmManeuver;
}

export interface OsrmRouteLegResponse {
  distance:
    number;

  duration:
    number;

  steps?:
    readonly OsrmRouteStepResponse[];
}

export interface OsrmRouteResponse {
  distance:
    number;

  duration:
    number;

  weight?:
    number;

  weight_name?:
    string;

  geometry?:
    OsrmGeoJsonLineString;

  legs?:
    readonly OsrmRouteLegResponse[];
}

export interface OsrmRouteEnvelope {
  code:
    string;

  message?:
    string;

  routes?:
    readonly OsrmRouteResponse[];

  waypoints?:
    readonly unknown[];
}
