import {
  CapturePaymentRequest,
  CreatePaymentRequest,
  PaymentProviderResult,
  RefundPaymentRequest,
} from '../contracts';

export interface PaymentDispatchContext {
  paymentId: string;

  providerName: string;

  correlationId?: string;
  causationId?: string;

  metadata?:
    Record<string, unknown>;
}

export interface DispatchCreatePaymentInput
  extends PaymentDispatchContext {
  request:
    CreatePaymentRequest;
}

export interface DispatchCapturePaymentInput
  extends PaymentDispatchContext {
  request:
    CapturePaymentRequest;
}

export interface DispatchRefundPaymentInput
  extends PaymentDispatchContext {
  request:
    RefundPaymentRequest;
}

export interface PaymentDispatchResult
  extends PaymentProviderResult {
  paymentId: string;
}
