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
  PostgresPaymentTransactionRepository,
} from './postgres-payment-transaction.repository';

function row(
  overrides:
    Record<string, unknown> = {},
) {
  return {
    id:
      'payment-1',

    source:
      'propertyos.rent',

    source_reference_id:
      'rent-1',

    provider_name:
      'razorpay',

    provider_order_id:
      'order-1',

    provider_payment_id:
      null,

    provider_refund_id:
      null,

    idempotency_key:
      'rent:rent-1',

    status:
      'CREATED',

    amount_minor:
      '125000',

    currency:
      'INR',

    customer_id:
      'tenant-1',

    description:
      'Rent payment',

    failure_code:
      null,

    failure_message:
      null,

    metadata: {
      propertyId:
        'property-1',
    },

    created_at:
      new Date(
        '2026-07-29T12:00:00.000Z',
      ),

    updated_at:
      new Date(
        '2026-07-29T12:00:00.000Z',
      ),

    ...overrides,
  };
}

describe(
  'PostgresPaymentTransactionRepository',
  () => {
    it(
      'creates and maps a payment transaction',
      async () => {
        const query =
          jest.fn(
            async () => ({
              rows: [
                row(),
              ],
            }),
          );

        const repository =
          new PostgresPaymentTransactionRepository(
            {
              query,
            } as unknown as
              Pool,
          );

        await expect(
          repository.create({
            id:
              'payment-1',

            source:
              'propertyos.rent',

            sourceReferenceId:
              'rent-1',

            providerName:
              'razorpay',

            providerOrderId:
              'order-1',

            idempotencyKey:
              'rent:rent-1',

            status:
              'CREATED',

            money: {
              amountMinor:
                125000,

              currency:
                'INR',
            },

            customerId:
              'tenant-1',

            description:
              'Rent payment',

            metadata: {
              propertyId:
                'property-1',
            },

            createdAt:
              new Date(
                '2026-07-29T12:00:00.000Z',
              ),

            updatedAt:
              new Date(
                '2026-07-29T12:00:00.000Z',
              ),
          }),
        ).resolves.toMatchObject({
          id:
            'payment-1',

          money: {
            amountMinor:
              125000,

            currency:
              'INR',
          },
        });

        expect(query).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'returns null for a missing transaction',
      async () => {
        const repository =
          new PostgresPaymentTransactionRepository(
            {
              query:
                jest.fn(
                  async () => ({
                    rows: [],
                  }),
                ),
            } as unknown as
              Pool,
          );

        await expect(
          repository.findById(
            'missing',
          ),
        ).resolves.toBeNull();
      },
    );

    it(
      'updates payment state',
      async () => {
        const query =
          jest.fn(
            async () => ({
              rows: [
                row({
                  status:
                    'CAPTURED',

                  provider_payment_id:
                    'pay-1',
                }),
              ],
            }),
          );

        const repository =
          new PostgresPaymentTransactionRepository(
            {
              query,
            } as unknown as
              Pool,
          );

        await expect(
          repository.updateState({
            paymentId:
              'payment-1',

            status:
              'CAPTURED',

            providerName:
              'razorpay',

            providerPaymentId:
              'pay-1',

            metadata: {
              captured:
                true,
            },
          }),
        ).resolves.toMatchObject({
          status:
            'CAPTURED',

          providerPaymentId:
            'pay-1',
        });
      },
    );

    it(
      'lists transactions for reconciliation period',
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
          new PostgresPaymentTransactionRepository(
            {
              query,
            } as unknown as
              Pool,
          );

        await expect(
          repository
            .listForReconciliation(
              'razorpay',

              new Date(
                '2026-07-28T00:00:00.000Z',
              ),

              new Date(
                '2026-07-29T23:59:59.000Z',
              ),
            ),
        ).resolves.toHaveLength(1);

        expect(query)
          .toHaveBeenCalledWith(
            expect.stringContaining(
              'updated_at >= $2',
            ),

            [
              'razorpay',

              new Date(
                '2026-07-28T00:00:00.000Z',
              ),

              new Date(
                '2026-07-29T23:59:59.000Z',
              ),
            ],
          );
      },
    );

    it(
      'finds a transaction using provider identifiers',
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
          new PostgresPaymentTransactionRepository(
            {
              query,
            } as unknown as
              Pool,
          );

        await expect(
          repository
            .findByProviderIdentifiers(
              'razorpay',
              {
                providerOrderId:
                  'order-1',

                providerPaymentId:
                  'pay-1',
              },
            ),
        ).resolves.toMatchObject({
          id:
            'payment-1',
        });

        expect(query)
          .toHaveBeenCalledWith(
            expect.stringContaining(
              'provider_payment_id',
            ),

            [
              'razorpay',
              'pay-1',
              'order-1',
            ],
          );
      },
    );

    it(
      'does not query without provider identifiers',
      async () => {
        const query =
          jest.fn();

        const repository =
          new PostgresPaymentTransactionRepository(
            {
              query,
            } as unknown as
              Pool,
          );

        await expect(
          repository
            .findByProviderIdentifiers(
              'stripe',
              {},
            ),
        ).resolves.toBeNull();

        expect(query)
          .not
          .toHaveBeenCalled();
      },
    );
  },
);
