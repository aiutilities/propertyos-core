import {
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  ConsolePlatformLogger,
} from "../../platform";
import {
  PostgresSchedulerRepository,
} from "../repositories/postgres-scheduler.repository";
import {
  SchedulerHandlerRegistry,
} from "../registries/scheduler-handler.registry";
import {
  SchedulerJob,
} from "../types/scheduler.types";
import {
  SchedulerExecutionMetricsService,
} from "./scheduler-execution-metrics.service";
import {
  SchedulerWorkerService,
} from "./scheduler-worker.service";

const job = (
  overrides: Partial<SchedulerJob> = {},
): SchedulerJob => ({
  id: "job-1",
  name: "Export report",
  jobType: "report.export",
  status: "RUNNING",
  payload: {
    reportId: "report-1",
  },
  scheduleType: "ONE_TIME",
  runAt:
    new Date(
      "2026-08-01T01:00:00.000Z",
    ),
  nextRunAt:
    new Date(
      "2026-08-01T01:00:00.000Z",
    ),
  attempts: 1,
  maxAttempts: 3,
  createdAt:
    new Date(
      "2026-08-01T00:00:00.000Z",
    ),
  updatedAt:
    new Date(
      "2026-08-01T00:00:00.000Z",
    ),
  ...overrides,
});

const harness = (
  claimedJob: SchedulerJob,
  handle?: (
    job: SchedulerJob,
  ) => Promise<void>,
) => {
  const recoverStaleRunningJobs =
    jest.fn(
      async () => 0,
    );

  const claimDueOneTimeJobs =
    jest.fn(
      async () => [
        claimedJob,
      ],
    );

  const completeClaimedJob =
    jest.fn(
      async (
        _jobId: string,
      ) => claimedJob,
    );

  const failClaimedJob =
    jest.fn(
      async (
        _jobId: string,
        _errorMessage: string,
        _nextRunAt: Date,
      ) => claimedJob,
    );

  const repository = {
    recoverStaleRunningJobs,
    claimDueOneTimeJobs,
    completeClaimedJob,
    failClaimedJob,
  };

  const registry =
    new SchedulerHandlerRegistry();

  if (handle) {
    registry.register({
      jobType: claimedJob.jobType,
      handle,
    });
  }

  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const metrics = {
    start:
      jest.fn().mockReturnValue(100),
    success: jest.fn(),
    failure: jest.fn(),
  };

  return {
    repository,
    metrics,
    worker:
      new SchedulerWorkerService(
        repository as unknown as
          PostgresSchedulerRepository,
        registry,
        logger as unknown as
          ConsolePlatformLogger,
        metrics as unknown as
          SchedulerExecutionMetricsService,
      ),
  };
};

describe(
  "SchedulerWorkerService handler resolution",
  () => {
    it("resolves and invokes the registered handler once", async () => {
      const claimedJob = job();
      const handle =
        jest.fn(async (
          _job: SchedulerJob,
        ) => undefined);

      const {
        worker,
        repository,
        metrics,
      } = harness(
        claimedJob,
        handle,
      );

      const result =
        await worker.tick();

      expect(result).toEqual({
        claimed: 1,
        completed: 1,
        failed: 0,
      });
      expect(handle).toHaveBeenCalledTimes(
        1,
      );
      expect(handle).toHaveBeenCalledWith(
        claimedJob,
      );
      expect(
        repository.completeClaimedJob,
      ).toHaveBeenCalledWith(
        claimedJob.id,
      );
      expect(
        repository.failClaimedJob,
      ).not.toHaveBeenCalled();
      expect(metrics.success).toHaveBeenCalledWith(
        "claimed_job",
        claimedJob.jobType,
        100,
      );
    });

    it("fails closed when no handler is registered", async () => {
      const claimedJob = job({
        jobType: "unknown.job",
      });

      const {
        worker,
        repository,
        metrics,
      } = harness(claimedJob);

      const result =
        await worker.tick();

      expect(result).toEqual({
        claimed: 1,
        completed: 0,
        failed: 1,
      });
      expect(
        repository.completeClaimedJob,
      ).not.toHaveBeenCalled();
      expect(
        repository.failClaimedJob,
      ).toHaveBeenCalledWith(
        claimedJob.id,
        "No handler registered for job type: unknown.job",
        expect.any(Date),
      );
      expect(metrics.failure).toHaveBeenCalledWith(
        "claimed_job",
        claimedJob.jobType,
        "SchedulerHandlerNotFoundError",
        100,
      );
    });

    it("preserves handler failure and retry behavior", async () => {
      const claimedJob = job();
      const failure =
        new Error("handler failed");

      const {
        worker,
        repository,
        metrics,
      } = harness(
        claimedJob,
        async () => {
          throw failure;
        },
      );

      const result =
        await worker.tick();

      expect(result).toEqual({
        claimed: 1,
        completed: 0,
        failed: 1,
      });
      expect(
        repository.failClaimedJob,
      ).toHaveBeenCalledWith(
        claimedJob.id,
        failure.message,
        expect.any(Date),
      );
      expect(metrics.failure).toHaveBeenCalledWith(
        "claimed_job",
        claimedJob.jobType,
        "Error",
        100,
      );
    });
  },
);
