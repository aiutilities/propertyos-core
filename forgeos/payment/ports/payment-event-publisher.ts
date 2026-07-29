export interface PublishPaymentEventInput {
  type: string;
  source: string;

  payload:
    Record<string, unknown>;

  correlationId?: string;
  causationId?: string;

  metadata?:
    Record<string, unknown>;
}

export interface PublishedPaymentEvent {
  id: string;
  type: string;
  source: string;

  payload:
    Record<string, unknown>;

  occurredAt: string;

  correlationId?: string;
  causationId?: string;

  metadata?:
    Record<string, unknown>;
}

export interface PaymentEventPublisher {
  publish(
    input:
      PublishPaymentEventInput,
  ): Promise<PublishedPaymentEvent | void>;
}

export class NoopPaymentEventPublisher
  implements PaymentEventPublisher
{
  async publish(
    _input:
      PublishPaymentEventInput,
  ): Promise<void> {
    return;
  }
}
