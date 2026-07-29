import {
  GeocodeRequest,
  GeocodeResult,
  NearbySearchRequest,
  NearbySearchResult,
  ReverseGeocodeRequest,
  ReverseGeocodeResult,
  RouteRequest,
  RouteResult,
} from '../contracts';

export interface MapsDispatchContext {
  providerName:
    string;

  correlationId?:
    string;

  metadata?:
    Record<string, unknown>;
}

export interface DispatchGeocodeInput
  extends MapsDispatchContext
{
  request:
    GeocodeRequest;
}

export interface DispatchReverseGeocodeInput
  extends MapsDispatchContext
{
  request:
    ReverseGeocodeRequest;
}

export interface DispatchRouteInput
  extends MapsDispatchContext
{
  request:
    RouteRequest;
}

export interface DispatchNearbySearchInput
  extends MapsDispatchContext
{
  request:
    NearbySearchRequest;
}

export interface MapsDispatchSuccess<
  TResult,
> {
  success:
    true;

  providerName:
    string;

  result:
    TResult;
}

export interface MapsDispatchFailure {
  success:
    false;

  providerName:
    string;

  errorCode:
    string;

  errorMessage:
    string;

  retryable:
    boolean;
}

export type MapsDispatchResult<
  TResult,
> =
  | MapsDispatchSuccess<TResult>
  | MapsDispatchFailure;

export type GeocodeDispatchResult =
  MapsDispatchResult<
    GeocodeResult
  >;

export type ReverseGeocodeDispatchResult =
  MapsDispatchResult<
    ReverseGeocodeResult
  >;

export type RouteDispatchResult =
  MapsDispatchResult<
    RouteResult
  >;

export type NearbySearchDispatchResult =
  MapsDispatchResult<
    NearbySearchResult
  >;
