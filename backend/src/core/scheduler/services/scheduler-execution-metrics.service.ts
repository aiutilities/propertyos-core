import {
  Injectable,
} from '@nestjs/common';

import {
  MetricsService,
} from '../../metrics/services/metrics.service';

export type SchedulerExecutionOperation =
  'claimed_job';

@Injectable()
export class SchedulerExecutionMetricsService {
  constructor(
    private readonly metrics:
      MetricsService,
  ) {}

  start(
    operation:
      SchedulerExecutionOperation,
    jobType:
      string,
  ): number {
    this.metrics.incrementCounter({
      name:
        'propertyos_scheduler_execution_requests_total',
      help:
        'Total Scheduler job execution requests.',
      labels: {
        operation,
        jobType,
      },
    });

    return Date.now();
  }

  success(
    operation:
      SchedulerExecutionOperation,
    jobType:
      string,
    startedAt:
      number,
  ): void {
    this.metrics.incrementCounter({
      name:
        'propertyos_scheduler_execution_success_total',
      help:
        'Total successful Scheduler job executions.',
      labels: {
        operation,
        jobType,
        result:
          'success',
      },
    });

    this.recordDuration(
      operation,
      jobType,
      startedAt,
    );
  }

  failure(
    operation:
      SchedulerExecutionOperation,
    jobType:
      string,
    errorType:
      string,
    startedAt:
      number,
  ): void {
    this.metrics.incrementCounter({
      name:
        'propertyos_scheduler_execution_failures_total',
      help:
        'Total failed Scheduler job executions.',
      labels: {
        operation,
        jobType,
        result:
          'failure',
        errorType,
      },
    });

    this.recordDuration(
      operation,
      jobType,
      startedAt,
    );
  }

  private recordDuration(
    operation:
      SchedulerExecutionOperation,
    jobType:
      string,
    startedAt:
      number,
  ): void {
    this.metrics.observeHistogram({
      name:
        'propertyos_scheduler_execution_duration_ms',
      help:
        'Scheduler job execution duration in milliseconds.',
      labels: {
        operation,
        jobType,
      },
      value:
        Date.now() - startedAt,
    });
  }
}
