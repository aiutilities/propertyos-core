import {
  BadRequestException,
} from '@nestjs/common';
import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  MetricsService,
} from '../../metrics/services/metrics.service';
import {
  ProcurementTransitionMetricsService,
} from './procurement-transition-metrics.service';

const createMetrics = () => ({
  incrementCounter:
    jest.fn(),
  observeHistogram:
    jest.fn(),
});

describe(
  'ProcurementTransitionMetricsService',
  () => {
    it.each([
      'goods_receipt_post',
      'purchase_order_issue',
      'payment_request_pay',
      'invoice_match_complete',
    ] as const)(
      'records successful %s execution',
      async (
        operation,
      ) => {
        const metrics =
          createMetrics();

        const service =
          new ProcurementTransitionMetricsService(
            metrics as unknown as
              MetricsService,
          );

        await expect(
          service.observe(
            operation,
            async () => ({
              success:
                true,
            }),
          ),
        ).resolves.toEqual({
          success:
            true,
        });

        expect(
          metrics.incrementCounter,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_procurement_transition_requests_total',
            labels: {
              operation,
            },
          }),
        );

        expect(
          metrics.incrementCounter,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_procurement_transition_success_total',
            labels: {
              operation,
            },
          }),
        );

        expect(
          metrics.observeHistogram,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_procurement_transition_duration_ms',
            labels: {
              operation,
            },
            value:
              expect.any(Number),
          }),
        );
      },
    );

    it(
      'records failure and rethrows the original error',
      async () => {
        const metrics =
          createMetrics();

        const service =
          new ProcurementTransitionMetricsService(
            metrics as unknown as
              MetricsService,
          );

        const error =
          new BadRequestException(
            'transition failed',
          );

        await expect(
          service.observe(
            'payment_request_pay',
            async () => {
              throw error;
            },
          ),
        ).rejects.toBe(error);

        expect(
          metrics.incrementCounter,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_procurement_transition_failures_total',
            labels: {
              operation:
                'payment_request_pay',
              errorType:
                'BadRequestException',
            },
          }),
        );

        expect(
          metrics.observeHistogram,
        ).toHaveBeenCalledTimes(1);
      },
    );
  },
);
