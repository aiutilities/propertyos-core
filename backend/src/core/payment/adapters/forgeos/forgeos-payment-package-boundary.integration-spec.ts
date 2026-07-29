import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PaymentDispatcher,
  PaymentProviderRegistry,
  RazorpayProvider,
  StripeProvider,
  validatePaymentMoney,
} from '@forgeos/payment';

describe(
  'PropertyOS ForgeOS payment package boundary',
  () => {
    it(
      'loads ForgeOS Payment through its package name',
      () => {
        expect(
          typeof PaymentDispatcher,
        ).toBe('function');

        expect(
          typeof PaymentProviderRegistry,
        ).toBe('function');

        expect(
          typeof RazorpayProvider,
        ).toBe('function');

        expect(
          typeof StripeProvider,
        ).toBe('function');
      },
    );

    it(
      'validates payment money through the installed package',
      () => {
        expect(
          validatePaymentMoney({
            amountMinor:
              10000,

            currency:
              'INR',
          }),
        ).toEqual([]);
      },
    );

    it(
      'registers Razorpay and Stripe',
      () => {
        const registry =
          new PaymentProviderRegistry();

        registry.register(
          new RazorpayProvider({
            keyId:
              'rzp_test_1234567890',

            keySecret:
              'razorpay-test-secret-000000',

            webhookSecret:
              'razorpay-webhook-secret',
          }),
        );

        registry.register(
          new StripeProvider({
            secretKey:
              'sk_test_1234567890abcdefghijkl',

            webhookSecret:
              'whsec_1234567890abcdefghijkl',
          }),
        );

        expect(
          registry.list().map(
            (provider) =>
              provider.name,
          ),
        ).toEqual([
          'razorpay',
          'stripe',
        ]);
      },
    );
  },
);
