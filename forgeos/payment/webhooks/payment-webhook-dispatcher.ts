import {
  buildPaymentWebhookIdempotencyKey,
  PaymentWebhookIdempotencyStore,
} from '../idempotency';

import {
  NoopPaymentEventPublisher,
  NoopPaymentLogger,
  PaymentEventPublisher,
  PaymentLogger,
} from '../ports';

import {
  PaymentProviderRegistry,
} from '../registry';

import {
  PaymentWebhookHandlerRegistry,
} from './payment-webhook-registry';

import {
  DispatchPaymentWebhookInput,
  NormalizedPaymentWebhookEvent,
  PaymentWebhookDispatchResult,
} from './payment-webhook.types';

export interface PaymentWebhookDispatcherDependencies {
  providers:
    PaymentProviderRegistry;

  handlers?:
    PaymentWebhookHandlerRegistry;

  eventPublisher?:
    PaymentEventPublisher;

  logger?:
    PaymentLogger;

  idempotencyStore?:
    PaymentWebhookIdempotencyStore;

  now?:
    () => Date;
}

export class PaymentWebhookDispatcher {
  private readonly handlers:
    PaymentWebhookHandlerRegistry;

  private readonly eventPublisher:
    PaymentEventPublisher;

  private readonly logger:
    PaymentLogger;

  private readonly now:
    () => Date;

  constructor(
    private readonly dependencies:
      PaymentWebhookDispatcherDependencies,
  ) {
    this.handlers =
      dependencies.handlers ??
      new PaymentWebhookHandlerRegistry();

    this.eventPublisher =
      dependencies.eventPublisher ??
      new NoopPaymentEventPublisher();

    this.logger =
      dependencies.logger ??
      new NoopPaymentLogger();

    this.now =
      dependencies.now ??
      (() => new Date());
  }

