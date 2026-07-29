import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  Pool,
} from 'pg';

import {
  PostgresPaymentProviderEventRepository,
} from './postgres-payment-provider-event.repository';

function row(
  overrides:
    Record<string, unknown> = {},
) {
  return {
    id:
      'event-1',

    payment_id:
      'payment-1',

    provider_name:
      'razorpay',

    provider_event_id:
      'provider-event-1',

    event_type:
      'payment.captured',

    provider_order_id:
      'order-1',

    provider_payment_id:
      'pay-1',

    provider_refund_id:
      null,

    payload: {
      status:
        'captured',
    },

    metadata: {
      source:
        'webhook',
    },

    occurred_at:
      new Date(
        '2026-07-29T10:00:00.000Z',
      ),

    received_at:
      new Date(
        '2026-07-29T10:00:01.000Z',
      ),

    created_at:
      new Date(
        '2026-07-29T10:00:01.000Z',
      ),

    ...overrides,
  };
}

describe(
  'PostgresPaymentProviderEventRepository',
  () => {
    it(
      'creates and maps an immutable event',
      async () => {
        const query =
          jest.fn(
            async (
              _sql: string,
              _values:
                readonly unknown[],
            ) => ({
              rows: [
                row(),
              ],
            }),
          );

        const repository =
          new PostgresPaymentProviderEventRepository(
            {
              query,
            } as unknown as
              Pool,
          );

        await expect(
          repository.create({
            id:
              'event-1',

            paymentId:
              'payment-1',

            providerName:
              'razorpay',

            providerEventId:
              'provider-event-1',

            eventType:
              'payment.captured',

            providerOrderId:
              'order-1',

            providerPaymentId:
              'pay-1',

            payload: {
              status:
                'captured',
            },

            metadata: {
              source:
                'webhook',
            },

            occurredAt:
              new Date(
                '2026-07-29T10:00:00.000Z',
              ),

            receivedAt:
              new Date(
                '2026-07-29T10:00:01.000Z',
              ),

            createdAt:
              new Date(
                '2026-07-29T10:00:01.000Z',
              ),
          }),
        ).resolves.toMatchObject({
          id:
            'event-1',

          paymentId:
            'payment-1',

          providerPaymentId:
            'pay-1',
        });

        expect(query)
          .toHaveBeenCalledTimes(1);
      },
    );

    it(
      'finds an event by provider identity',
      async () => {
        const repository =
          new PostgresPaymentProviderEventRepository(
            {
              query:
                jest.fn(
                  async (
                    _sql: string,
                    _values:
                      readonly unknown[],
                  ) => ({
                    rows: [
                      row(),
                    ],
                  }),
                ),
            } as unknown as
              Pool,
          );

        await expect(
          repository
            .findByProviderEventId(
              'razorpay',
              'provider-event-1',
            ),
        ).resolves.toMatchObject({
          providerEventId:
            'provider-event-1',
        });
      },
    );

    it(
      'returns a payment timeline in repository order',
      async () => {
        const repository =
          new PostgresPaymentProviderEventRepository(
            {
              query:
                jest.fn(
                  async (
                    _sql: string,
                    _values:
                      readonly unknown[],
                  ) => ({
                    rows: [
                      row(),
                      row({
                        id:
                          'event-2',

                        provider_event_id:
                          'provider-event-2',

                        event_type:
                          'payment.refunded',
                      }),
                    ],
                  }),
                ),
            } as unknown as
              Pool,
          );

        await expect(
          repository.listByPaymentId(
            'payment-1',
          ),
        ).resolves.toHaveLength(2);
      },
    );
  },
);
