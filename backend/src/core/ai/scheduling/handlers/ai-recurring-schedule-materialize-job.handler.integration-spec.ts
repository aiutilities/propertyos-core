import {
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  SchedulerHandlerRegistry,
} from "../../../scheduler/registries/scheduler-handler.registry";
import {
  SchedulerService,
} from "../../../scheduler/services/scheduler.service";
import {
  SchedulerJob,
} from "../../../scheduler/types/scheduler.types";
import {
  AiScheduledOccurrence,
} from "../types/ai-schedule.types";
import {
  AiPlatformScheduleBridgeService,
} from "../execution/ai-platform-schedule-bridge.service";
import {
  AiRecurringOccurrenceMaterializerService,
} from "../execution/ai-recurring-occurrence-materializer.service";
import {
  AiRecurringScheduleMaterializeJobHandler,
} from "./ai-recurring-schedule-materialize-job.handler";
import {
  AiRecurringMaterializationObservabilityService,
} from "../observability/ai-recurring-materialization-observability.service";

const occurrence = (
  id: string,
  scheduledFor: string,
): AiScheduledOccurrence => ({
  id,
  scheduleId: "schedule-1",
  sequence: 1,
  scheduledFor,
  status: "pending",
  attemptCount: 0,
  createdAt:
    "2026-08-01T00:00:00.000Z",
  updatedAt:
    "2026-08-01T00:00:00.000Z",
});

const job = (
  payload: Record<string, unknown> = {
    scheduleId: "schedule-1",
    requestedAt:
      "2026-08-01T01:00:00.000Z",
    maximumCatchUpOccurrences:
      10,
  },
): SchedulerJob =>
  ({
    id: "scheduler-job-1",
    jobType:
      "AI_RECURRING_SCHEDULE_MATERIALIZE",
    payload,
  }) as SchedulerJob;

const harness = () => {
  const register =
    jest.fn();

  const materialize =
    jest.fn<
      AiRecurringOccurrenceMaterializerService[
        "materialize"
      ]
    >();

  const enqueueOccurrence =
    jest.fn<
      AiPlatformScheduleBridgeService[
        "enqueueOccurrence"
      ]
    >();

  const createOrResolveJob =
    jest.fn<
      SchedulerService[
        "createOrResolveJob"
      ]
    >();

  const handler =
    new AiRecurringScheduleMaterializeJobHandler(
      {
        register,
      } as unknown as
        SchedulerHandlerRegistry,
      {
        materialize,
      } as unknown as
        AiRecurringOccurrenceMaterializerService,
      {
        enqueueOccurrence,
      } as unknown as
        AiPlatformScheduleBridgeService,
      {
        createOrResolveJob,
      } as unknown as
        SchedulerService,
      {
        requested:
          jest.fn(
            () => Date.now(),
          ),
        completed:
          jest.fn(),
        stopped:
          jest.fn(),
        occurrenceRegistered:
          jest.fn(),
        nextJobResolved:
          jest.fn(),
        failed:
          jest.fn(),
        handlerMaxAttempts:
          jest.fn(
            () => 3,
          ),
      } as unknown as
        AiRecurringMaterializationObservabilityService,
    );

  return {
    register,
    materialize,
    enqueueOccurrence,
    createOrResolveJob,
    handler,
  };
};

