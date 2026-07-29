import {
  createHmac,
} from 'node:crypto';

import {
  InMemoryPaymentWebhookIdempotencyStore,
  PaymentProviderRegistry,
  PaymentWebhookDispatcher,
  PaymentWebhookHandlerRegistry,
  RazorpayProvider,
  buildPaymentWebhookIdempotencyKey,
} from '../index';

function signedWebhook(
  eventId:
    string,
) {
  const rawBody =
    JSON.stringify({
      id:
        eventId,

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

  return {
    rawBody,
    signature,
  };
}

describe(
  'Payment webhook idempotency',
  () => {
    it(
      'builds a provider-scoped key',
      () => {
        expect(
          buildPaymentWebhookIdempotencyKey(
            ' Razorpay ',
            'event-1',
          ),
        ).toBe(
          'razorpay:event-1',
        );
      },
    );

    it(
      'claims a webhook only once',
      async () => {
        const store =
          new InMemoryPaymentWebhookIdempotencyStore();

        const input = {
          key:
            'razorpay:event-1',

          providerName:
            'razorpay',

          eventId:
            'event-1',

          claimedAt:
            '2026-07-29T10:00:00.000Z',
        };

        await expect(
          store.claim(input),
        ).resolves.toMatchObject({
          claimed: true,

          record: {
            status:
              'PROCESSING',
          },
        });

        await expect(
          store.claim(input),
        ).resolves.toMatchObject({
          claimed: false,

          record: {
            status:
              'PROCESSING',
          },
        });
      },
    );

    it(
      'prevents duplicate handler execution',
      async () => {
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

        const handlers =
          new PaymentWebhookHandlerRegistry();

        let handled = 0;

        handlers.register({
          name:
            'captured-handler',

          eventTypes: [
            'payment.captured',
          ],

          async handle() {
            handled += 1;
          },
        });

        const idempotencyStore =
          new InMemoryPaymentWebhookIdempotencyStore();

        const events:
          string[] = [];

        const dispatcher =
          new PaymentWebhookDispatcher({
            providers,
            handlers,
            idempotencyStore,

            now:
              () =>
                new Date(
                  '2026-07-29T10:00:00.000Z',
                ),

            eventPublisher: {
              async publish(input) {
                events.push(
                  input.type,
                );
              },
            },
          });

        const webhook =
          signedWebhook(
            'event-duplicate-1',
          );

        await expect(
          dispatcher.dispatch({
            providerName:
              'razorpay',

            ...webhook,

            headers: {},
          }),
        ).resolves.toMatchObject({
          accepted: true,

          duplicate: false,

          idempotencyKey:
            'razorpay:event-duplicate-1',

          handledBy: [
            'captured-handler',
          ],
        });

        await expect(
          dispatcher.dispatch({
            providerName:
              'razorpay',

            ...webhook,

            headers: {},
          }),
        ).resolves.toMatchObject({
          accepted: true,

          duplicate: true,

          idempotencyKey:
            'razorpay:event-duplicate-1',

          handledBy: [],
        });

        expect(handled).toBe(1);

        expect(events).toContain(
          'payment.webhook.duplicate',
        );

        await expect(
          idempotencyStore.get(
            'razorpay:event-duplicate-1',
          ),
        ).resolves.toMatchObject({
          status:
            'COMPLETED',

          metadata: {
            handledBy: [
              'captured-handler',
            ],
          },
        });
      },
    );

    it(
      'marks handler failures',
      async () => {
        const store =
          new InMemoryPaymentWebhookIdempotencyStore();

        await store.claim({
          key:
            'razorpay:event-failed-1',

          providerName:
            'razorpay',

          eventId:
            'event-failed-1',

          claimedAt:
            '2026-07-29T10:00:00.000Z',
        });

        await store.fail(
          'razorpay:event-failed-1',

          '2026-07-29T10:01:00.000Z',

          {
            errorMessage:
              'Handler unavailable',
          },
        );

        await expect(
          store.get(
            'razorpay:event-failed-1',
          ),
        ).resolves.toMatchObject({
          status:
            'FAILED',

          failedAt:
            '2026-07-29T10:01:00.000Z',

          metadata: {
            errorMessage:
              'Handler unavailable',
          },
        });
      },
    );
  },
);
