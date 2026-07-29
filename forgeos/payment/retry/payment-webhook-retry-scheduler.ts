export interface SchedulePaymentWebhookRetryInput {
  idempotencyKey: string;

  providerName: string;
  eventId: string;

  attemptNumber: number;

  delayMilliseconds: number;

  scheduledFor: string;

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

export interface ScheduledPaymentWebhookRetry {
  id: string;

  idempotencyKey: string;

  attemptNumber: number;

  scheduledFor: string;
}

export interface PaymentWebhookRetryScheduler {
  schedule(
    input:
      SchedulePaymentWebhookRetryInput,
  ): Promise<
    ScheduledPaymentWebhookRetry |
    void
  >;
}

export class NoopPaymentWebhookRetryScheduler
  implements PaymentWebhookRetryScheduler
{
  async schedule(
    _input:
      SchedulePaymentWebhookRetryInput,
  ): Promise<void> {
    return;
  }
}
