import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PaymentTransactionRepository,
} from '../repositories';

import {
  PaymentEventStoreService,
} from '../services';

import {
  PropertyOSPaymentWebhookHandler,
} from './propertyos-payment-webhook.handler';

describe(
  'PropertyOSPaymentWebhookHandler',
  () => {
    it(
      'appends and updates a matched payment',
      async () => {
        const append =
          jest.fn(
            async (
              input:
                Record<string, unknown>,
            ) => input,
          );

        const updateState =
          jest.fn(
            async (
              input:
                Record<string, unknown>,
            ) => ({
              id:
                input.paymentId,
            }),
          );

        const handler =
          new PropertyOSPaymentWebhookHandler(
            {
              findByProviderIdentifiers:
                jest.fn(
                  async () => ({
                    id:
                      'payment-1',

                    providerName:
                      'stripe',
                  }),
                ),

              updateState,
            } as unknown as
              PaymentTransactionRepository,

            {
              append,
            } as unknown as
              PaymentEventStoreService,
          );

        await handler.handle({
          providerName:
            'stripe',

          eventId:
            'evt-1',

          eventType:
            'payment_intent.succeeded',

          providerOrderId:
            'pi-1',

          providerPaymentId:
            'pi-1',

          status:
            'CAPTURED',

          money: {
            amountMinor:
              125000,

            currency:
              'INR',
          },

          occurredAt:
            '2026-07-29T10:00:00.000Z',

          receivedAt:
            '2026-07-29T10:00:01.000Z',
        });

        expect(append)
          .toHaveBeenCalledWith(
            expect.objectContaining({
              paymentId:
                'payment-1',

              providerEventId:
                'evt-1',

              eventType:
                'payment_intent.succeeded',

              providerPaymentId:
                'pi-1',
            }),
          );

        expect(updateState)
          .toHaveBeenCalledWith(
            expect.objectContaining({
              paymentId:
                'payment-1',

              status:
                'CAPTURED',

              providerPaymentId:
                'pi-1',
            }),
          );
      },
    );

    it(
      'keeps an unmatched provider event for investigation',
      async () => {
        const append =
          jest.fn(
            async (
              input:
                Record<string, unknown>,
            ) => input,
          );

        const updateState =
          jest.fn();

        const handler =
          new PropertyOSPaymentWebhookHandler(
            {
              findByProviderIdentifiers:
                jest.fn(
                  async () =>
                    null,
                ),

              updateState,
            } as unknown as
              PaymentTransactionRepository,

            {
              append,
            } as unknown as
              PaymentEventStoreService,
          );

        await handler.handle({
          providerName:
            'razorpay',

          eventId:
            'event-unknown',

          eventType:
            'payment.captured',

          providerPaymentId:
            'pay-unknown',

          status:
            'CAPTURED',

          receivedAt:
            '2026-07-29T10:00:01.000Z',
        });

        expect(append)
          .toHaveBeenCalledWith(
            expect.objectContaining({
              paymentId:
                undefined,

              providerEventId:
                'event-unknown',

              metadata:
                expect.objectContaining({
                  matchedPayment:
                    false,
                }),
            }),
          );

        expect(updateState)
          .not
          .toHaveBeenCalled();
      },
    );

    it(
      'does not update state when provider status is absent',
      async () => {
        const updateState =
          jest.fn();

        const handler =
          new PropertyOSPaymentWebhookHandler(
            {
              findByProviderIdentifiers:
                jest.fn(
                  async () => ({
                    id:
                      'payment-1',
                  }),
                ),

              updateState,
            } as unknown as
              PaymentTransactionRepository,

            {
              append:
                jest.fn(
                  async (
                    input:
                      Record<string, unknown>,
                  ) => input,
                ),
            } as unknown as
              PaymentEventStoreService,
          );

        await handler.handle({
          providerName:
            'razorpay',

          eventId:
            'event-order-paid',

          eventType:
            'order.paid',

          providerOrderId:
            'order-1',

          receivedAt:
            '2026-07-29T10:00:01.000Z',
        });

        expect(updateState)
          .not
          .toHaveBeenCalled();
      },
    );

    it(
      'uses a stable fallback identity when provider event id is absent',
      async () => {
        const append =
          jest.fn(
            async (
              input:
                Record<string, unknown>,
            ) => input,
          );

        const handler =
          new PropertyOSPaymentWebhookHandler(
            {
              findByProviderIdentifiers:
                jest.fn(
                  async () =>
                    null,
                ),
            } as unknown as
              PaymentTransactionRepository,

            {
              append,
            } as unknown as
              PaymentEventStoreService,
          );

        await handler.handle({
          providerName:
            'razorpay',

          eventType:
            'payment.failed',

          providerPaymentId:
            'pay-1',

          receivedAt:
            '2026-07-29T10:00:01.000Z',
        });

        expect(append)
          .toHaveBeenCalledWith(
            expect.objectContaining({
              providerEventId:
                'razorpay:payment.failed:pay-1:2026-07-29T10:00:01.000Z',
            }),
          );
      },
    );
  },
);
