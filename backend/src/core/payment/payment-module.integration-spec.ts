import {
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  Test,
} from '@nestjs/testing';

import {
  EventBusModule,
} from '../eventbus/eventbus.module';

import {
  PaymentModule,
} from './payment.module';

import {
  PaymentRuntimeService,
} from './runtime';

const PAYMENT_ENVIRONMENT_KEYS = [
  'PAYMENT_PROVIDER',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

function clearPaymentEnvironment():
  void {
  for (
    const key
    of PAYMENT_ENVIRONMENT_KEYS
  ) {
    delete process.env[key];
  }
}

describe(
  'PropertyOS PaymentModule',
  () => {
    afterEach(() => {
      clearPaymentEnvironment();
    });

    it(
      'initializes safely with payments disabled',
      async () => {
        clearPaymentEnvironment();

        const module =
          await Test
            .createTestingModule({
              imports: [
                EventBusModule,
                PaymentModule,
              ],
            })
            .compile();

        await module.init();

        const runtime =
          module.get(
            PaymentRuntimeService,
          );

        expect(
          runtime.isEnabled(),
        ).toBe(false);

        expect(
          runtime
            .getProviderRegistry()
            .list(),
        ).toEqual([]);

        await module.close();
      },
    );

    it(
      'fails closed when an enabled provider lacks credentials',
      async () => {
        process.env.PAYMENT_PROVIDER =
          'stripe';

        const module =
          await Test
            .createTestingModule({
              imports: [
                EventBusModule,
                PaymentModule,
              ],
            })
            .compile();

        const runtime =
          module.get(
            PaymentRuntimeService,
          );

        expect(
          () =>
            runtime.onModuleInit(),
        ).toThrow(
          'STRIPE_CONFIGURATION_BLOCKED',
        );

        await module.close();
      },
    );
  },
);
