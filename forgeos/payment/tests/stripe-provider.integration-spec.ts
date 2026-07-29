import {
  createHmac,
} from 'node:crypto';

import {
  resolveStripeConfiguration,
  StripeProvider,
} from '../index';

function provider(
  webhookToleranceSeconds =
    300,
): StripeProvider {
  return new StripeProvider({
    secretKey:
      'sk_test_1234567890abcdefghijkl',

    webhookSecret:
      'whsec_1234567890abcdefghijkl',

    timeoutMilliseconds:
      5000,

    webhookToleranceSeconds,
  });
}

describe(
  'StripeProvider',
  () => {
    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it(
      'blocks invalid configuration',
      () => {
        expect(
          resolveStripeConfiguration({
            secretKey:
              'invalid',

            webhookSecret:
              'invalid',
          }),
        ).toMatchObject({
          status:
            'BLOCKED',
        });
      },
    );

    it(
      'creates a PaymentIntent',
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
                    'pi_test_1',

                  amount:
                    10000,

                  currency:
                    'inr',

                  status:
                    'requires_payment_method',

                  client_secret:
                    'pi_test_1_secret',

                  created:
                    1785300000,
                }),
                {
                  status: 200,

                  headers: {
                    'request-id':
                      'req_test_1',
                  },
                },
              ),
            );

        await expect(
          provider()
            .createPayment({
              idempotencyKey:
                'rent-payment-1',

              money: {
                amountMinor:
                  10000,

                currency:
                  'INR',
              },

              description:
                'July rent',

              customer: {
                email:
                  'tenant@example.com',
              },

              source:
                'propertyos',

              sourceReference:
                'lease-1',
            }),
        ).resolves.toMatchObject({
          providerName:
            'stripe',

          providerPaymentId:
            'pi_test_1',

          clientSecret:
            'pi_test_1_secret',
        });

        const [
          url,
          options,
        ] =
          fetchMock.mock.calls[0];

        expect(url).toBe(
          'https://api.stripe.com/v1/payment_intents',
        );

        expect(options).toMatchObject({
          method: 'POST',

          headers: {
            authorization:
              'Bearer sk_test_1234567890abcdefghijkl',

            'content-type':
              'application/x-www-form-urlencoded',

            'idempotency-key':
              'rent-payment-1',
          },
        });

        const body =
          new URLSearchParams(
            String(
              options?.body,
            ),
          );

        expect(
          body.get(
            'amount',
          ),
        ).toBe(
          '10000',
        );

        expect(
          body.get(
            'currency',
          ),
        ).toBe(
          'inr',
        );

        expect(
          body.get(
            'automatic_payment_methods[enabled]',
          ),
        ).toBe(
          'true',
        );
      },
    );

    it(
      'captures a PaymentIntent',
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
                  'pi_test_2',

                amount:
                  10000,

                amount_received:
                  10000,

                currency:
                  'inr',

                status:
                  'succeeded',
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
                'pi_test_2',

              idempotencyKey:
                'capture-pi-test-2',

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
            'pi_test_2',
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
                    're_test_1',

                  amount:
                    5000,

                  currency:
                    'inr',

                  payment_intent:
                    'pi_test_2',

                  status:
                    'succeeded',
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
                'pi_test_2',

              idempotencyKey:
                'refund-pi-test-2',

              money: {
                amountMinor:
                  5000,

                currency:
                  'INR',
              },

              reason:
                'requested_by_customer',
            }),
        ).resolves.toMatchObject({
          success: true,

          status:
            'REFUNDED',

          providerRefundId:
            're_test_1',
        });

        expect(
          fetchMock.mock
            .calls[0][1],
        ).toMatchObject({
          headers: {
            'idempotency-key':
              'refund-pi-test-2',
          },
        });
      },
    );

    it(
      'verifies a Stripe webhook signature',
      async () => {
        const timestamp =
          Math.floor(
            Date.now() /
            1000,
          );

        const rawBody =
          JSON.stringify({
            id:
              'evt_test_1',

            type:
              'payment_intent.succeeded',

            created:
              timestamp,

            data: {
              object: {
                id:
                  'pi_test_3',

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
            .digest(
              'hex',
            );

        await expect(
          provider()
            .verifyWebhook({
              rawBody,

              signature:
                `t=${timestamp},v1=${signature}`,

              headers: {},
            }),
        ).resolves.toMatchObject({
          valid: true,

          providerName:
            'stripe',

          eventId:
            'evt_test_1',

          eventType:
            'payment_intent.succeeded',

          providerPaymentId:
            'pi_test_3',

          status:
            'CAPTURED',
        });
      },
    );

    it(
      'rejects an expired webhook signature',
      async () => {
        const timestamp =
          Math.floor(
            Date.now() /
            1000,
          ) -
          1000;

        const rawBody =
          '{"id":"evt_old"}';

        const signature =
          createHmac(
            'sha256',
            'whsec_1234567890abcdefghijkl',
          )
            .update(
              `${timestamp}.${rawBody}`,
            )
            .digest(
              'hex',
            );

        await expect(
          provider()
            .verifyWebhook({
              rawBody,

              signature:
                `t=${timestamp},v1=${signature}`,

              headers: {},
            }),
        ).resolves.toMatchObject({
          valid: false,

          errorCode:
            'SIGNATURE_EXPIRED',
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
                  type:
                    'api_error',

                  message:
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
                'stripe-retry-1',

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

          retryable:
            true,
        });
      },
    );
  },
);
