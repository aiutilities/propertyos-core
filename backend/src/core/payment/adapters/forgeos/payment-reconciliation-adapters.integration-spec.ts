import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PaymentReconciliationRepository,
  PaymentTransactionRepository,
} from '../../repositories';

import {
  PropertyOSPaymentReconciliationLocalStoreAdapter,
  PropertyOSPaymentReconciliationReportStoreAdapter,
  PropertyOSPaymentReconciliationStateUpdaterAdapter,
} from './index';

describe(
  'PropertyOS payment reconciliation adapters',
  () => {
    it(
      'maps local payment transactions',
      async () => {
        const repository = {
          listForReconciliation:
            jest.fn(
              async () => [
                {
                  id:
                    'payment-1',

                  providerName:
                    'razorpay',

                  providerPaymentId:
                    'pay-1',

                  status:
                    'CAPTURED',

                  money: {
                    amountMinor:
                      125000,

                    currency:
                      'INR',
                  },

                  metadata: {},

                  updatedAt:
                    new Date(
                      '2026-07-29T10:00:00.000Z',
                    ),
                },
              ],
            ),
        } as unknown as
          PaymentTransactionRepository;

        const adapter =
          new PropertyOSPaymentReconciliationLocalStoreAdapter(
            repository,
          );

        await expect(
          adapter.listPayments({
            providerName:
              'razorpay',

            period: {
              start:
                '2026-07-28T00:00:00.000Z',

              end:
                '2026-07-29T23:59:59.000Z',
            },
          }),
        ).resolves.toEqual([
          expect.objectContaining({
            paymentId:
              'payment-1',

            providerPaymentId:
              'pay-1',

            updatedAt:
              '2026-07-29T10:00:00.000Z',
          }),
        ]);
      },
    );

    it(
      'updates local status from provider truth',
      async () => {
        const updateState =
          jest.fn(
            async (
              _input:
                Record<string, unknown>,
            ) => ({
              id:
                'payment-1',
            }),
          );

        const adapter =
          new PropertyOSPaymentReconciliationStateUpdaterAdapter(
            {
              updateState,
            } as unknown as
              PaymentTransactionRepository,
          );

        await adapter
          .updateLocalPayment({
            reconciliationRunId:
              'run-1',

            local: {
              paymentId:
                'payment-1',

              providerName:
                'razorpay',

              providerPaymentId:
                'pay-1',

              status:
                'CREATED',

              money: {
                amountMinor:
                  125000,

                currency:
                  'INR',
              },

              updatedAt:
                '2026-07-29T09:00:00.000Z',
            },

            provider: {
              providerName:
                'razorpay',

              providerPaymentId:
                'pay-1',

              status:
                'CAPTURED',

              money: {
                amountMinor:
                  125000,

                currency:
                  'INR',
              },

              updatedAt:
                '2026-07-29T10:00:00.000Z',
            },
          });

        expect(
          updateState,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentId:
              'payment-1',

            status:
              'CAPTURED',

            metadata:
              expect.objectContaining({
                reconciliationRunId:
                  'run-1',
              }),
          }),
        );
      },
    );

    it(
      'persists a reconciliation report',
      async () => {
        const create =
          jest.fn(
            async (
              input:
                unknown,
            ) => input,
          );

        const adapter =
          new PropertyOSPaymentReconciliationReportStoreAdapter(
            {
              findById:
                jest.fn(
                  async () =>
                    null,
                ),

              create,
            } as unknown as
              PaymentReconciliationRepository,
          );

        await adapter.save({
          runId:
            'run-1',

          providerName:
            'razorpay',

          period: {
            start:
              '2026-07-28T00:00:00.000Z',

            end:
              '2026-07-29T00:00:00.000Z',
          },

          status:
            'COMPLETED',

          localPaymentCount:
            10,

          providerPaymentCount:
            10,

          matchedCount:
            9,

          differenceCount:
            1,

          automaticResolutionCount:
            0,

          manualReviewCount:
            1,

          differences: [],

          startedAt:
            '2026-07-29T10:00:00.000Z',

          completedAt:
            '2026-07-29T10:01:00.000Z',

          durationMilliseconds:
            60000,
        });

        expect(create)
          .toHaveBeenCalledWith(
            expect.objectContaining({
              id:
                'run-1',

              examinedCount:
                10,

              matchedCount:
                9,

              mismatchCount:
                1,
            }),
          );
      },
    );
  },
);
