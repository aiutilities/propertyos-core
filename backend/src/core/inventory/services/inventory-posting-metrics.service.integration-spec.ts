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
  InventoryPostingMetricsService,
} from './inventory-posting-metrics.service';

const createMetrics = () => ({
  incrementCounter:
    jest.fn(),
  observeHistogram:
    jest.fn(),
});

describe(
  'InventoryPostingMetricsService',
  () => {
    it.each([
      'material_issue',
      'material_return',
      'stock_adjustment',
      'transfer_dispatch',
      'transfer_receive',
    ] as const)(
      'records successful %s execution',
      async (
        operation,
      ) => {
        const metrics =
          createMetrics();

        const service =
          new InventoryPostingMetricsService(
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
              'propertyos_inventory_posting_requests_total',
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
              'propertyos_inventory_posting_success_total',
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
              'propertyos_inventory_posting_duration_ms',
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
          new InventoryPostingMetricsService(
            metrics as unknown as
              MetricsService,
          );

        const error =
          new BadRequestException(
            'posting failed',
          );

        await expect(
          service.observe(
            'material_issue',
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
              'propertyos_inventory_posting_failures_total',
            labels: {
              operation:
                'material_issue',
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
