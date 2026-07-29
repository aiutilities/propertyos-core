export type PaymentWebhookIdempotencyStatus =
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export interface PaymentWebhookIdempotencyRecord {
  key: string;

  providerName: string;
  eventId: string;

  status:
    PaymentWebhookIdempotencyStatus;

  claimedAt: string;
  completedAt?: string;
  failedAt?: string;

  metadata?:
    Record<string, unknown>;
}

export interface ClaimPaymentWebhookInput {
  key: string;

  providerName: string;
  eventId: string;

  claimedAt: string;

  reclaimFailed?: boolean;

  metadata?:
    Record<string, unknown>;
}

export interface PaymentWebhookClaimResult {
  claimed: boolean;

  record:
    PaymentWebhookIdempotencyRecord;
}

export interface PaymentWebhookIdempotencyStore {
  claim(
    input:
      ClaimPaymentWebhookInput,
  ): Promise<PaymentWebhookClaimResult>;

  complete(
    key: string,
    completedAt: string,
    metadata?:
      Record<string, unknown>,
  ): Promise<void>;

  fail(
    key: string,
    failedAt: string,
    metadata?:
      Record<string, unknown>,
  ): Promise<void>;

  get(
    key: string,
  ): Promise<
    PaymentWebhookIdempotencyRecord |
    null
  >;
}
