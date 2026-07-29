import {
  PlaceDetailsRequest,
  PlaceDetailsResult,
  PlaceNearbyRequest,
  PlaceNearbyResult,
  PlaceSearchRequest,
  PlaceSearchResult,
} from '../contracts';

export interface PlacesDispatchContext {
  correlationId?:
    string;

  metadata?:
    Record<string, unknown>;
}

export interface PlacesSearchDispatchInput
  extends PlacesDispatchContext
{
  providerName:
    string;

  request:
    PlaceSearchRequest;
}

export interface PlacesNearbyDispatchInput
  extends PlacesDispatchContext
{
  providerName:
    string;

  request:
    PlaceNearbyRequest;
}

export interface PlacesDetailsDispatchInput
  extends PlacesDispatchContext
{
  providerName:
    string;

  request:
    PlaceDetailsRequest;
}

export type PlacesSearchDispatchResult =
  PlaceSearchResult;

export type PlacesNearbyDispatchResult =
  PlaceNearbyResult;

export type PlacesDetailsDispatchResult =
  PlaceDetailsResult;
