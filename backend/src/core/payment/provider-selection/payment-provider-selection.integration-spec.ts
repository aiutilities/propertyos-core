import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  currentPaymentEnvironmentClass,
  resolvePaymentProviderSelection,
} from './index';

describe(
  'PropertyOS payment provider selection',
  () => {
    it(
      'defaults payment delivery to disabled',
      () => {
        expect(
          resolvePaymentProviderSelection({
            environmentClass:
              'PRODUCTION',
          }),
        ).toMatchObject({
          status:
            'READY',

          provider:
            'DISABLED',

          enabled:
            false,

          realPaymentConfigured:
            false,
        });
      },
    );

    it(
      'selects Razorpay',
      () => {
        expect(
          resolvePaymentProviderSelection({
            environmentClass:
              'PRODUCTION',

            configuredProvider:
              'razorpay',
          }),
        ).toMatchObject({
          status:
            'READY',

          provider:
            'RAZORPAY',

          enabled:
            true,

          realPaymentConfigured:
            true,
        });
      },
    );

    it(
      'selects Stripe case-insensitively',
      () => {
        expect(
          resolvePaymentProviderSelection({
            environmentClass:
              'TEST',

            configuredProvider:
              ' STRIPE ',
          }),
        ).toMatchObject({
          status:
            'READY',

          provider:
            'STRIPE',

          enabled:
            true,
        });
      },
    );

    it(
      'blocks an unsupported provider',
      () => {
        expect(
          resolvePaymentProviderSelection({
            environmentClass:
              'DEVELOPMENT',

            configuredProvider:
              'unknown-gateway',
          }),
        ).toMatchObject({
          status:
            'BLOCKED',

          enabled:
            false,
        });
      },
    );

    it(
      'classifies runtime environments',
      () => {
        expect(
          currentPaymentEnvironmentClass(
            'production',
          ),
        ).toBe(
          'PRODUCTION',
        );

        expect(
          currentPaymentEnvironmentClass(
            'test',
          ),
        ).toBe(
          'TEST',
        );

        expect(
          currentPaymentEnvironmentClass(
            undefined,
          ),
        ).toBe(
          'DEVELOPMENT',
        );
      },
    );
  },
);
