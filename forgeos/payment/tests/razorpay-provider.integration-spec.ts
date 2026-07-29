import {
  createHmac,
} from 'node:crypto';

import {
  RazorpayProvider,
  resolveRazorpayConfiguration,
} from '../index';

function provider():
  RazorpayProvider {
  return new RazorpayProvider({
    keyId:
      'rzp_test_1234567890',

    keySecret:
      'razorpay-test-secret-000000',

    webhookSecret:
      'razorpay-webhook-secret',

    timeoutMilliseconds:
      5000,
  });
}

describe(
  'RazorpayProvider',
  () => {
    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it(
      'blocks invalid configuration',
      () => {
        expect(
          resolveRazorpayConfiguration({
            keyId:
              'invalid',
            keySecret:
              'short',
            webhookSecret:
              'short',
          }),
        ).toMatchObject({
          status:
            'BLOCKED',
        });
      },
    );

    it(
      'creates an order',
      async () => {
        const fetchMock =
          jest
            .spyOn(
              globalThis,
              'fetch',
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  id:
                    'order_test_1',
                  amount:
                    10000,
                  currency:
                    'INR',
                  status:
                    'created',
                  receipt:
                    'rent-1',
                  created_at:
                    1785300000,
                }),
                {
                  status: 200,
                },
              ),
            );

        await expect(
          provider()
            .createPayment({
              idempotencyKey:
                'rent-1',
              receiptReference:
                'rent-1',
              money: {
                amountMinor:
                  10000,
                currency:
                  'INR',
              },
              source:
                'propertyos',
              sourceReference:
                'lease-1',
            }),
        ).resolves.toMatchObject({
          success: true,
          providerName:
            'razorpay',
          providerOrderId:
            'order_test_1',
          status:
            'CREATED',
        });

        const [
          url,
          options,
        ] =
          fetchMock.mock.calls[0];

        expect(url).toBe(
          'https://api.razorpay.com/v1/orders',
        );

        expect(options).toMatchObject({
          method: 'POST',
          headers: {
            authorization:
              expect.stringMatching(
                /^Basic /,
              ),
            'content-type':
              'application/json',
          },
        });

        expect(
          JSON.parse(
            String(
              options?.body,
            ),
          ),
        ).toMatchObject({
          amount:
            10000,
          currency:
            'INR',
          receipt:
            'rent-1',
        });
      },
    );

    it(
      'captures a payment',
      async () => {
        jest
          .spyOn(
            globalThis,
            'fetch',
          )
          .mockResolvedValue(
            new Response(
              JSON.stringify({
                id:
                  'pay_test_1',
                order_id:
                  'order_test_1',
                amount:
                  10000,
                currency:
                  'INR',
                status:
                  'captured',
                captured:
                  true,
              }),
              {
                status: 200,
              },
            ),
          );

        await expect(
          provider()
            .capturePayment({
              providerPaymentId:
                'pay_test_1',
              idempotencyKey:
                'capture-payment-1',
              money: {
                amountMinor:
                  10000,
                currency:
                  'INR',
              },
            }),
        ).resolves.toMatchObject({
          success: true,
          status:
            'CAPTURED',
          providerPaymentId:
            'pay_test_1',
        });
      },
    );

    it(
      'creates an idempotent refund',
      async () => {
        const fetchMock =
          jest
            .spyOn(
              globalThis,
              'fetch',
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  id:
                    'rfnd_test_1',
                  amount:
                    5000,
                  currency:
                    'INR',
                  payment_id:
                    'pay_test_1',
                  status:
                    'processed',
                }),
                {
                  status: 200,
                },
              ),
            );

        await expect(
          provider()
            .refundPayment({
              providerPaymentId:
                'pay_test_1',
              idempotencyKey:
                'refund-payment-1',
              money: {
                amountMinor:
                  5000,
                currency:
                  'INR',
              },
            }),
        ).resolves.toMatchObject({
          success: true,
          status:
            'REFUNDED',
          providerRefundId:
            'rfnd_test_1',
        });

        expect(
          fetchMock.mock
            .calls[0][1],
        ).toMatchObject({
          headers: {
            'x-refund-idempotency':
              'refund-payment-1',
          },
        });
      },
    );

    it(
      'verifies a webhook signature',
      async () => {
        const rawBody =
          JSON.stringify({
            id:
              'event-1',
            event:
              'payment.captured',
            created_at:
              1785300000,
          });

        const signature =
          createHmac(
            'sha256',
            'razorpay-webhook-secret',
          )
            .update(rawBody)
            .digest('hex');

        await expect(
          provider()
            .verifyWebhook({
              rawBody,
              signature,
              headers: {},
            }),
        ).resolves.toMatchObject({
          valid: true,
          providerName:
            'razorpay',
          eventId:
            'event-1',
          eventType:
            'payment.captured',
        });
      },
    );

    it(
      'rejects an invalid webhook signature',
      async () => {
        await expect(
          provider()
            .verifyWebhook({
              rawBody:
                '{"event":"payment.failed"}',
              signature:
                'invalid',
              headers: {},
            }),
        ).resolves.toMatchObject({
          valid: false,
          errorCode:
            'INVALID_SIGNATURE',
        });
      },
    );

    it(
      'classifies provider unavailability as retryable',
      async () => {
        jest
          .spyOn(
            globalThis,
            'fetch',
          )
          .mockResolvedValue(
            new Response(
              JSON.stringify({
                error: {
                  code:
                    'SERVER_ERROR',
                  description:
                    'Unavailable',
                },
              }),
              {
                status: 503,
              },
            ),
          );

        await expect(
          provider()
            .createPayment({
              idempotencyKey:
                'payment-retry-1',
              money: {
                amountMinor:
                  10000,
                currency:
                  'INR',
              },
              source:
                'propertyos',
            }),
        ).resolves.toMatchObject({
          success: false,
          errorCode:
            'PROVIDER_UNAVAILABLE',
          retryable: true,
        });
      },
    );
  },
);
