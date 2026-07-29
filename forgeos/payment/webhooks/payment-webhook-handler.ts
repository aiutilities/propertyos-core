import {
  NormalizedPaymentWebhookEvent,
} from './payment-webhook.types';

export interface PaymentWebhookHandler {
  readonly name: string;

  readonly eventTypes:
    readonly string[];

  handle(
    event:
      NormalizedPaymentWebhookEvent,
  ): Promise<void>;
}
