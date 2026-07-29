import {
  PlaceDetailsRequest,
  PlaceDetailsResult,
} from './place-details';

import {
  PlaceNearbyRequest,
  PlaceNearbyResult,
} from './place-nearby';

import {
  PlaceSearchRequest,
  PlaceSearchResult,
} from './place-search';

export const PLACES_PROVIDER_CAPABILITIES = [
  'PLACE_SEARCH',
  'NEARBY_SEARCH',
  'PLACE_DETAILS'
] as const;

export type PlacesProviderCapability =
  typeof PLACES_PROVIDER_CAPABILITIES[number];

export interface PlacesProvider {
  readonly name:
    string;

  readonly capabilities:
    readonly PlacesProviderCapability[];

  search?(
    request:
      PlaceSearchRequest,
  ): Promise<
    PlaceSearchResult
  >;

  nearby?(
    request:
      PlaceNearbyRequest,
  ): Promise<
    PlaceNearbyResult
  >;

  details?(
    request:
      PlaceDetailsRequest,
  ): Promise<
    PlaceDetailsResult
  >;
}
