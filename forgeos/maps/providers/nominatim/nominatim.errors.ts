export interface NominatimFailureClassification {
  errorCode:
    string;

  retryable:
    boolean;
}

export function classifyNominatimFailure(
  httpStatus:
    number,
): NominatimFailureClassification {
  if (
    httpStatus === 429
  ) {
    return {
      errorCode:
        'PROVIDER_RATE_LIMITED',

      retryable:
        true,
    };
  }

  if (
    httpStatus === 408 ||
    httpStatus === 425 ||
    httpStatus === 502 ||
    httpStatus === 503 ||
    httpStatus === 504
  ) {
    return {
      errorCode:
        'PROVIDER_UNAVAILABLE',

      retryable:
        true,
    };
  }

  if (
    httpStatus === 400 ||
    httpStatus === 404 ||
    httpStatus === 422
  ) {
    return {
      errorCode:
        'REQUEST_REJECTED',

      retryable:
        false,
    };
  }

  if (
    httpStatus === 401 ||
    httpStatus === 403
  ) {
    return {
      errorCode:
        'PROVIDER_ACCESS_DENIED',

      retryable:
        false,
    };
  }

  return {
    errorCode:
      'PROVIDER_REJECTED',

    retryable:
      false,
  };
}

export class NominatimProviderError
  extends Error
{
  constructor(
    readonly code:
      string,

    message:
      string,

    readonly retryable:
      boolean,
  ) {
    super(message);

    this.name =
      'NominatimProviderError';
  }
}
