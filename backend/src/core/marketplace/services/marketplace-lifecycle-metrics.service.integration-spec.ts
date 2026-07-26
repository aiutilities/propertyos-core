import {
  ConflictException,
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
  MarketplaceLifecycleMetricsService,
} from './marketplace-lifecycle-metrics.service';

const createMetrics = () => ({
  incrementCounter:
    jest.fn(),
  observeHistogram:
    jest.fn(),
});

describe(
  'MarketplaceLifecycleMetricsService',
  () => {
    it.each([
      'install',
      'upgrade',
      'rollback',
      'uninstall',
    ] as const)(
      'records successful %s lifecycle execution',
      async (
        operation,
      ) => {
        const metrics =
          createMetrics();

        const service =
          new MarketplaceLifecycleMetricsService(
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
              'propertyos_marketplace_lifecycle_requests_total',
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
              'propertyos_marketplace_lifecycle_success_total',
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
              'propertyos_marketplace_lifecycle_duration_ms',
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
      'records lifecycle failure and rethrows the original error',
      async () => {
        const metrics =
          createMetrics();

        const service =
          new MarketplaceLifecycleMetricsService(
            metrics as unknown as
              MetricsService,
          );

        const error =
          new ConflictException(
            'plugin not installed',
          );

        await expect(
          service.observe(
            'upgrade',
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
              'propertyos_marketplace_lifecycle_failures_total',
            labels: {
              operation:
                'upgrade',
              errorType:
                'ConflictException',
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