describe(
  "AiRecurringScheduleMaterializeJobHandler",
  () => {
    it("registers with the scheduler", () => {
      const {
        handler,
        register,
      } = harness();

      handler.onModuleInit();

      expect(register)
        .toHaveBeenCalledWith(
          handler,
        );
      expect(handler.jobType)
        .toBe(
          "AI_RECURRING_SCHEDULE_MATERIALIZE",
        );
    });

    it("registers created and existing occurrences before the next job", async () => {
      const {
        handler,
        materialize,
        enqueueOccurrence,
        createOrResolveJob,
      } = harness();

      const created =
        occurrence(
          "occurrence-created",
          "2026-08-01T01:00:00.000Z",
        );
      const existing =
        occurrence(
          "occurrence-existing",
          "2026-08-01T02:00:00.000Z",
        );
      const order: string[] = [];

      materialize.mockResolvedValue({
        scheduleId: "schedule-1",
        scheduleStatus: "active",
        anchor:
          "2026-08-01T00:00:00.000Z",
        intervalSeconds: 3600,
        materializedAt:
          "2026-08-01T02:00:00.000Z",
        createdOccurrences: [
          created,
        ],
        existingOccurrences: [
          existing,
        ],
        skippedIntervals: 0,
        nextScheduledFor:
          "2026-08-01T03:00:00.000Z",
        decision:
          "materialized",
      });

      enqueueOccurrence
        .mockImplementation(
          async (value) => {
            order.push(
              `occurrence:${value.id}`,
            );
          },
        );

      createOrResolveJob
        .mockImplementation(
          async () => {
            order.push("next-job");

            return {
              job: {} as SchedulerJob,
              created: true,
            };
          },
        );

      await handler.handle(
        job(),
      );

      expect(materialize)
        .toHaveBeenCalledWith({
          scheduleId:
            "schedule-1",
          materializedAt:
            "2026-08-01T01:00:00.000Z",
          maximumCatchUpOccurrences:
            10,
        });

      expect(order).toEqual([
        "occurrence:occurrence-created",
        "occurrence:occurrence-existing",
        "next-job",
      ]);

      expect(createOrResolveJob)
        .toHaveBeenCalledWith({
          name:
            "Materialize recurring AI schedule schedule-1",
          jobType:
            "AI_RECURRING_SCHEDULE_MATERIALIZE",
          payload: {
            scheduleId:
              "schedule-1",
            requestedAt:
              "2026-08-01T03:00:00.000Z",
            maximumCatchUpOccurrences:
              10,
          },
          scheduleType:
            "ONE_TIME",
          runAt:
            "2026-08-01T03:00:00.000Z",
          maxAttempts:
            3,
          idempotencyKey:
            "ai-recurring-materialize:schedule-1:2026-08-01T03:00:00.000Z",
        });
    });

    it("schedules only the next job when not due", async () => {
      const {
        handler,
        materialize,
        enqueueOccurrence,
        createOrResolveJob,
      } = harness();

      materialize.mockResolvedValue({
        scheduleId: "schedule-1",
        scheduleStatus: "active",
        anchor:
          "2026-08-01T00:00:00.000Z",
        intervalSeconds: 3600,
        materializedAt:
          "2026-08-01T00:30:00.000Z",
        createdOccurrences: [],
        existingOccurrences: [],
        skippedIntervals: 0,
        nextScheduledFor:
          "2026-08-01T01:00:00.000Z",
        decision:
          "not_due",
      });

      createOrResolveJob
        .mockResolvedValue({
          job: {} as SchedulerJob,
          created: false,
        });

      await handler.handle(
        job(),
      );

      expect(enqueueOccurrence)
        .not.toHaveBeenCalled();
      expect(createOrResolveJob)
        .toHaveBeenCalledTimes(1);
    });

    it.each([
      "paused",
      "cancelled",
      "terminal",
    ] as const)(
      "stops future work for %s",
      async (decision) => {
        const {
          handler,
          materialize,
          enqueueOccurrence,
          createOrResolveJob,
        } = harness();

        materialize.mockResolvedValue({
          scheduleId: "schedule-1",
          scheduleStatus:
            decision === "paused"
              ? "paused"
              : decision ===
                  "cancelled"
                ? "cancelled"
                : "completed",
          anchor:
            "2026-08-01T00:00:00.000Z",
          intervalSeconds: 3600,
          materializedAt:
            "2026-08-01T01:00:00.000Z",
          createdOccurrences: [],
          existingOccurrences: [],
          skippedIntervals: 0,
          decision,
        });

        await handler.handle(
          job(),
        );

        expect(enqueueOccurrence)
          .not.toHaveBeenCalled();
        expect(createOrResolveJob)
          .not.toHaveBeenCalled();
      },
    );

    it("does not schedule the next job when occurrence registration fails", async () => {
      const {
        handler,
        materialize,
        enqueueOccurrence,
        createOrResolveJob,
      } = harness();

      materialize.mockResolvedValue({
        scheduleId: "schedule-1",
        scheduleStatus: "active",
        anchor:
          "2026-08-01T00:00:00.000Z",
        intervalSeconds: 3600,
        materializedAt:
          "2026-08-01T01:00:00.000Z",
        createdOccurrences: [
          occurrence(
            "occurrence-1",
            "2026-08-01T01:00:00.000Z",
          ),
        ],
        existingOccurrences: [],
        skippedIntervals: 0,
        nextScheduledFor:
          "2026-08-01T02:00:00.000Z",
        decision:
          "materialized",
      });

      enqueueOccurrence
        .mockRejectedValue(
          new Error(
            "bridge unavailable",
          ),
        );

      await expect(
        handler.handle(
          job(),
        ),
      ).rejects.toThrow(
        "bridge unavailable",
      );

      expect(createOrResolveJob)
        .not.toHaveBeenCalled();
    });

    it.each([
      [
        {},
        "scheduleId",
      ],
      [
        {
          scheduleId:
            "schedule-1",
          requestedAt:
            "invalid",
          maximumCatchUpOccurrences:
            10,
        },
        "requestedAt",
      ],
      [
        {
          scheduleId:
            "schedule-1",
          requestedAt:
            "2026-08-01T01:00:00.000Z",
          maximumCatchUpOccurrences:
            0,
        },
        "maximumCatchUpOccurrences",
      ],
      [
        {
          scheduleId:
            "schedule-1",
          requestedAt:
            "2026-08-01T01:00:00.000Z",
          maximumCatchUpOccurrences:
            101,
        },
        "maximumCatchUpOccurrences",
      ],
    ])(
      "rejects invalid payload %#",
      async (
        payload,
        expectedMessage,
      ) => {
        const {
          handler,
          materialize,
        } = harness();

        await expect(
          handler.handle(
            job(
              payload as
                Record<
                  string,
                  unknown
                >,
            ),
          ),
        ).rejects.toThrow(
          expectedMessage,
        );

        expect(materialize)
          .not.toHaveBeenCalled();
      },
    );
  },
);
