import {
  createHmac,
} from 'node:crypto';

import {
  PaymentProviderRegistry,
  PaymentWebhookDispatcher,
  PaymentWebhookHandlerRegistry,
  RazorpayProvider,
  StripeProvider,
} from '../index';

function fixture() {
  const providers =
    new PaymentProviderRegistry();

  providers.register(
    new RazorpayProvider({
      keyId:
        'rzp_test_1234567890',

      keySecret:
        'razorpay-test-secret-000000',

      webhookSecret:
        'razorpay-webhook-secret',
    }),
  );

  providers.register(
    new StripeProvider({
      secretKey:
        'sk_test_1234567890abcdefghijkl',

      webhookSecret:
        'whsec_1234567890abcdefghijkl',

      webhookToleranceSeconds:
        0,
    }),
  );

  const handlers =
    new PaymentWebhookHandlerRegistry();

  const handled:
    Record<string, unknown>[] = [];

  const events:
    Record<string, unknown>[] = [];

  const errors:
    Record<string, unknown>[] = [];

  const dispatcher =
    new PaymentWebhookDispatcher({
      providers,
      handlers,

      now:
        () =>
          new Date(
            '2026-07-29T10:00:00.000Z',
          ),

      eventPublisher: {
        async publish(input) {
          events.push(
            input as unknown as
              Record<string, unknown>,
          );
        },
      },

      logger: {
        error(
          message,
          metadata,
        ): void {
          errors.push({
            message,
            metadata,
          });
        },
      },
    });

  return {
    dispatcher,
    handlers,
    handled,
    events,
    errors,
  };
}

