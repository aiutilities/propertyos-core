import {
  PaymentDispatcher,
  PaymentOperationNotSupportedError,
  PaymentProvider,
  PaymentProviderRegistry,
} from '../index';

function createFixture(
  provider:
    PaymentProvider,
) {
  const registry =
    new PaymentProviderRegistry();

  registry.register(provider);

  const stateUpdates:
    Record<string, unknown>[] = [];

  const events:
    Record<string, unknown>[] = [];

  const dispatcher =
    new PaymentDispatcher({
      providers:
        registry,

      stateStore: {
        async updatePaymentState(
          input,
        ) {
          stateUpdates.push(
            input as unknown as
              Record<string, unknown>,
          );

          return {
            id:
              input.paymentId,

            status:
              input.status,

            providerName:
              input.providerName,

            providerOrderId:
              input.providerOrderId,

            providerPaymentId:
              input.providerPaymentId,

            providerRefundId:
              input.providerRefundId,

            money:
              input.money,

            metadata:
              input.metadata,
          };
        },
      },

      eventPublisher: {
        async publish(input) {
          events.push(
            input as unknown as
              Record<string, unknown>,
          );
        },
      },

      logger: {
        error(): void {
          return;
        },
      },
    });

  return {
    dispatcher,
    stateUpdates,
    events,
  };
}

function baseProvider():
  PaymentProvider {
  return {
    name:
      'razorpay',

    validateConfiguration(): void {
      return;
    },

    async createPayment(
      request,
    ) {
      return {
        success: true,

        providerName:
          'razorpay',

        providerOrderId:
          'order_123',

        status:
          'CREATED',

        money:
          request.money,
      };
    },

    async capturePayment(
      request,
    ) {
      return {
        success: true,

        providerName:
          'razorpay',

        providerPaymentId:
          request.providerPaymentId,

        status:
          'CAPTURED',

        money:
          request.money,
      };
    },

    async refundPayment(
      request,
    ) {
      return {
        success: true,

        providerName:
          'razorpay',

        providerPaymentId:
          request.providerPaymentId,

        providerRefundId:
          'refund_123',

        status:
          'REFUNDED',

        money:
          request.money,
      };
    },

    async verifyWebhook() {
      return {
        valid: true,

        providerName:
          'razorpay',
      };
    },
  };
}

describe(
  'PaymentDispatcher',
  () => {
    it(
      'creates a payment through the selected provider',
      async () => {
        const fixture =
          createFixture(
            baseProvider(),
          );

        const result =
          await fixture
            .dispatcher
            .createPayment({
              paymentId:
                'payment-1',

              providerName:
                'razorpay',

              request: {
                idempotencyKey:
                  'payment-1-create',

                money: {
                  amountMinor:
                    10000,

                  currency:
                    'INR',
                },

                source:
                  'propertyos',
              },
            });

        expect(result).toMatchObject({
          paymentId:
            'payment-1',

          success: true,

          status:
            'CREATED',

          providerOrderId:
            'order_123',
        });

        expect(
          fixture.stateUpdates,
        ).toHaveLength(1);

        expect(
          fixture.events.map(
            (event) =>
              event.type,
          ),
        ).toEqual([
          'payment.create.started',
          'payment.create.completed',
        ]);
      },
    );

    it(
      'rejects invalid money before provider execution',
      async () => {
        const provider =
          baseProvider();

        provider.createPayment =
          jest.fn(
            provider.createPayment,
          );

        const fixture =
          createFixture(provider);

        const result =
          await fixture
            .dispatcher
            .createPayment({
              paymentId:
                'payment-2',

              providerName:
                'razorpay',

              request: {
                idempotencyKey:
                  'payment-2-create',

                money: {
                  amountMinor:
                    100.5,

                  currency:
                    'inr',
                },

                source:
                  'propertyos',
              },
            });

        expect(result).toMatchObject({
          success: false,

          status:
            'FAILED',

          errorCode:
            'VALIDATION_FAILED',

          retryable:
            false,
        });

        expect(
          provider.createPayment,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'captures a payment',
      async () => {
        const fixture =
          createFixture(
            baseProvider(),
          );

        await expect(
          fixture.dispatcher
            .capturePayment({
              paymentId:
                'payment-3',

              providerName:
                'razorpay',

              request: {
                providerPaymentId:
                  'pay_123',

                idempotencyKey:
                  'payment-3-capture',

                money: {
                  amountMinor:
                    10000,

                  currency:
                    'INR',
                },
              },
            }),
        ).resolves.toMatchObject({
          success: true,

          status:
            'CAPTURED',

          providerPaymentId:
            'pay_123',
        });
      },
    );

    it(
      'refunds a payment',
      async () => {
        const fixture =
          createFixture(
            baseProvider(),
          );

        await expect(
          fixture.dispatcher
            .refundPayment({
              paymentId:
                'payment-4',

              providerName:
                'razorpay',

              request: {
                providerPaymentId:
                  'pay_123',

                idempotencyKey:
                  'payment-4-refund',

                money: {
                  amountMinor:
                    5000,

                  currency:
                    'INR',
                },
              },
            }),
        ).resolves.toMatchObject({
          success: true,

          status:
            'REFUNDED',

          providerRefundId:
            'refund_123',
        });
      },
    );

    it(
      'returns a normalized provider exception',
      async () => {
        const provider =
          baseProvider();

        provider.createPayment =
          async () => {
            throw new Error(
              'Provider unavailable',
            );
          };

        const fixture =
          createFixture(provider);

        await expect(
          fixture.dispatcher
            .createPayment({
              paymentId:
                'payment-5',

              providerName:
                'razorpay',

              request: {
                idempotencyKey:
                  'payment-5-create',

                money: {
                  amountMinor:
                    10000,

                  currency:
                    'INR',
                },

                source:
                  'propertyos',
              },
            }),
        ).resolves.toMatchObject({
          success: false,

          status:
            'FAILED',

          errorCode:
            'PROVIDER_EXCEPTION',

          retryable:
            true,
        });
      },
    );

    it(
      'throws when capture is unsupported',
      async () => {
        const provider =
          baseProvider();

        delete provider
          .capturePayment;

        const fixture =
          createFixture(provider);

        await expect(
          fixture.dispatcher
            .capturePayment({
              paymentId:
                'payment-6',

              providerName:
                'razorpay',

              request: {
                providerPaymentId:
                  'pay_123',

                idempotencyKey:
                  'payment-6-capture',
              },
            }),
        ).rejects.toThrow(
          PaymentOperationNotSupportedError,
        );
      },
    );
  },
);
