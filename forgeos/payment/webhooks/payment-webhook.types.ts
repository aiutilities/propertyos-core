import {
  PaymentMoney,
  PaymentStatus,
  VerifiedPaymentWebhook,
} from '../contracts';

export interface DispatchPaymentWebhookInput {
  providerName: string;

  rawBody:
    string | Uint8Array;

  signature?: string;

  headers:
    Readonly<
      Record<
        string,
        string | undefined
      >
    >;

  correlationId?: string;
  causationId?: string;

  metadata?:
    Record<string, unknown>;
}

export interface NormalizedPaymentWebhookEvent {
  providerName: string;

  eventId?: string;
  eventType?: string;

  providerOrderId?: string;
  providerPaymentId?: string;
  providerRefundId?: string;

  status?:
    PaymentStatus;

  money?:
    PaymentMoney;

  occurredAt?: string;

  receivedAt: string;

  correlationId?: string;
  causationId?: string;

  metadata?:
    Record<string, unknown>;
}

export interface PaymentWebhookDispatchResult {
  accepted: boolean;

  providerName: string;

  verified:
    VerifiedPaymentWebhook;

  event?:
    NormalizedPaymentWebhookEvent;

  handledBy:
    readonly string[];

  errorCode?: string;
  errorMessage?: string;
}
