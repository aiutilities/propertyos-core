import {
  describe,
  expect,
  it,
} from "@jest/globals";

import {
  AiScheduleRepository,
} from "../repositories/ai-schedule.repository";
import {
  AiScheduleManifest,
  AiScheduledOccurrence,
} from "../types/ai-schedule.types";
import {
  AiRecurringOccurrenceCalculatorService,
} from "./ai-recurring-occurrence-calculator.service";
import {
  AiRecurringOccurrenceMaterializerService,
} from "./ai-recurring-occurrence-materializer.service";

const schedule = (
  overrides: Partial<AiScheduleManifest> = {},
): AiScheduleManifest => ({
  id: "daily-summary",
  name: "Daily summary",
  commandName: "summary.create",
  commandPayload: {},
  scheduleType: "interval",
  intervalSeconds: 3600,
  timezone: "Asia/Kolkata",
  status: "active",
  retryPolicy: {
    maximumAttempts: 3,
    initialDelaySeconds: 60,
    maximumDelaySeconds: 300,
    backoffStrategy: "fixed",
  },
  governanceContext: {},
  createdBy: "founder",
  createdAt: "2026-08-01T00:00:00.000Z",
  ...overrides,
});

const occurrence = (
  sequence: number,
  scheduledFor: string,
  overrides: Partial<AiScheduledOccurrence> = {},
): AiScheduledOccurrence => ({
  id: `occurrence-${sequence}`,
  scheduleId: "daily-summary",
  sequence,
  scheduledFor,
  status: "pending",
  attemptCount: 0,
  createdAt: "2026-08-01T01:00:00.000Z",
  updatedAt: "2026-08-01T01:00:00.000Z",
  ...overrides,
});

interface HarnessOptions {
  schedule?: AiScheduleManifest | null;
  history?: AiScheduledOccurrence[];
  existingTimes?: Set<string>;
  failAtSequence?: number;
}

const harness = (
  options: HarnessOptions = {},
) => {
  const durable = new Map<
    string,
    AiScheduledOccurrence
  >();

  for (
    const item of
    options.history ?? []
  ) {
    durable.set(
      item.scheduledFor,
      structuredClone(item),
    );
  }

  const calls: AiScheduledOccurrence[] =
    [];

  const repository = {
    getSchedule: async () =>
      options.schedule === undefined
        ? schedule()
        : options.schedule,

    listExecutionHistory: async () =>
      [...durable.values()].sort(
        (left, right) =>
          right.scheduledFor.localeCompare(
            left.scheduledFor,
          ),
      ),

    createOrResolveOccurrence:
      async (
        candidate: AiScheduledOccurrence,
      ) => {
        if (
          options.failAtSequence ===
          candidate.sequence
        ) {
          throw new Error(
            "repository unavailable",
          );
        }

        calls.push(
          structuredClone(candidate),
        );

        const existing =
          durable.get(
            candidate.scheduledFor,
          );

        if (
          existing ||
          options.existingTimes?.has(
            candidate.scheduledFor,
          )
        ) {
          const resolved =
            existing ??
            occurrence(
              candidate.sequence,
              candidate.scheduledFor,
              {
                status:
                  "retry_scheduled",
                attemptCount: 2,
              },
            );

          durable.set(
            candidate.scheduledFor,
            structuredClone(resolved),
          );

          return {
            occurrence:
              structuredClone(resolved),
            created: false,
          };
        }

        durable.set(
          candidate.scheduledFor,
          structuredClone(candidate),
        );

        return {
          occurrence:
            structuredClone(candidate),
          created: true,
        };
      },
  } as unknown as AiScheduleRepository;

  return {
    calls,
    durable,
    service:
      new AiRecurringOccurrenceMaterializerService(
        repository,
        new AiRecurringOccurrenceCalculatorService(),
      ),
  };
};

