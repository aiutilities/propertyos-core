import {
  PaymentMoney,
} from './money';

import {
  PaymentStatus,
} from './payment-status';

export interface VerifyPaymentWebhookRequest {
  rawBody: string | Uint8Array;

  signature?: string;

  headers:
    Readonly<
      Record<
        string,
        string | undefined
      >
    >;
}

export interface VerifiedPaymentWebhook {
  valid: boolean;

  providerName: string;

  eventId?: string;
  eventType?: string;

  providerOrderId?: string;
  providerPaymentId?: string;
  providerRefundId?: string;

  status?: PaymentStatus;

  money?: PaymentMoney;

  occurredAt?: string;

  errorCode?: string;
  errorMessage?: string;

  metadata?: Record<string, unknown>;
}