  async dispatch(
    input:
      DispatchPaymentWebhookInput,
  ): Promise<PaymentWebhookDispatchResult> {
    const provider =
      this.dependencies.providers.require(
        input.providerName,
      );

    const verified =
      await provider.verifyWebhook({
        rawBody:
          input.rawBody,

        signature:
          input.signature,

        headers:
          input.headers,
      });

    if (!verified.valid) {
      this.logger.warn?.(
        'Payment webhook verification failed',
        {
          providerName:
            input.providerName,

          errorCode:
            verified.errorCode,

          errorMessage:
            verified.errorMessage,
        },
      );

      await this.eventPublisher.publish({
        type:
          'payment.webhook.rejected',

        source:
          'forgeos.payment.webhooks',

        payload: {
          providerName:
            input.providerName,

          errorCode:
            verified.errorCode,
        },

        correlationId:
          input.correlationId,

        causationId:
          input.causationId,

        metadata:
          input.metadata,
      });

      return {
        accepted: false,

        providerName:
          input.providerName,

        verified,

        handledBy: [],

        errorCode:
          verified.errorCode ??
          'WEBHOOK_REJECTED',

        errorMessage:
          verified.errorMessage ??
          'Payment webhook verification failed',
      };
    }

    let idempotencyKey:
      string | undefined;

    if (
      this.dependencies
        .idempotencyStore &&
      verified.eventId
    ) {
      idempotencyKey =
        buildPaymentWebhookIdempotencyKey(
          verified.providerName,
          verified.eventId,
        );

      const claim =
        await this.dependencies
          .idempotencyStore
          .claim({
            key:
              idempotencyKey,

            providerName:
              verified.providerName,

            eventId:
              verified.eventId,

            claimedAt:
              this.now()
                .toISOString(),

            metadata:
              input.metadata,
          });

      if (!claim.claimed) {
        await this.eventPublisher.publish({
          type:
            'payment.webhook.duplicate',

          source:
            'forgeos.payment.webhooks',

          payload: {
            providerName:
              verified.providerName,

            eventId:
              verified.eventId,

            idempotencyKey,

            existingStatus:
              claim.record.status,
          },

          correlationId:
            input.correlationId,

          causationId:
            input.causationId,

          metadata:
            input.metadata,
        });

        return {
          accepted: true,

          duplicate: true,

          idempotencyKey,

          providerName:
            verified.providerName,

          verified,

          handledBy: [],
        };
      }
    }

    const event:
      NormalizedPaymentWebhookEvent = {
        providerName:
          verified.providerName,

        eventId:
          verified.eventId,

        eventType:
          verified.eventType,

        providerOrderId:
          verified.providerOrderId,

        providerPaymentId:
          verified.providerPaymentId,

        providerRefundId:
          verified.providerRefundId,

        status:
          verified.status,

        money:
          verified.money,

        occurredAt:
          verified.occurredAt,

        receivedAt:
          this.now()
            .toISOString(),

        correlationId:
          input.correlationId,

        causationId:
          input.causationId,

        metadata: {
          ...input.metadata,

          providerMetadata:
            verified.metadata ?? {},
        },
      };

    await this.eventPublisher.publish({
      type:
        'payment.webhook.verified',

      source:
        'forgeos.payment.webhooks',

      payload: {
        providerName:
          event.providerName,

        eventId:
          event.eventId,

        eventType:
          event.eventType,

        providerOrderId:
          event.providerOrderId,

        providerPaymentId:
          event.providerPaymentId,

        providerRefundId:
          event.providerRefundId,

        status:
          event.status,

        money:
          event.money,
      },

      correlationId:
        input.correlationId,

      causationId:
        input.causationId,

      metadata:
        event.metadata,
    });

    const matchingHandlers =
      this.handlers.matching(
        event.eventType,
      );

    const handledBy:
      string[] = [];

    for (
      const handler
      of matchingHandlers
    ) {
      try {
        await handler.handle(
          event,
        );

        handledBy.push(
          handler.name,
        );

        await this.eventPublisher.publish({
          type:
            'payment.webhook.handled',

          source:
            'forgeos.payment.webhooks',

          payload: {
            providerName:
              event.providerName,

            eventId:
              event.eventId,

            eventType:
              event.eventType,

            handlerName:
              handler.name,
          },

          correlationId:
            input.correlationId,

          causationId:
            input.causationId,

          metadata:
            event.metadata,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Unknown webhook handler error';

        this.logger.error(
          'Payment webhook handler failed',
          {
            providerName:
              event.providerName,

            eventId:
              event.eventId,

            eventType:
              event.eventType,

            handlerName:
              handler.name,

            error:
              errorMessage,
          },
        );

        await this.eventPublisher.publish({
          type:
            'payment.webhook.handler_failed',

          source:
            'forgeos.payment.webhooks',

          payload: {
            providerName:
              event.providerName,

            eventId:
              event.eventId,

            eventType:
              event.eventType,

            handlerName:
              handler.name,

            error:
              errorMessage,
          },

          correlationId:
            input.correlationId,

          causationId:
            input.causationId,

          metadata:
            event.metadata,
        });

        if (
          idempotencyKey &&
          this.dependencies
            .idempotencyStore
        ) {
          await this.dependencies
            .idempotencyStore
            .fail(
              idempotencyKey,

              this.now()
                .toISOString(),

              {
                handlerName:
                  handler.name,

                errorMessage,
              },
            );
        }

        return {
          accepted: false,

          duplicate: false,

          idempotencyKey,

          providerName:
            event.providerName,

          verified,

          event,

          handledBy,

          errorCode:
            'WEBHOOK_HANDLER_FAILED',

          errorMessage:
            errorMessage,
        };
      }
    }

    if (
      idempotencyKey &&
      this.dependencies
        .idempotencyStore
    ) {
      await this.dependencies
        .idempotencyStore
        .complete(
          idempotencyKey,

          this.now()
            .toISOString(),

          {
            handledBy,
          },
        );
    }

    return {
      accepted: true,

      duplicate: false,

      idempotencyKey,

      providerName:
        event.providerName,

      verified,

      event,

      handledBy,
    };
  }
}
