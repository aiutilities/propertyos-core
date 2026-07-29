import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PaymentProviderEventRepository,
} from '../repositories';

import {
  PaymentEventStoreService,
} from './payment-event-store.service';

describe(
  'PaymentEventStoreService',
  () => {
    it(
      'appends a new immutable event',
      async () => {
        const create =
          jest.fn(
            async (
              input:
                Record<string, unknown>,
            ) => input,
          );

        const service =
          new PaymentEventStoreService(
            {
              findByProviderEventId:
                jest.fn(
                  async () =>
                    null,
                ),

              create,
            } as unknown as
              PaymentProviderEventRepository,
          );

        await service.append({
          id:
            'event-1',

          paymentId:
            'payment-1',

          providerName:
            'stripe',

          providerEventId:
            'evt-1',

          eventType:
            'payment_intent.succeeded',

          providerPaymentId:
            'pi-1',

          occurredAt:
            new Date(
              '2026-07-29T10:00:00.000Z',
            ),

          receivedAt:
            new Date(
              '2026-07-29T10:00:01.000Z',
            ),
        });

        expect(create)
          .toHaveBeenCalledWith(
            expect.objectContaining({
              id:
                'event-1',

              providerEventId:
                'evt-1',

              createdAt:
                new Date(
                  '2026-07-29T10:00:01.000Z',
                ),
            }),
          );
      },
    );

    it(
      'returns the existing event for provider redelivery',
      async () => {
        const existing = {
          id:
            'event-existing',

          providerName:
            'razorpay',

          providerEventId:
            'provider-event-1',
        };

        const create =
          jest.fn();

        const service =
          new PaymentEventStoreService(
            {
              findByProviderEventId:
                jest.fn(
                  async () =>
                    existing,
                ),

              create,
            } as unknown as
              PaymentProviderEventRepository,
          );

        await expect(
          service.append({
            id:
              'event-new',

            providerName:
              'razorpay',

            providerEventId:
              'provider-event-1',

            eventType:
              'payment.captured',
          }),
        ).resolves.toBe(
          existing,
        );

        expect(create)
          .not
          .toHaveBeenCalled();
      },
    );

    it(
      'returns an ordered payment timeline',
      async () => {
        const timeline = [
          {
            id:
              'event-1',
          },
          {
            id:
              'event-2',
          },
        ];

        const service =
          new PaymentEventStoreService(
            {
              listByPaymentId:
                jest.fn(
                  async () =>
                    timeline,
                ),
            } as unknown as
              PaymentProviderEventRepository,
          );

        await expect(
          service.timeline(
            'payment-1',
          ),
        ).resolves.toBe(
          timeline,
        );
      },
    );
  },
);
