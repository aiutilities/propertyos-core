import {
  ClaimPaymentWebhookInput,
  PaymentWebhookClaimResult,
  PaymentWebhookIdempotencyRecord,
  PaymentWebhookIdempotencyStore,
} from './payment-webhook-idempotency-store';

export class InMemoryPaymentWebhookIdempotencyStore
  implements PaymentWebhookIdempotencyStore
{
  private readonly records =
    new Map<
      string,
      PaymentWebhookIdempotencyRecord
    >();

  async claim(
    input:
      ClaimPaymentWebhookInput,
  ): Promise<PaymentWebhookClaimResult> {
    const existing =
      this.records.get(
        input.key,
      );

    if (existing) {
      return {
        claimed: false,
        record:
          structuredClone(
            existing,
          ),
      };
    }

    const record:
      PaymentWebhookIdempotencyRecord = {
        key:
          input.key,

        providerName:
          input.providerName,

        eventId:
          input.eventId,

        status:
          'PROCESSING',

        claimedAt:
          input.claimedAt,

        metadata:
          input.metadata,
      };

    this.records.set(
      input.key,
      record,
    );

    return {
      claimed: true,
      record:
        structuredClone(
          record,
        ),
    };
  }

  async complete(
    key: string,
    completedAt: string,
    metadata?:
      Record<string, unknown>,
  ): Promise<void> {
    const existing =
      this.records.get(key);

    if (!existing) {
      return;
    }

    this.records.set(
      key,
      {
        ...existing,

        status:
          'COMPLETED',

        completedAt,

        metadata: {
          ...existing.metadata,
          ...metadata,
        },
      },
    );
  }

  async fail(
    key: string,
    failedAt: string,
    metadata?:
      Record<string, unknown>,
  ): Promise<void> {
    const existing =
      this.records.get(key);

    if (!existing) {
      return;
    }

    this.records.set(
      key,
      {
        ...existing,

        status:
          'FAILED',

        failedAt,

        metadata: {
          ...existing.metadata,
          ...metadata,
        },
      },
    );
  }

  async get(
    key: string,
  ): Promise<
    PaymentWebhookIdempotencyRecord |
    null
  > {
    const record =
      this.records.get(key);

    return record
      ? structuredClone(record)
      : null;
  }

  clear(): void {
    this.records.clear();
  }
}
