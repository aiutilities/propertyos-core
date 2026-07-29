import {
  createHmac,
} from 'node:crypto';

import {
  calculatePaymentWebhookRetryDelay,
  InMemoryPaymentWebhookIdempotencyStore,
  PaymentProviderRegistry,
  PaymentWebhookDispatcher,
  PaymentWebhookHandlerRegistry,
  RazorpayProvider,
  validatePaymentWebhookRetryPolicy,
} from '../index';

function signedWebhook(
  eventId: string,
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

function createSubject(
  attemptNumber:
    number,
) {
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

  handlers.register({
    name:
      'failing-handler',

    eventTypes: [
      'payment.captured',
    ],

    async handle() {
      throw new Error(
        'Downstream unavailable',
      );
    },
  });

  const scheduled:
    Record<string, unknown>[] = [];

  const deadLetters:
    Record<string, unknown>[] = [];

  const events:
    string[] = [];

  const dispatcher =
    new PaymentWebhookDispatcher({
      providers,
      handlers,

      idempotencyStore:
        new InMemoryPaymentWebhookIdempotencyStore(),

      retryScheduler: {
        async schedule(input) {
          scheduled.push(
            input as unknown as
              Record<string, unknown>,
          );
        },
      },

      deadLetterStore: {
        async store(input) {
          deadLetters.push(
            input as unknown as
              Record<string, unknown>,
          );
        },
      },

      retryPolicy: {
        maximumAttempts:
          3,

        initialDelayMilliseconds:
          1000,

        backoffMultiplier:
          2,

        maximumDelayMilliseconds:
          10_000,
      },

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

  return {
    dispatcher,
    attemptNumber,
    scheduled,
    deadLetters,
    events,
  };
}

describe(
  'Payment webhook retry infrastructure',
  () => {
    it(
      'validates and calculates exponential retry delays',
      () => {
        const policy = {
          maximumAttempts:
            5,

          initialDelayMilliseconds:
            1000,

          backoffMultiplier:
            2,

          maximumDelayMilliseconds:
            5000,
        };

        expect(
          validatePaymentWebhookRetryPolicy(
            policy,
          ),
        ).toEqual([]);

        expect(
          calculatePaymentWebhookRetryDelay(
            1,
            policy,
          ),
        ).toBe(1000);

        expect(
          calculatePaymentWebhookRetryDelay(
            2,
            policy,
          ),
        ).toBe(2000);

        expect(
          calculatePaymentWebhookRetryDelay(
            4,
            policy,
          ),
        ).toBe(5000);
      },
    );

    it(
      'schedules a retry before the maximum attempt',
      async () => {
        const subject =
          createSubject(1);

        const webhook =
          signedWebhook(
            'event-retry-scheduled-1',
          );

        await expect(
          subject.dispatcher
            .dispatch({
              providerName:
                'razorpay',

              ...webhook,

              headers: {},

              attemptNumber:
                subject.attemptNumber,
            }),
        ).resolves.toMatchObject({
          accepted:
            false,

          errorCode:
            'WEBHOOK_HANDLER_FAILED',
        });

        expect(
          subject.scheduled,
        ).toHaveLength(1);

        expect(
          subject.scheduled[0],
        ).toMatchObject({
          eventId:
            'event-retry-scheduled-1',

          attemptNumber:
            2,

          delayMilliseconds:
            1000,

          scheduledFor:
            '2026-07-29T10:00:01.000Z',
        });

        expect(
          subject.deadLetters,
        ).toEqual([]);

        expect(
          subject.events,
        ).toContain(
          'payment.webhook.retry_scheduled',
        );
      },
    );

    it(
      'dead-letters the final failed attempt',
      async () => {
        const subject =
          createSubject(3);

        const webhook =
          signedWebhook(
            'event-dead-letter-1',
          );

        await expect(
          subject.dispatcher
            .dispatch({
              providerName:
                'razorpay',

              ...webhook,

              headers: {},

              attemptNumber:
                subject.attemptNumber,
            }),
        ).resolves.toMatchObject({
          accepted:
            false,

          errorCode:
            'WEBHOOK_HANDLER_FAILED',
        });

        expect(
          subject.scheduled,
        ).toEqual([]);

        expect(
          subject.deadLetters,
        ).toHaveLength(1);

        expect(
          subject.deadLetters[0],
        ).toMatchObject({
          providerName:
            'razorpay',

          eventId:
            'event-dead-letter-1',

          eventType:
            'payment.captured',

          attemptNumber:
            3,

          errorCode:
            'WEBHOOK_HANDLER_FAILED',

          errorMessage:
            'Downstream unavailable',
        });

        expect(
          subject.events,
        ).toContain(
          'payment.webhook.dead_lettered',
        );
      },
    );
  },
);
