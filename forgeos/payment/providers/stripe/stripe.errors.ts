export interface StripeFailureClassification {
  errorCode: string;
  retryable: boolean;
}

export function classifyStripeFailure(
  httpStatus: number,
  providerType?: string,
  providerCode?: string,
): StripeFailureClassification {
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

  if (
    providerType ===
      'card_error' ||
    providerCode ===
      'card_declined'
  ) {
    return {
      errorCode:
        'PAYMENT_DECLINED',
      retryable: false,
    };
  }

  if (
    providerType ===
      'idempotency_error' ||
    httpStatus === 409
  ) {
    return {
      errorCode:
        'IDEMPOTENCY_CONFLICT',
      retryable: false,
    };
  }

  if (
    providerType ===
      'invalid_request_error' ||
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
