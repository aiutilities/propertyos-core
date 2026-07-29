export type PaymentWebhookProcessingStatus =
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface PaymentWebhookInboxRecord {
  id: string;

  idempotencyKey:
    string;

  providerName:
    string;

  providerEventId:
    string;

  eventType?:
    string;

  status:
    PaymentWebhookProcessingStatus;

  attemptNumber:
    number;

  rawBody:
    string;

  signature?:
    string;

  headers:
    Record<
      string,
      string | undefined
    >;

  errorCode?:
    string;

  errorMessage?:
    string;

  metadata:
    Record<string, unknown>;

  claimedAt:
    Date;

  completedAt?:
    Date;

  failedAt?:
    Date;

  createdAt:
    Date;

  updatedAt:
    Date;
}

export interface PaymentWebhookDeadLetter {
  id: string;

  idempotencyKey?:
    string;

  providerName:
    string;

  providerEventId?:
    string;

  eventType?:
    string;

  attemptNumber:
    number;

  rawBody:
    string;

  signature?:
    string;

  headers:
    Record<
      string,
      string | undefined
    >;

  errorCode:
    string;

  errorMessage:
    string;

  metadata:
    Record<string, unknown>;

  failedAt:
    Date;

  createdAt:
    Date;
}
