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
  WorkflowExecutionMetricsService,
} from './workflow-execution-metrics.service';

const createMetrics = () => ({
  incrementCounter:
    jest.fn(),
  observeHistogram:
    jest.fn(),
});

describe(
  'WorkflowExecutionMetricsService',
  () => {
    it.each([
      'start',
      'transition',
    ] as const)(
      'records successful %s execution',
      async (
        operation,
      ) => {
        const metrics =
          createMetrics();

        const service =
          new WorkflowExecutionMetricsService(
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
              'propertyos_workflow_execution_requests_total',
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
              'propertyos_workflow_execution_success_total',
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
              'propertyos_workflow_execution_duration_ms',
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
          new WorkflowExecutionMetricsService(
            metrics as unknown as
              MetricsService,
          );

        const error =
          new BadRequestException(
            'workflow failed',
          );

        await expect(
          service.observe(
            'transition',
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
              'propertyos_workflow_execution_failures_total',
            labels: {
              operation:
                'transition',
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
