export interface PaymentProviderEvent {
  id: string;

  paymentId?:
    string;

  providerName:
    string;

  providerEventId:
    string;

  eventType:
    string;

  providerOrderId?:
    string;

  providerPaymentId?:
    string;

  providerRefundId?:
    string;

  payload:
    Record<string, unknown>;

  metadata:
    Record<string, unknown>;

  occurredAt?:
    Date;

  receivedAt:
    Date;

  createdAt:
    Date;
}
