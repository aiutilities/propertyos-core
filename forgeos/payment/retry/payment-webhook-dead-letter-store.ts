export interface StorePaymentWebhookDeadLetterInput {
  idempotencyKey?: string;

  providerName: string;
  eventId?: string;
  eventType?: string;

  attemptNumber: number;

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

  errorCode: string;
  errorMessage: string;

  failedAt: string;

  correlationId?: string;
  causationId?: string;

  metadata?:
    Record<string, unknown>;
}

export interface StoredPaymentWebhookDeadLetter {
  id: string;

  providerName: string;

  eventId?: string;

  attemptNumber: number;

  failedAt: string;
}

export interface PaymentWebhookDeadLetterStore {
  store(
    input:
      StorePaymentWebhookDeadLetterInput,
  ): Promise<
    StoredPaymentWebhookDeadLetter |
    void
  >;
}

export class NoopPaymentWebhookDeadLetterStore
  implements PaymentWebhookDeadLetterStore
{
  async store(
    _input:
      StorePaymentWebhookDeadLetterInput,
  ): Promise<void> {
    return;
  }
}
