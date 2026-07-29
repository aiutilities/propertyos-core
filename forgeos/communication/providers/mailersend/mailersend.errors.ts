export interface MailerSendFailureClassification {
  errorCode: string;
  retryable: boolean;
}

export function classifyMailerSendFailure(
  httpStatus: number,
): MailerSendFailureClassification {
  if (httpStatus === 429) {
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

  if (httpStatus === 422) {
    return {
      errorCode:
        'VALIDATION_FAILED',
      retryable: false,
    };
  }

  if (httpStatus === 400) {
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
