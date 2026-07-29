export interface Fast2SmsFailureClassification {
  errorCode: string;
  retryable: boolean;
}

export function classifyFast2SmsFailure(
  httpStatus: number,
  providerStatusCode?: number,
): Fast2SmsFailureClassification {
  if (
    httpStatus === 429 ||
    providerStatusCode === 429
  ) {
    return {
      errorCode:
        'RATE_LIMITED',
      retryable: true,
    };
  }

  if (
    httpStatus >= 500 &&
    httpStatus <= 599
  ) {
    return {
      errorCode:
        'PROVIDER_UNAVAILABLE',
      retryable: true,
    };
  }

  if (
    httpStatus === 401 ||
    httpStatus === 403
  ) {
    return {
      errorCode:
        'AUTHENTICATION_FAILED',
      retryable: false,
    };
  }

  if (
    httpStatus === 400 ||
    httpStatus === 422
  ) {
    return {
      errorCode:
        'REQUEST_REJECTED',
      retryable: false,
    };
  }

  return {
    errorCode:
      'PROVIDER_REJECTED',
    retryable: false,
  };
}
