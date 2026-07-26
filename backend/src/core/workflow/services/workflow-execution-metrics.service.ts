import {
  Injectable,
} from '@nestjs/common';

import {
  MetricsService,
} from '../../metrics/services/metrics.service';

export type WorkflowExecutionOperation =
  | 'start'
  | 'transition';

@Injectable()
export class WorkflowExecutionMetricsService {
  constructor(
    private readonly metrics:
      MetricsService,
  ) {}

  async observe<T>(
    operation:
      WorkflowExecutionOperation,
    execute:
      () => Promise<T>,
  ): Promise<T> {
    const startedAt =
      Date.now();

    this.metrics.incrementCounter({
      name:
        'propertyos_workflow_execution_requests_total',
      help:
        'Total Workflow execution requests.',
      labels: {
        operation,
      },
    });

    try {
      const result =
        await execute();

      this.metrics.incrementCounter({
        name:
          'propertyos_workflow_execution_success_total',
        help:
          'Total successful Workflow executions.',
        labels: {
          operation,
        },
      });

      return result;
    } catch (error) {
      this.metrics.incrementCounter({
        name:
          'propertyos_workflow_execution_failures_total',
        help:
          'Total failed Workflow executions.',
        labels: {
          operation,
          errorType:
            this.errorType(error),
        },
      });

      throw error;
    } finally {
      this.metrics.observeHistogram({
        name:
          'propertyos_workflow_execution_duration_ms',
        help:
          'Workflow execution duration in milliseconds.',
        labels: {
          operation,
        },
        value:
          Date.now() - startedAt,
      });
    }
  }

  private errorType(
    error: unknown,
  ): string {
    if (
      error instanceof Error &&
      error.name.trim()
    ) {
      return error.name;
    }

    return 'UnknownError';
  }
}
