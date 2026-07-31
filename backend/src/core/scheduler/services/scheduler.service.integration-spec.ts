import {
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

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
  SchedulerService,
} from "./scheduler.service";

const durableJob = (
  overrides: Partial<SchedulerJob> = {},
): SchedulerJob => ({
  id: "job-durable",
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

describe(
  "SchedulerService createOrResolveJob",
  () => {
    it("delegates a normalized job to create-or-resolve", async () => {
      const durable =
        durableJob();
      const createOrResolve =
        jest.fn(
          async (
            candidate:
              SchedulerJob,
          ) => ({
            job: {
              ...durable,
              name: candidate.name,
            },
            created: true,
          }),
        );

      const repository = {
        createOrResolve,
      };

      const service =
        new SchedulerService(
          repository as unknown as
            PostgresSchedulerRepository,
          new SchedulerHandlerRegistry(),
        );

      const result =
        await service.createOrResolveJob({
          name:
            "Recurring materialization",
          jobType:
            "AI_RECURRING_SCHEDULE_MATERIALIZE",
          payload: {
            scheduleId:
              "schedule-1",
          },
          scheduleType:
            "ONE_TIME",
          runAt:
            "2026-08-01T01:00:00.000Z",
          maxAttempts: 5,
          idempotencyKey:
            durable.idempotencyKey,
        });

      expect(result.created).toBe(true);
      expect(
        createOrResolve,
      ).toHaveBeenCalledTimes(1);

      const candidate =
        createOrResolve.mock
          .calls[0][0];

      expect(candidate).toMatchObject({
        name:
          "Recurring materialization",
        scheduleType:
          "ONE_TIME",
        status: "PENDING",
        attempts: 0,
        maxAttempts: 5,
        idempotencyKey:
          durable.idempotencyKey,
      });
      expect(
        candidate.runAt?.toISOString(),
      ).toBe(
        "2026-08-01T01:00:00.000Z",
      );
      expect(
        candidate.nextRunAt?.toISOString(),
      ).toBe(
        "2026-08-01T01:00:00.000Z",
      );
    });

    it.each([
      undefined,
      "",
      "   ",
    ])(
      "rejects invalid idempotency key %p",
      async (idempotencyKey) => {
        const createOrResolve =
          jest.fn();

        const service =
          new SchedulerService(
            {
              createOrResolve,
            } as unknown as
              PostgresSchedulerRepository,
            new SchedulerHandlerRegistry(),
          );

        await expect(
          service.createOrResolveJob({
            name: "Test",
            jobType:
              "test.job",
            idempotencyKey,
          }),
        ).rejects.toThrow(
          "Scheduler job idempotency key is required",
        );

        expect(
          createOrResolve,
        ).not.toHaveBeenCalled();
      },
    );

    it("rejects an overlong idempotency key", async () => {
      const service =
        new SchedulerService(
          {} as
            PostgresSchedulerRepository,
          new SchedulerHandlerRegistry(),
        );

      await expect(
        service.createOrResolveJob({
          name: "Test",
          jobType: "test.job",
          idempotencyKey:
            "x".repeat(501),
        }),
      ).rejects.toThrow(
        "Scheduler job idempotency key exceeds 500 characters",
      );
    });
  },
);
