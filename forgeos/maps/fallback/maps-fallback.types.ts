import {
  GeocodeResult,
  NearbySearchResult,
  ReverseGeocodeResult,
  RouteResult,
} from '../contracts';

export interface MapsProviderAttempt {
  providerName:
    string;

  success:
    boolean;

  errorCode?:
    string;

  errorMessage?:
    string;

  retryable?:
    boolean;
}

export interface MapsFallbackSuccess<
  TResult,
> {
  success:
    true;

  providerName:
    string;

  result:
    TResult;

  attempts:
    readonly MapsProviderAttempt[];
}

export interface MapsFallbackFailure {
  success:
    false;

  errorCode:
    string;

  errorMessage:
    string;

  retryable:
    boolean;

  attempts:
    readonly MapsProviderAttempt[];
}

export type MapsFallbackResult<
  TResult,
> =
  | MapsFallbackSuccess<TResult>
  | MapsFallbackFailure;

export type MapsGeocodeFallbackResult =
  MapsFallbackResult<
    GeocodeResult
  >;

export type MapsReverseGeocodeFallbackResult =
  MapsFallbackResult<
    ReverseGeocodeResult
  >;

export type MapsRouteFallbackResult =
  MapsFallbackResult<
    RouteResult
  >;

export type MapsNearbySearchFallbackResult =
  MapsFallbackResult<
    NearbySearchResult
  >;
