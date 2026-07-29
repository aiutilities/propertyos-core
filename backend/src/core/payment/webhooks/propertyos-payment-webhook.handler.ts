import {
  randomUUID,
} from 'node:crypto';

import {
  Injectable,
} from '@nestjs/common';

import {
  NormalizedPaymentWebhookEvent,
  PaymentWebhookHandler,
} from '@forgeos/payment';

import {
  PaymentTransactionRepository,
} from '../repositories';

import {
  PaymentEventStoreService,
} from '../services/payment-event-store.service';

@Injectable()
export class PropertyOSPaymentWebhookHandler
  implements PaymentWebhookHandler
{
  readonly name =
    'propertyos-payment-runtime';

  readonly eventTypes = [
    '*',
  ] as const;

  constructor(
    private readonly transactions:
      PaymentTransactionRepository,

    private readonly eventStore:
      PaymentEventStoreService,
  ) {}

  async handle(
    event:
      NormalizedPaymentWebhookEvent,
  ): Promise<void> {
    const providerEventId =
      event.eventId ??
      this.fallbackProviderEventId(
        event,
      );

    const transaction =
      await this.transactions
        .findByProviderIdentifiers(
          event.providerName,
          {
            providerOrderId:
              event.providerOrderId,

            providerPaymentId:
              event.providerPaymentId,

            providerRefundId:
              event.providerRefundId,
          },
        );

    await this.eventStore.append({
      id:
        randomUUID(),

      paymentId:
        transaction?.id,

      providerName:
        event.providerName,

      providerEventId,

      eventType:
        event.eventType ??
        'payment.webhook.unknown',

      providerOrderId:
        event.providerOrderId,

      providerPaymentId:
        event.providerPaymentId,

      providerRefundId:
        event.providerRefundId,

      payload: {
        status:
          event.status,

        money:
          event.money,

        correlationId:
          event.correlationId,

        causationId:
          event.causationId,
      },

      metadata: {
        ...event.metadata,

        matchedPayment:
          Boolean(transaction),
      },

      occurredAt:
        event.occurredAt
          ? new Date(
              event.occurredAt,
            )
          : undefined,

      receivedAt:
        new Date(
          event.receivedAt,
        ),
    });

    if (
      !transaction ||
      !event.status
    ) {
      return;
    }

    await this.transactions
      .updateState({
        paymentId:
          transaction.id,

        status:
          event.status,

        providerName:
          event.providerName,

        providerOrderId:
          event.providerOrderId,

        providerPaymentId:
          event.providerPaymentId,

        providerRefundId:
          event.providerRefundId,

        money:
          event.money,

        metadata: {
          webhookEventId:
            providerEventId,

          webhookEventType:
            event.eventType,

          webhookReceivedAt:
            event.receivedAt,

          webhookReconciled:
            true,
        },
      });
  }

  private fallbackProviderEventId(
    event:
      NormalizedPaymentWebhookEvent,
  ): string {
    return [
      event.providerName,
      event.eventType ??
        'unknown',
      event.providerPaymentId ??
        event.providerOrderId ??
        event.providerRefundId ??
        'unidentified',
      event.occurredAt ??
        event.receivedAt,
    ].join(':');
  }
}
