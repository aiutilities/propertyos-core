import {
  GeoCoordinate,
} from './coordinate';

export const MAP_TRAVEL_MODES = [
  'DRIVING',
  'WALKING',
  'CYCLING',
  'TRANSIT',
] as const;

export type MapTravelMode =
  (typeof MAP_TRAVEL_MODES)[number];

export interface RouteRequest {
  origin:
    GeoCoordinate;

  destination:
    GeoCoordinate;

  waypoints?:
    readonly GeoCoordinate[];

  travelMode?:
    MapTravelMode;

  departureTime?:
    string;

  alternatives?:
    boolean;

  metadata?:
    Record<string, unknown>;
}

export interface RouteStep {
  instruction?:
    string;

  distanceMeters:
    number;

  durationSeconds:
    number;

  start:
    GeoCoordinate;

  end:
    GeoCoordinate;

  geometry?:
    readonly GeoCoordinate[];
}

export interface MapRoute {
  id:
    string;

  providerName:
    string;

  distanceMeters:
    number;

  durationSeconds:
    number;

  geometry:
    readonly GeoCoordinate[];

  steps?:
    readonly RouteStep[];

  metadata?:
    Record<string, unknown>;
}

export interface RouteResult {
  providerName:
    string;

  routes:
    readonly MapRoute[];

  metadata?:
    Record<string, unknown>;
}
