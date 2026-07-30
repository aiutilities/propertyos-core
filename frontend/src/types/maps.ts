export interface MapsCoordinate {
  latitude: number;
  longitude: number;
}

export interface MapsGeocodeInput {
  query: string;
  limit?: number;
  language?: string;
  countryCode?: string;
}

export interface MapsReverseGeocodeInput
  extends MapsCoordinate {}

export interface MapsRouteInput {
  origin: MapsCoordinate;
  destination: MapsCoordinate;
  profile?: string;
  alternatives?: boolean;
  steps?: boolean;
  overview?: string;
}

export type MapsResult =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

export interface MapsHealth {
  status?: string;
  healthy?: boolean;
  available?: boolean;
  provider?: string;
  providers?: Record<string, unknown>;
  [key: string]: unknown;
}

export const MAPS_CONTRACT = {
  latitudeField: "latitude",
  longitudeField: "longitude",
  geocodeQueryField: "query",
  routeOriginField: "origin",
  routeDestinationField: "destination",
} as const;
