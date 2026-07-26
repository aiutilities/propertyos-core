import {
  Injectable,
  OnApplicationShutdown,
} from '@nestjs/common';

import {
  SchedulerExecutionMetricsService,
} from './scheduler-execution-metrics.service';

import { ConsolePlatformLogger } from '../../platform';
import { PostgresSchedulerRepository } from '../repositories/postgres-scheduler.repository';
import { SchedulerHandlerRegistry } from '../registries/scheduler-handler.registry';
import { SchedulerJob } from '../types/scheduler.types';

export interface SchedulerWorkerTickResult {
  claimed: number;
  completed: number;
  failed: number;
}

@Injectable()
export class SchedulerWorkerService
  implements OnApplicationShutdown
{
  private timer?: NodeJS.Timeout;
  private running = false;
  private stopping = false;

  constructor(
    private readonly repository: PostgresSchedulerRepository,
    private readonly handlerRegistry: SchedulerHandlerRegistry,
    private readonly logger: ConsolePlatformLogger,

    private readonly executionMetrics:
      SchedulerExecutionMetricsService,

  ) {}

  async start(): Promise<void> {
    if (this.timer || this.stopping) {
      return;
    }

    const pollIntervalMs = this.readPositiveInteger(
      'SCHEDULER_POLL_INTERVAL_MS',
      30000,
    );

    const staleAfterMs = this.readPositiveInteger(
      'SCHEDULER_STALE_AFTER_MS',
      300000,
    );

    const recovered =
      await this.repository.recoverStaleRunningJobs(
        new Date(Date.now() - staleAfterMs),
      );

    this.logger.info('scheduler.worker.started', {
      pollIntervalMs,
      staleAfterMs,
      recoveredJobs: recovered,
    });

    await this.tick();

    this.timer = setInterval(() => {
      void this.tick();
    }, pollIntervalMs);

    this.timer.unref();
  }

  async tick(): Promise<SchedulerWorkerTickResult> {
    if (this.running || this.stopping) {
      return {
        claimed: 0,
        completed: 0,
        failed: 0,
      };
    }

    this.running = true;

    try {
      const batchSize = this.readPositiveInteger(
        'SCHEDULER_BATCH_SIZE',
        20,
      );

      const jobs =
        await this.repository.claimDueOneTimeJobs(batchSize);

      const result: SchedulerWorkerTickResult = {
        claimed: jobs.length,
        completed: 0,
        failed: 0,
      };

      for (const job of jobs) {
        const completed = await this.executeClaimedJob(job);

        if (completed) {
          result.completed += 1;
        } else {
          result.failed += 1;
        }
      }

      if (result.claimed > 0) {
        this.logger.info('scheduler.worker.tick.completed', { ...result });
      }

      return result;
    } catch (error) {
      this.logger.error('scheduler.worker.tick.failed', {
        errorMessage:
          error instanceof Error
            ? error.message
            : 'Unknown scheduler worker error',
      });

      return {
        claimed: 0,
        completed: 0,
        failed: 1,
      };
    } finally {
      this.running = false;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.stopping = true;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }

    while (this.running) {
      await new Promise((resolve) =>
        setTimeout(resolve, 25),
      );
    }

    this.logger.info('scheduler.worker.stopped');
  }

  private async executeClaimedJob(
    job: SchedulerJob,
  ): Promise<boolean> {
    const metricsStartedAt =
      this.executionMetrics.start(
        'claimed_job',
        job.jobType,
      );

    const handler =
      this.handlerRegistry.get(
        job.jobType,
      );

    if (!handler) {
      await this.repository.failClaimedJob(
        job.id,
        `No handler registered for job type: ${job.jobType}`,
      );

      this.logger.warn('scheduler.job.failed', {
        jobId: job.id,
        jobType: job.jobType,
        attempts: job.attempts,
        errorMessage: 'No handler registered',
      });

      this.executionMetrics.failure(
        'claimed_job',
        job.jobType,
        'MissingHandler',
        metricsStartedAt,
      );

      return false;
    }

    try {
      await handler.handle(job);
      await this.repository.completeClaimedJob(job.id);

      this.logger.info('scheduler.job.completed', {
        jobId: job.id,
        jobType: job.jobType,
        attempts: job.attempts,
      });

      this.executionMetrics.success(
        'claimed_job',
        job.jobType,
        metricsStartedAt,
      );

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unknown scheduler error';

      const retryAt =
        job.attempts < job.maxAttempts
          ? new Date(
              Date.now() +
                this.retryDelayMs(job.attempts),
            )
          : undefined;

      await this.repository.failClaimedJob(
        job.id,
        errorMessage,
        retryAt,
      );

      this.logger.warn('scheduler.job.failed', {
        jobId: job.id,
        jobType: job.jobType,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        retryAt: retryAt?.toISOString(),
        errorMessage,
      });

      this.executionMetrics.failure(
        'claimed_job',
        job.jobType,
        this.schedulerErrorType(
          error,
        ),
        metricsStartedAt,
      );

      return false;
    }
  }

  private schedulerErrorType(
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

  private retryDelayMs(attempt: number): number {
    const baseDelayMs = this.readPositiveInteger(
      'SCHEDULER_RETRY_BASE_DELAY_MS',
      30000,
    );

    const maxDelayMs = this.readPositiveInteger(
      'SCHEDULER_MAX_RETRY_DELAY_MS',
      300000,
    );

    return Math.min(
      baseDelayMs * 2 ** Math.max(0, attempt - 1),
      maxDelayMs,
    );
  }

  private readPositiveInteger(
    key: string,
    fallback: number,
  ): number {
    const value = Number(process.env[key]);

    return Number.isInteger(value) && value > 0
      ? value
      : fallback;
  }
}