describe(
  "AiRecurringOccurrenceMaterializerService",
  () => {
    it("returns not due before the first interval", async () => {
      const { service, calls } =
        harness();

      const result =
        await service.materialize({
          scheduleId: "daily-summary",
          materializedAt:
            "2026-08-01T00:59:59.000Z",
          maximumCatchUpOccurrences: 10,
        });

      expect(result.decision).toBe(
        "not_due",
      );
      expect(result.nextScheduledFor).toBe(
        "2026-08-01T01:00:00.000Z",
      );
      expect(calls).toEqual([]);
    });

    it("creates the first deterministic occurrence", async () => {
      const { service, calls } =
        harness();

      const result =
        await service.materialize({
          scheduleId: "daily-summary",
          materializedAt:
            "2026-08-01T01:00:00.000Z",
          maximumCatchUpOccurrences: 10,
        });

      expect(result.decision).toBe(
        "materialized",
      );
      expect(
        result.createdOccurrences,
      ).toHaveLength(1);
      expect(
        result.existingOccurrences,
      ).toEqual([]);
      expect(calls[0]).toMatchObject({
        scheduleId: "daily-summary",
        sequence: 1,
        scheduledFor:
          "2026-08-01T01:00:00.000Z",
        status: "pending",
        attemptCount: 0,
        createdAt:
          "2026-08-01T01:00:00.000Z",
        updatedAt:
          "2026-08-01T01:00:00.000Z",
      });
    });

    it("creates a bounded catch-up window in order", async () => {
      const { service } = harness();

      const result =
        await service.materialize({
          scheduleId: "daily-summary",
          materializedAt:
            "2026-08-01T10:30:00.000Z",
          maximumCatchUpOccurrences: 3,
        });

      expect(
        result.createdOccurrences.map(
          (item) => item.sequence,
        ),
      ).toEqual([8, 9, 10]);
      expect(result.skippedIntervals).toBe(
        7,
      );
    });

    it("uses the latest represented occurrence", async () => {
      const { service } = harness({
        history: [
          occurrence(
            3,
            "2026-08-01T03:00:00.000Z",
          ),
        ],
      });

      const result =
        await service.materialize({
          scheduleId: "daily-summary",
          materializedAt:
            "2026-08-01T05:10:00.000Z",
          maximumCatchUpOccurrences: 10,
        });

      expect(
        result.createdOccurrences.map(
          (item) => item.sequence,
        ),
      ).toEqual([4, 5]);
    });

    it("separates created and existing durable rows", async () => {
      const { service } = harness({
        existingTimes: new Set([
          "2026-08-01T01:00:00.000Z",
        ]),
      });

      const result =
        await service.materialize({
          scheduleId: "daily-summary",
          materializedAt:
            "2026-08-01T02:00:00.000Z",
          maximumCatchUpOccurrences: 10,
        });

      expect(
        result.existingOccurrences.map(
          (item) => item.sequence,
        ),
      ).toEqual([1]);
      expect(
        result.createdOccurrences.map(
          (item) => item.sequence,
        ),
      ).toEqual([2]);
    });

    it.each([
      ["paused", "paused"],
      ["cancelled", "cancelled"],
      ["completed", "terminal"],
    ] as const)(
      "creates nothing for %s schedules",
      async (status, decision) => {
        const { service, calls } =
          harness({
            schedule: schedule({
              status,
            }),
          });

        const result =
          await service.materialize({
            scheduleId:
              "daily-summary",
            materializedAt:
              "2026-08-01T05:00:00.000Z",
            maximumCatchUpOccurrences:
              10,
          });

        expect(result.decision).toBe(
          decision,
        );
        expect(calls).toEqual([]);
      },
    );

    it("treats one-time schedules as terminal", async () => {
      const { service, calls } =
        harness({
          schedule: schedule({
            scheduleType: "once",
            intervalSeconds: undefined,
            runAt:
              "2026-08-01T01:00:00.000Z",
          }),
        });

      const result =
        await service.materialize({
          scheduleId: "daily-summary",
          materializedAt:
            "2026-08-01T01:00:00.000Z",
          maximumCatchUpOccurrences: 10,
        });

      expect(result.decision).toBe(
        "terminal",
      );
      expect(calls).toEqual([]);
    });

    it("fails closed when the schedule is missing", async () => {
      const { service } = harness({
        schedule: null,
      });

      await expect(
        service.materialize({
          scheduleId: "missing",
          materializedAt:
            "2026-08-01T01:00:00.000Z",
          maximumCatchUpOccurrences: 10,
        }),
      ).rejects.toThrow(
        'AI schedule not found: "missing"',
      );
    });

    it("fails fast on repository errors", async () => {
      const { service, durable } =
        harness({
          failAtSequence: 2,
        });

      await expect(
        service.materialize({
          scheduleId: "daily-summary",
          materializedAt:
            "2026-08-01T03:00:00.000Z",
          maximumCatchUpOccurrences: 10,
        }),
      ).rejects.toThrow(
        "repository unavailable",
      );

      expect(
        [...durable.values()].map(
          (item) => item.sequence,
        ),
      ).toEqual([1]);
    });

    it("is idempotent across repeated invocation", async () => {
      const { service, durable } =
        harness();

      const request = {
        scheduleId: "daily-summary",
        materializedAt:
          "2026-08-01T02:00:00.000Z",
        maximumCatchUpOccurrences: 10,
      };

      const first =
        await service.materialize(
          request,
        );
      const second =
        await service.materialize(
          request,
        );

      expect(
        first.createdOccurrences,
      ).toHaveLength(2);
      expect(
        second.createdOccurrences,
      ).toHaveLength(0);
      expect(durable.size).toBe(2);
    });
  },
);