describe(
  'PaymentWebhookDispatcher',
  () => {
    it(
      'verifies and dispatches a Razorpay webhook',
      async () => {
        const subject =
          fixture();

        subject.handlers.register({
          name:
            'propertyos-payment-captured',

          eventTypes: [
            'payment.captured',
          ],

          async handle(event) {
            subject.handled.push(
              event as unknown as
                Record<string, unknown>,
            );
          },
        });

        const rawBody =
          JSON.stringify({
            id:
              'event-razorpay-1',

            event:
              'payment.captured',

            created_at:
              1785319200,
          });

        const signature =
          createHmac(
            'sha256',
            'razorpay-webhook-secret',
          )
            .update(rawBody)
            .digest('hex');

        const result =
          await subject
            .dispatcher
            .dispatch({
              providerName:
                'razorpay',

              rawBody,
              signature,

              headers: {},

              correlationId:
                'correlation-1',
            });

        expect(result).toMatchObject({
          accepted: true,

          providerName:
            'razorpay',

          handledBy: [
            'propertyos-payment-captured',
          ],

          event: {
            eventId:
              'event-razorpay-1',

            eventType:
              'payment.captured',

            receivedAt:
              '2026-07-29T10:00:00.000Z',

            correlationId:
              'correlation-1',
          },
        });

        expect(
          subject.handled,
        ).toHaveLength(1);

        expect(
          subject.events.map(
            (event) =>
              event.type,
          ),
        ).toEqual([
          'payment.webhook.verified',
          'payment.webhook.handled',
        ]);
      },
    );

    it(
      'verifies and dispatches a Stripe webhook',
      async () => {
        const subject =
          fixture();

        subject.handlers.register({
          name:
            'wildcard-audit-handler',

          eventTypes: [
            '*',
          ],

          async handle(event) {
            subject.handled.push(
              event as unknown as
                Record<string, unknown>,
            );
          },
        });

        const timestamp =
          1785319200;

        const rawBody =
          JSON.stringify({
            id:
              'evt_stripe_1',

            type:
              'payment_intent.succeeded',

            created:
              timestamp,

            data: {
              object: {
                id:
                  'pi_stripe_1',

                amount:
                  10000,

                currency:
                  'inr',

                status:
                  'succeeded',
              },
            },
          });

        const signature =
          createHmac(
            'sha256',
            'whsec_1234567890abcdefghijkl',
          )
            .update(
              `${timestamp}.${rawBody}`,
            )
            .digest('hex');

        await expect(
          subject.dispatcher
            .dispatch({
              providerName:
                'stripe',

              rawBody,

              signature:
                `t=${timestamp},v1=${signature}`,

              headers: {},
            }),
        ).resolves.toMatchObject({
          accepted: true,

          event: {
            eventId:
              'evt_stripe_1',

            eventType:
              'payment_intent.succeeded',

            providerPaymentId:
              'pi_stripe_1',

            status:
              'CAPTURED',

            money: {
              amountMinor:
                10000,

              currency:
                'INR',
            },
          },

          handledBy: [
            'wildcard-audit-handler',
          ],
        });
      },
    );

    it(
      'rejects an invalid signature before handlers run',
      async () => {
        const subject =
          fixture();

        subject.handlers.register({
          name:
            'must-not-run',

          eventTypes: [
            '*',
          ],

          async handle(event) {
            subject.handled.push(
              event as unknown as
                Record<string, unknown>,
            );
          },
        });

        const result =
          await subject
            .dispatcher
            .dispatch({
              providerName:
                'razorpay',

              rawBody:
                '{"event":"payment.failed"}',

              signature:
                'invalid',

              headers: {},
            });

        expect(result).toMatchObject({
          accepted: false,

          errorCode:
            'INVALID_SIGNATURE',

          handledBy: [],
        });

        expect(
          subject.handled,
        ).toEqual([]);

        expect(
          subject.events.map(
            (event) =>
              event.type,
          ),
        ).toEqual([
          'payment.webhook.rejected',
        ]);
      },
    );

    it(
      'returns a normalized handler failure',
      async () => {
        const subject =
          fixture();

        subject.handlers.register({
          name:
            'failing-handler',

          eventTypes: [
            'payment.captured',
          ],

          async handle() {
            throw new Error(
              'PropertyOS unavailable',
            );
          },
        });

        const rawBody =
          JSON.stringify({
            id:
              'event-razorpay-2',

            event:
              'payment.captured',
          });

        const signature =
          createHmac(
            'sha256',
            'razorpay-webhook-secret',
          )
            .update(rawBody)
            .digest('hex');

        await expect(
          subject.dispatcher
            .dispatch({
              providerName:
                'razorpay',

              rawBody,
              signature,

              headers: {},
            }),
        ).resolves.toMatchObject({
          accepted: false,

          errorCode:
            'WEBHOOK_HANDLER_FAILED',

          errorMessage:
            'PropertyOS unavailable',

          handledBy: [],
        });

        expect(
          subject.errors,
        ).toHaveLength(1);

        expect(
          subject.events.map(
            (event) =>
              event.type,
          ),
        ).toEqual([
          'payment.webhook.verified',
          'payment.webhook.handler_failed',
          'payment.webhook.retry_scheduled',
        ]);
      },
    );

    it(
      'supports handlers for matching event types only',
      async () => {
        const subject =
          fixture();

        subject.handlers.register({
          name:
            'refund-handler',

          eventTypes: [
            'refund.processed',
          ],

          async handle(event) {
            subject.handled.push(
              event as unknown as
                Record<string, unknown>,
            );
          },
        });

        const rawBody =
          JSON.stringify({
            id:
              'event-razorpay-3',

            event:
              'payment.failed',
          });

        const signature =
          createHmac(
            'sha256',
            'razorpay-webhook-secret',
          )
            .update(rawBody)
            .digest('hex');

        await expect(
          subject.dispatcher
            .dispatch({
              providerName:
                'razorpay',

              rawBody,
              signature,

              headers: {},
            }),
        ).resolves.toMatchObject({
          accepted: true,

          handledBy: [],
        });

        expect(
          subject.handled,
        ).toEqual([]);
      },
    );
  },
);
