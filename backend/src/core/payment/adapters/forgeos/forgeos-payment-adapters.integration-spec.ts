import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  EventBusService,
} from '../../../eventbus/services/eventbus.service';

import {
  PropertyOSPaymentEventPublisherAdapter,
  PropertyOSPaymentLoggerAdapter,
  createPropertyOSRazorpayProvider,
  createPropertyOSStripeProvider,
} from './index';

describe(
  'PropertyOS ForgeOS payment adapters',
  () => {
    it(
      'publishes ForgeOS payment events through PropertyOS',
      async () => {
        const publish =
          jest.fn(
            async (
              type: string,
              source: string,
              payload:
                Record<string, unknown>,
              options:
                Record<string, unknown>,
            ) => ({
              id:
                'event-payment-1',

              type,
              source,
              payload,

              createdAt:
                new Date(
                  '2026-07-29T12:00:00.000Z',
                ),

              correlationId:
                String(
                  options
                    .correlationId,
                ),

              causationId:
                String(
                  options
                    .causationId,
                ),

              metadata:
                options.metadata as
                  Record<string, unknown>,
            }),
          );

        const adapter =
          new PropertyOSPaymentEventPublisherAdapter(
            {
              publish,
            } as unknown as
              EventBusService,
          );

        await expect(
          adapter.publish({
            type:
              'payment.created',

            source:
              'forgeos.payment',

            payload: {
              paymentId:
                'payment-1',
            },

            correlationId:
              'correlation-1',

            causationId:
              'causation-1',

            metadata: {
              provider:
                'razorpay',
            },
          }),
        ).resolves.toMatchObject({
          id:
            'event-payment-1',

          type:
            'payment.created',

          occurredAt:
            '2026-07-29T12:00:00.000Z',

          correlationId:
            'correlation-1',
        });
      },
    );

    it(
      'creates a valid Razorpay provider',
      () => {
        expect(
          createPropertyOSRazorpayProvider({
            keyId:
              'rzp_test_1234567890',

            keySecret:
              'razorpay-test-secret-000000',

            webhookSecret:
              'razorpay-webhook-secret',
          })
            .validateConfiguration(),
        ).toMatchObject({
          status:
            'READY',
        });
      },
    );

    it(
      'creates a valid Stripe provider',
      () => {
        expect(
          createPropertyOSStripeProvider({
            secretKey:
              'sk_test_1234567890abcdefghijkl',

            webhookSecret:
              'whsec_1234567890abcdefghijkl',
          })
            .validateConfiguration(),
        ).toMatchObject({
          status:
            'READY',
        });
      },
    );

    it(
      'provides a safe payment logger',
      () => {
        const logger =
          new PropertyOSPaymentLoggerAdapter();

        expect(
          () => {
            logger.debug?.(
              'debug',
            );

            logger.info?.(
              'info',
            );

            logger.warn?.(
              'warn',
            );

            logger.error(
              'error',
            );
          },
        ).not.toThrow();
      },
    );
  },
);
