export interface RazorpayFailureClassification {
  errorCode: string;
  retryable: boolean;
}

export function classifyRazorpayFailure(
  httpStatus: number,
  providerCode?: string,
): RazorpayFailureClassification {
  if (
    httpStatus === 429
  ) {
    return {
      errorCode:
        'RATE_LIMITED',
      retryable: true,
    };
  }

  if (
    httpStatus === 409
  ) {
    return {
      errorCode:
        'OPERATION_IN_PROGRESS',
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
    providerCode ===
    'BAD_REQUEST_ERROR' ||
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
