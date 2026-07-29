import {
  PaymentReconciliationEngine,
} from '../index';

describe(
  'PaymentReconciliationEngine',
  () => {
    it(
      'matches equal local and provider payments',
      async () => {
        const events:
          string[] = [];

        const reports:
          Record<string, unknown>[] = [];

        const engine =
          new PaymentReconciliationEngine({
            providers: [
              {
                name:
                  'razorpay',

                async listPayments() {
                  return {
                    payments: [
                      {
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
                    ],
                  };
                },
              },
            ],

            localStore: {
              async listPayments() {
                return [
                  {
                    paymentId:
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

                    updatedAt:
                      '2026-07-29T10:00:00.000Z',
                  },
                ];
              },
            },

            eventPublisher: {
              async publish(input) {
                events.push(
                  input.type,
                );
              },
            },

            reportStore: {
              async save(report) {
                reports.push(
                  report as unknown as
                    Record<string, unknown>,
                );
              },
            },

            now:
              () =>
                new Date(
                  '2026-07-29T12:00:00.000Z',
                ),

            createRunId:
              () =>
                'run-1',
          });

        await expect(
          engine.run({
            providerName:
              'razorpay',

            period: {
              start:
                '2026-07-28T00:00:00.000Z',

              end:
                '2026-07-29T00:00:00.000Z',
            },
          }),
        ).resolves.toMatchObject({
          runId:
            'run-1',

          status:
            'COMPLETED',

          localPaymentCount:
            1,

          providerPaymentCount:
            1,

          matchedCount:
            1,

          differenceCount:
            0,
        });

        expect(events).toEqual([
          'payment.reconciliation.started',
          'payment.reconciliation.completed',
        ]);

        expect(reports).toHaveLength(1);
      },
    );

    it(
      'classifies status, amount, and currency mismatches',
      async () => {
        const engine =
          new PaymentReconciliationEngine({
            providers: [
              {
                name:
                  'stripe',

                async listPayments() {
                  return {
                    payments: [
                      {
                        providerName:
                          'stripe',

                        providerPaymentId:
                          'pi-1',

                        status:
                          'CAPTURED',

                        money: {
                          amountMinor:
                            150000,

                          currency:
                            'USD',
                        },

                        updatedAt:
                          '2026-07-29T10:00:00.000Z',
                      },
                    ],
                  };
                },
              },
            ],

            localStore: {
              async listPayments() {
                return [
                  {
                    paymentId:
                      'payment-2',

                    providerName:
                      'stripe',

                    providerPaymentId:
                      'pi-1',

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
                ];
              },
            },

            now:
              () =>
                new Date(
                  '2026-07-29T12:00:00.000Z',
                ),

            createRunId:
              () =>
                'run-2',
          });

        const report =
          await engine.run({
            providerName:
              'stripe',

            period: {
              start:
                '2026-07-28T00:00:00.000Z',

              end:
                '2026-07-29T00:00:00.000Z',
            },
          });

        expect(
          report.differences
            .map(
              (difference) =>
                difference.type,
            ),
        ).toEqual([
          'STATUS_MISMATCH',
          'AMOUNT_MISMATCH',
          'CURRENCY_MISMATCH',
        ]);

        expect(
          report.manualReviewCount,
        ).toBe(3);
      },
    );

    it(
      'auto-updates an allowed status mismatch',
      async () => {
        const updates:
          Record<string, unknown>[] = [];

        const engine =
          new PaymentReconciliationEngine({
            providers: [
              {
                name:
                  'razorpay',

                async listPayments() {
                  return {
                    payments: [
                      {
                        providerName:
                          'razorpay',

                        providerPaymentId:
                          'pay-3',

                        status:
                          'CAPTURED',

                        money: {
                          amountMinor:
                            90000,

                          currency:
                            'INR',
                        },

                        updatedAt:
                          '2026-07-29T10:00:00.000Z',
                      },
                    ],
                  };
                },
              },
            ],

            localStore: {
              async listPayments() {
                return [
                  {
                    paymentId:
                      'payment-3',

                    providerName:
                      'razorpay',

                    providerPaymentId:
                      'pay-3',

                    status:
                      'CREATED',

                    money: {
                      amountMinor:
                        90000,

                      currency:
                        'INR',
                    },

                    updatedAt:
                      '2026-07-29T09:00:00.000Z',
                  },
                ];
              },
            },

            policy: {
              resolutions: {
                STATUS_MISMATCH:
                  'AUTO_UPDATE_LOCAL_STATUS',
              },

              defaultResolution:
                'MANUAL_REVIEW',
            },

            stateUpdater: {
              async updateLocalPayment(
                input,
              ) {
                updates.push(
                  input as unknown as
                    Record<string, unknown>,
                );
              },
            },

            now:
              () =>
                new Date(
                  '2026-07-29T12:00:00.000Z',
                ),

            createRunId:
              () =>
                'run-3',
          });

        await expect(
          engine.run({
            providerName:
              'razorpay',

            period: {
              start:
                '2026-07-28T00:00:00.000Z',

              end:
                '2026-07-29T00:00:00.000Z',
            },
          }),
        ).resolves.toMatchObject({
          automaticResolutionCount:
            1,

          manualReviewCount:
            0,
        });

        expect(updates).toHaveLength(1);
      },
    );

    it(
      'classifies local-only and provider-only payments',
      async () => {
        const engine =
          new PaymentReconciliationEngine({
            providers: [
              {
                name:
                  'stripe',

                async listPayments() {
                  return {
                    payments: [
                      {
                        providerName:
                          'stripe',

                        providerPaymentId:
                          'pi-provider-only',

                        status:
                          'CAPTURED',

                        money: {
                          amountMinor:
                            100000,

                          currency:
                            'INR',
                        },

                        updatedAt:
                          '2026-07-29T10:00:00.000Z',
                      },
                    ],
                  };
                },
              },
            ],

            localStore: {
              async listPayments() {
                return [
                  {
                    paymentId:
                      'payment-local-only',

                    providerName:
                      'stripe',

                    providerPaymentId:
                      'pi-local-only',

                    status:
                      'CREATED',

                    money: {
                      amountMinor:
                        100000,

                      currency:
                        'INR',
                    },

                    updatedAt:
                      '2026-07-29T09:00:00.000Z',
                  },
                ];
              },
            },

            now:
              () =>
                new Date(
                  '2026-07-29T12:00:00.000Z',
                ),
          });

        const report =
          await engine.run({
            providerName:
              'stripe',

            period: {
              start:
                '2026-07-28T00:00:00.000Z',

              end:
                '2026-07-29T00:00:00.000Z',
            },
          });

        expect(
          report.differences
            .map(
              (difference) =>
                difference.type,
            )
            .sort(),
        ).toEqual([
          'LOCAL_ONLY',
          'PROVIDER_ONLY',
        ]);
      },
    );

    it(
      'returns a failed audit report when provider access fails',
      async () => {
        const reports:
          Record<string, unknown>[] = [];

        const engine =
          new PaymentReconciliationEngine({
            providers: [
              {
                name:
                  'razorpay',

                async listPayments() {
                  throw new Error(
                    'Provider unavailable',
                  );
                },
              },
            ],

            localStore: {
              async listPayments() {
                return [];
              },
            },

            reportStore: {
              async save(report) {
                reports.push(
                  report as unknown as
                    Record<string, unknown>,
                );
              },
            },

            now:
              () =>
                new Date(
                  '2026-07-29T12:00:00.000Z',
                ),

            createRunId:
              () =>
                'run-failed',
          });

        await expect(
          engine.run({
            providerName:
              'razorpay',

            period: {
              start:
                '2026-07-28T00:00:00.000Z',

              end:
                '2026-07-29T00:00:00.000Z',
            },
          }),
        ).resolves.toMatchObject({
          status:
            'FAILED',

          errorMessage:
            'Provider unavailable',
        });

        expect(reports).toHaveLength(1);
      },
    );
  },
);
