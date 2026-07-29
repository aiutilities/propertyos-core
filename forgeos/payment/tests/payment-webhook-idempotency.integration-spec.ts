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
    it(
      'reclaims a failed webhook when recovery is enabled',
      async () => {
        const store =
          new InMemoryPaymentWebhookIdempotencyStore();

        const first =
          await store.claim({
            key:
              'razorpay:event-recovery-1',

            providerName:
              'razorpay',

            eventId:
              'event-recovery-1',

            claimedAt:
              '2026-07-29T10:00:00.000Z',
          });

        expect(
          first.claimed,
        ).toBe(true);

        await store.fail(
          'razorpay:event-recovery-1',

          '2026-07-29T10:01:00.000Z',

          {
            errorMessage:
              'Temporary failure',
          },
        );

        await expect(
          store.claim({
            key:
              'razorpay:event-recovery-1',

            providerName:
              'razorpay',

            eventId:
              'event-recovery-1',

            claimedAt:
              '2026-07-29T10:02:00.000Z',

            reclaimFailed:
              true,
          }),
        ).resolves.toMatchObject({
          claimed:
            true,

          record: {
            status:
              'PROCESSING',

            claimedAt:
              '2026-07-29T10:02:00.000Z',

            metadata: {
              retryCount:
                1,
            },
          },
        });
      },
    );

    it(
      'does not reclaim a completed webhook',
      async () => {
        const store =
          new InMemoryPaymentWebhookIdempotencyStore();

        await store.claim({
          key:
            'razorpay:event-completed-1',

          providerName:
            'razorpay',

          eventId:
            'event-completed-1',

          claimedAt:
            '2026-07-29T10:00:00.000Z',
        });

        await store.complete(
          'razorpay:event-completed-1',

          '2026-07-29T10:01:00.000Z',
        );

        await expect(
          store.claim({
            key:
              'razorpay:event-completed-1',

            providerName:
              'razorpay',

            eventId:
              'event-completed-1',

            claimedAt:
              '2026-07-29T10:02:00.000Z',

            reclaimFailed:
              true,
          }),
        ).resolves.toMatchObject({
          claimed:
            false,

          record: {
            status:
              'COMPLETED',
          },
        });
      },
    );

    it(
      'retries a failed handler on provider redelivery',
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

        let attempts = 0;

        handlers.register({
          name:
            'recoverable-handler',

          eventTypes: [
            'payment.captured',
          ],

          async handle() {
            attempts += 1;

            if (attempts === 1) {
              throw new Error(
                'Temporary downstream failure',
              );
            }
          },
        });

        const store =
          new InMemoryPaymentWebhookIdempotencyStore();

        const dispatcher =
          new PaymentWebhookDispatcher({
            providers,
            handlers,

            idempotencyStore:
              store,

            retryFailedWebhooks:
              true,

            now:
              () =>
                new Date(
                  attempts === 0
                    ? '2026-07-29T10:00:00.000Z'
                    : '2026-07-29T10:05:00.000Z',
                ),
          });

        const webhook =
          signedWebhook(
            'event-retry-handler-1',
          );

        await expect(
          dispatcher.dispatch({
            providerName:
              'razorpay',

            ...webhook,

            headers: {},
          }),
        ).resolves.toMatchObject({
          accepted:
            false,

          duplicate:
            false,

          errorCode:
            'WEBHOOK_HANDLER_FAILED',
        });

        await expect(
          dispatcher.dispatch({
            providerName:
              'razorpay',

            ...webhook,

            headers: {},
          }),
        ).resolves.toMatchObject({
          accepted:
            true,

          duplicate:
            false,

          handledBy: [
            'recoverable-handler',
          ],
        });

        expect(attempts).toBe(2);

        await expect(
          store.get(
            'razorpay:event-retry-handler-1',
          ),
        ).resolves.toMatchObject({
          status:
            'COMPLETED',

          metadata: {
            retryCount:
              1,
          },
        });
      },
    );

  },
);
