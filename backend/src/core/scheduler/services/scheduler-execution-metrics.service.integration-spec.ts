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
  SchedulerExecutionMetricsService,
} from './scheduler-execution-metrics.service';

const createMetrics = () => ({
  incrementCounter:
    jest.fn(),
  observeHistogram:
    jest.fn(),
});

describe(
  'SchedulerExecutionMetricsService',
  () => {
    it(
      'records Scheduler execution requests',
      () => {
        const metrics =
          createMetrics();

        const service =
          new SchedulerExecutionMetricsService(
            metrics as unknown as
              MetricsService,
          );

        const startedAt =
          service.start(
            'claimed_job',
            'report.export',
          );

        expect(
          startedAt,
        ).toEqual(
          expect.any(Number),
        );

        expect(
          metrics.incrementCounter,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_scheduler_execution_requests_total',
            labels: {
              operation:
                'claimed_job',
              jobType:
                'report.export',
            },
          }),
        );
      },
    );

    it(
      'records successful Scheduler execution',
      () => {
        const metrics =
          createMetrics();

        const service =
          new SchedulerExecutionMetricsService(
            metrics as unknown as
              MetricsService,
          );

        service.success(
          'claimed_job',
          'report.export',
          Date.now() - 10,
        );

        expect(
          metrics.incrementCounter,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_scheduler_execution_success_total',
            labels: {
              operation:
                'claimed_job',
              jobType:
                'report.export',
              result:
                'success',
            },
          }),
        );

        expect(
          metrics.observeHistogram,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_scheduler_execution_duration_ms',
            labels: {
              operation:
                'claimed_job',
              jobType:
                'report.export',
            },
            value:
              expect.any(Number),
          }),
        );
      },
    );

    it(
      'records failed Scheduler execution',
      () => {
        const metrics =
          createMetrics();

        const service =
          new SchedulerExecutionMetricsService(
            metrics as unknown as
              MetricsService,
          );

        service.failure(
          'claimed_job',
          'report.export',
          'Error',
          Date.now() - 10,
        );

        expect(
          metrics.incrementCounter,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            name:
              'propertyos_scheduler_execution_failures_total',
            labels: {
              operation:
                'claimed_job',
              jobType:
                'report.export',
              result:
                'failure',
              errorType:
                'Error',
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
