import {
  afterEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PropertyOSPaymentEventPublisherAdapter,
  PropertyOSPaymentLoggerAdapter,
  PropertyOSPaymentStateStoreAdapter,
} from '../adapters/forgeos';

import {
  PaymentRuntimeService,
} from './payment-runtime.service';

import {
  PropertyOSPaymentWebhookHandler,
} from '../webhooks';

const ENVIRONMENT_KEYS = [
  'PAYMENT_PROVIDER',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
] as const;

function clearEnvironment():
  void {
  for (
    const key
    of ENVIRONMENT_KEYS
  ) {
    delete process.env[key];
  }
}

function createRuntime():
  PaymentRuntimeService {
  const eventPublisher = {
    publish:
      jest.fn(
        async () =>
          undefined,
      ),
  } as unknown as
    PropertyOSPaymentEventPublisherAdapter;

  const logger = {
    info:
      jest.fn(),

    error:
      jest.fn(),
  } as unknown as
    PropertyOSPaymentLoggerAdapter;

  const stateStore = {
    updatePaymentState:
      jest.fn(
        async () => ({
          id:
            'payment-1',

          status:
            'PENDING',

          providerName:
            'disabled',
        }),
      ),
  } as unknown as
    PropertyOSPaymentStateStoreAdapter;

  const webhookHandler = {
    name:
      'propertyos-payment-runtime',

    eventTypes: [
      '*',
    ],

    handle:
      jest.fn(
        async () =>
          undefined,
      ),
  } as unknown as
    PropertyOSPaymentWebhookHandler;

  return new PaymentRuntimeService(
    eventPublisher,
    logger,
    stateStore,
    webhookHandler,
  );
}

describe(
  'PropertyOS payment runtime',
  () => {
    afterEach(() => {
      clearEnvironment();
    });

    it(
      'starts safely with payments disabled',
      () => {
        clearEnvironment();

        const runtime =
          createRuntime();

        expect(
          () =>
            runtime.onModuleInit(),
        ).not.toThrow();

        expect(
          runtime.isEnabled(),
        ).toBe(false);

        expect(
          runtime
            .getProviderRegistry()
            .list(),
        ).toEqual([]);
      },
    );

    it(
      'initializes Razorpay',
      () => {
        process.env.PAYMENT_PROVIDER =
          'razorpay';

        process.env.RAZORPAY_KEY_ID =
          'rzp_test_1234567890';

        process.env.RAZORPAY_KEY_SECRET =
          'razorpay-test-secret-000000';

        process.env.RAZORPAY_WEBHOOK_SECRET =
          'razorpay-webhook-secret';

        const runtime =
          createRuntime();

        runtime.onModuleInit();

        expect(
          runtime
            .getProviderRegistry()
            .list()
            .map(
              (provider) =>
                provider.name,
            ),
        ).toEqual([
          'razorpay',
        ]);

        expect(
          runtime
            .getConfiguredProvider(),
        ).toBe(
          'razorpay',
        );
      },
    );

    it(
      'initializes Stripe',
      () => {
        process.env.PAYMENT_PROVIDER =
          'stripe';

        process.env.STRIPE_SECRET_KEY =
          'sk_test_1234567890abcdefghijkl';

        process.env.STRIPE_WEBHOOK_SECRET =
          'whsec_1234567890abcdefghijkl';

        const runtime =
          createRuntime();

        runtime.onModuleInit();

        expect(
          runtime
            .getProviderRegistry()
            .list()
            .map(
              (provider) =>
                provider.name,
            ),
        ).toEqual([
          'stripe',
        ]);
      },
    );

    it(
      'fails closed for incomplete Razorpay configuration',
      () => {
        process.env.PAYMENT_PROVIDER =
          'razorpay';

        const runtime =
          createRuntime();

        expect(
          () =>
            runtime.onModuleInit(),
        ).toThrow(
          'RAZORPAY_CONFIGURATION_BLOCKED',
        );
      },
    );

    it(
      'fails closed for unsupported provider',
      () => {
        process.env.PAYMENT_PROVIDER =
          'unknown';

        const runtime =
          createRuntime();

        expect(
          () =>
            runtime.onModuleInit(),
        ).toThrow(
          'PAYMENT_PROVIDER_SELECTION_BLOCKED',
        );
      },
    );
  },
);
