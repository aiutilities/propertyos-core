export interface OsrmFailureClassification {
  errorCode:
    string;

  retryable:
    boolean;
}

export function classifyOsrmHttpFailure(
  status:
    number,
): OsrmFailureClassification {
  if (status === 429) {
    return {
      errorCode:
        'PROVIDER_RATE_LIMITED',

      retryable:
        true,
    };
  }

  if (
    status === 408 ||
    status === 425 ||
    status === 502 ||
    status === 503 ||
    status === 504
  ) {
    return {
      errorCode:
        'PROVIDER_UNAVAILABLE',

      retryable:
        true,
    };
  }

  if (
    status === 400 ||
    status === 404 ||
    status === 422
  ) {
    return {
      errorCode:
        'REQUEST_REJECTED',

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

export function classifyOsrmCode(
  code:
    string,
): OsrmFailureClassification {
  if (code === 'NoRoute') {
    return {
      errorCode:
        'ROUTE_NOT_FOUND',

      retryable:
        false,
    };
  }

  if (
    code === 'InvalidQuery' ||
    code === 'InvalidValue' ||
    code === 'TooBig'
  ) {
    return {
      errorCode:
        'REQUEST_REJECTED',

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

export class OsrmProviderError
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
      'OsrmProviderError';
  }
}
