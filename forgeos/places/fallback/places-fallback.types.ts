export interface PlacesFallbackContext {
  correlationId?:
    string;

  metadata?:
    Record<string, unknown>;
}

export interface PlacesProviderAttempt {
  providerName:
    string;

  success:
    boolean;

  startedAt:
    number;

  completedAt:
    number;

  durationMilliseconds:
    number;

  errorCode?:
    string;

  errorMessage?:
    string;

  retryable?:
    boolean;
}

export interface PlacesFallbackSuccess<
  TResult,
> {
  success:
    true;

  providerName:
    string;

  result:
    TResult;

  attempts:
    readonly PlacesProviderAttempt[];
}

export interface PlacesFallbackFailure {
  success:
    false;

  errorCode:
    string;

  errorMessage:
    string;

  retryable:
    boolean;

  attempts:
    readonly PlacesProviderAttempt[];
}

export type PlacesFallbackResult<
  TResult,
> =
  | PlacesFallbackSuccess<TResult>
  | PlacesFallbackFailure;

export interface PlacesFallbackEngineOptions {
  providerCooldownMilliseconds?:
    number;
}
