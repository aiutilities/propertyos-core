import {
  CapturePaymentRequest,
  CreatePaymentRequest,
  RefundPaymentRequest,
} from './payment-request';

import {
  PaymentProviderResult,
} from './payment-result';

import {
  VerifiedPaymentWebhook,
  VerifyPaymentWebhookRequest,
} from './payment-webhook';

export interface PaymentProvider {
  readonly name: string;

  validateConfiguration():
    unknown | Promise<unknown>;

  createPayment(
    request:
      CreatePaymentRequest,
  ): Promise<PaymentProviderResult>;

  capturePayment?(
    request:
      CapturePaymentRequest,
  ): Promise<PaymentProviderResult>;

  refundPayment(
    request:
      RefundPaymentRequest,
  ): Promise<PaymentProviderResult>;

  verifyWebhook(
    request:
      VerifyPaymentWebhookRequest,
  ): Promise<VerifiedPaymentWebhook>;
}
