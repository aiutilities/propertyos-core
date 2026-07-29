import {
  PaymentWebhookDeadLetter,
  PaymentWebhookInboxRecord,
} from '../entities';

export interface ClaimPaymentWebhookRecordInput {
  id:
    string;

  idempotencyKey:
    string;

  providerName:
    string;

  providerEventId:
    string;

  eventType?:
    string;

  rawBody:
    string;

  signature?:
    string;

  headers:
    Record<
      string,
      string | undefined
    >;

  claimedAt:
    Date;

  reclaimFailed?:
    boolean;

  metadata:
    Record<string, unknown>;
}

export interface PaymentWebhookClaimRecordResult {
  claimed:
    boolean;

  record:
    PaymentWebhookInboxRecord;
}

export abstract class PaymentWebhookRepository {
  abstract claim(
    input:
      ClaimPaymentWebhookRecordInput,
  ): Promise<
    PaymentWebhookClaimRecordResult
  >;

  abstract complete(
    idempotencyKey:
      string,

    completedAt:
      Date,

    metadata?:
      Record<string, unknown>,
  ): Promise<void>;

  abstract fail(
    idempotencyKey:
      string,

    failedAt:
      Date,

    errorCode:
      string,

    errorMessage:
      string,

    metadata?:
      Record<string, unknown>,
  ): Promise<void>;

  abstract findByIdempotencyKey(
    idempotencyKey:
      string,
  ): Promise<
    PaymentWebhookInboxRecord |
    null
  >;

  abstract storeDeadLetter(
    deadLetter:
      PaymentWebhookDeadLetter,
  ): Promise<
    PaymentWebhookDeadLetter
  >;
}
