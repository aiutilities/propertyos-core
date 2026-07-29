import {
  PaymentProvider,
  PaymentProviderNotFoundError,
  PaymentProviderRegistry,
  validatePaymentMoney,
} from '../index';

function provider(
  name: string,
): PaymentProvider {
  return {
    name,

    validateConfiguration(): void {
      return;
    },

    async createPayment() {
      return {
        success: true,
        providerName:
          name,
        status:
          'CREATED',
      };
    },

    async refundPayment() {
      return {
        success: true,
        providerName:
          name,
        status:
          'REFUNDED',
      };
    },

    async verifyWebhook() {
      return {
        valid: true,
        providerName:
          name,
      };
    },
  };
}

describe(
  'ForgeOS payment foundation',
  () => {
    it(
      'registers providers by normalized name',
      () => {
        const registry =
          new PaymentProviderRegistry();

        const razorpay =
          provider('Razorpay');

        registry.register(
          razorpay,
        );

        expect(
          registry.has(
            'razorpay',
          ),
        ).toBe(true);

        expect(
          registry.get(
            ' RAZORPAY ',
          ),
        ).toBe(
          razorpay,
        );
      },
    );

    it(
      'replaces a provider with the same name',
      () => {
        const registry =
          new PaymentProviderRegistry();

        const first =
          provider('stripe');

        const second =
          provider('STRIPE');

        registry.register(first);
        registry.register(second);

        expect(
          registry.list(),
        ).toEqual([
          second,
        ]);
      },
    );

    it(
      'throws a typed missing-provider error',
      () => {
        const registry =
          new PaymentProviderRegistry();

        expect(
          () =>
            registry.require(
              'razorpay',
            ),
        ).toThrow(
          PaymentProviderNotFoundError,
        );
      },
    );

    it(
      'validates money in minor units',
      () => {
        expect(
          validatePaymentMoney({
            amountMinor:
              10000,
            currency:
              'INR',
          }),
        ).toEqual([]);

        expect(
          validatePaymentMoney({
            amountMinor:
              100.5,
            currency:
              'inr',
          }),
        ).toHaveLength(2);
      },
    );

    it(
      'unregisters and clears providers',
      () => {
        const registry =
          new PaymentProviderRegistry();

        registry.register(
          provider('razorpay'),
        );

        expect(
          registry.unregister(
            'RAZORPAY',
          ),
        ).toBe(true);

        registry.register(
          provider('stripe'),
        );

        registry.clear();

        expect(
          registry.list(),
        ).toEqual([]);
      },
    );
  },
);
