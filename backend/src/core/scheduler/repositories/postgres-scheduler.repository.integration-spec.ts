import {
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  PostgresSchedulerRepository,
} from "./postgres-scheduler.repository";
import {
  SchedulerJob,
} from "../types/scheduler.types";

const job = (
  overrides: Partial<SchedulerJob> = {},
): SchedulerJob => ({
  id: "job-new",
  name: "Recurring materialization",
  jobType:
    "AI_RECURRING_SCHEDULE_MATERIALIZE",
  status: "PENDING",
  payload: {
    scheduleId: "schedule-1",
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
  attempts: 0,
  maxAttempts: 3,
  idempotencyKey:
    "ai-recurring-materialize:schedule-1:2026-08-01T01:00:00.000Z",
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

const row = (
  source: SchedulerJob,
): Record<string, unknown> => ({
  id: source.id,
  name: source.name,
  job_type: source.jobType,
  status: source.status,
  payload: source.payload,
  schedule_type: source.scheduleType,
  run_at: source.runAt,
  cron_expression:
    source.cronExpression ?? null,
  last_run_at:
    source.lastRunAt ?? null,
  next_run_at:
    source.nextRunAt ?? null,
  attempts: source.attempts,
  max_attempts: source.maxAttempts,
  error_message:
    source.errorMessage ?? null,
  idempotency_key:
    source.idempotencyKey ?? null,
  created_at: source.createdAt,
  updated_at: source.updatedAt,
});

describe(
  "PostgresSchedulerRepository createOrResolve",
  () => {
    it("returns created true for a new durable job", async () => {
      const candidate = job();
      const query = jest.fn(
        async () => ({
          rows: [row(candidate)],
        }),
      );

      const repository =
        new PostgresSchedulerRepository({
          query,
        } as never);

      const result =
        await repository.createOrResolve(
          candidate,
        );

      expect(result.created).toBe(true);
      expect(result.job).toMatchObject({
        id: candidate.id,
        idempotencyKey:
          candidate.idempotencyKey,
      });
      expect(query).toHaveBeenCalledTimes(
        1,
      );
      expect(
        String(
          (
            query.mock.calls as
              unknown[][]
          )[0][0],
        ),
      ).toContain("ON CONFLICT");
    });

    it("resolves an existing durable job without overwriting it", async () => {
      const candidate = job();
      const existing = job({
        id: "job-existing",
        status: "FAILED",
        attempts: 2,
        errorMessage:
          "previous failure",
      });

      const query = jest.fn(
        async (
          sql: string,
        ) => {
          if (
            sql.includes(
              "INSERT INTO scheduler_jobs",
            )
          ) {
            return {
              rows: [],
            };
          }

          return {
            rows: [row(existing)],
          };
        },
      );

      const repository =
        new PostgresSchedulerRepository({
          query,
        } as never);

      const result =
        await repository.createOrResolve(
          candidate,
        );

      expect(result.created).toBe(false);
      expect(result.job).toMatchObject({
        id: "job-existing",
        status: "FAILED",
        attempts: 2,
        errorMessage:
          "previous failure",
      });
      expect(query).toHaveBeenCalledTimes(
        2,
      );
    });

    it("fails closed when a conflict cannot be resolved", async () => {
      const query = jest.fn(
        async () => ({
          rows: [],
        }),
      );

      const repository =
        new PostgresSchedulerRepository({
          query,
        } as never);

      await expect(
        repository.createOrResolve(
          job(),
        ),
      ).rejects.toThrow(
        "Scheduler job idempotency conflict could not be resolved",
      );
    });

    it("rejects a missing idempotency key", async () => {
      const query = jest.fn();

      const repository =
        new PostgresSchedulerRepository({
          query,
        } as never);

      await expect(
        repository.createOrResolve(
          job({
            idempotencyKey:
              undefined,
          }),
        ),
      ).rejects.toThrow(
        "Scheduler job idempotency key is required",
      );

      expect(query).not.toHaveBeenCalled();
    });

    it("preserves strict create compatibility", async () => {
      const candidate = job({
        idempotencyKey:
          undefined,
      });
      const query = jest.fn(
        async () => ({
          rows: [row(candidate)],
        }),
      );

      const repository =
        new PostgresSchedulerRepository({
          query,
        } as never);

      const created =
        await repository.create(
          candidate,
        );

      expect(created.id).toBe(
        candidate.id,
      );
      expect(
        created.idempotencyKey,
      ).toBeUndefined();
      expect(
        String(
          (
            query.mock.calls as
              unknown[][]
          )[0][0],
        ),
      ).not.toContain("ON CONFLICT");
    });
  },
);
