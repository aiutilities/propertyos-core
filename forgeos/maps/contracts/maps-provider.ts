import {
  GeocodeRequest,
  GeocodeResult,
} from './geocoding';

import {
  NearbySearchRequest,
  NearbySearchResult,
} from './nearby';

import {
  ReverseGeocodeRequest,
  ReverseGeocodeResult,
} from './reverse-geocoding';

import {
  RouteRequest,
  RouteResult,
} from './route';

export const MAP_PROVIDER_CAPABILITIES = [
  'GEOCODING',
  'REVERSE_GEOCODING',
  'ROUTING',
  'NEARBY_SEARCH',
] as const;

export type MapProviderCapability =
  (typeof MAP_PROVIDER_CAPABILITIES)[number];

export interface MapsProvider {
  readonly name:
    string;

  readonly capabilities:
    readonly MapProviderCapability[];

  geocode?(
    request:
      GeocodeRequest,
  ): Promise<
    GeocodeResult
  >;

  reverseGeocode?(
    request:
      ReverseGeocodeRequest,
  ): Promise<
    ReverseGeocodeResult
  >;

  route?(
    request:
      RouteRequest,
  ): Promise<
    RouteResult
  >;

  nearbySearch?(
    request:
      NearbySearchRequest,
  ): Promise<
    NearbySearchResult
  >;
}
