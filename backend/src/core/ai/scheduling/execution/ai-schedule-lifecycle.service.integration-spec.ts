import {
  describe,
  expect,
  it,
} from "@jest/globals";

import {
  AiScheduleAlreadyExistsError,
  AiScheduleInvalidStateTransitionError,
  AiScheduleOccurrenceAlreadyClaimedError,
} from "../errors/ai-schedule.error";

import {
  AiScheduleListFilter,
  AiScheduleRepository,
  AiScheduleHistoryFilter,
} from "../repositories/ai-schedule.repository";

import {
  AiOccurrenceClaim,
  AiScheduleAttempt,
  AiScheduleManifest,
  AiScheduledOccurrence,
  AiScheduleStatus,
} from "../types/ai-schedule.types";

import {
  AiScheduleManifestValidator,
} from "../validation/ai-schedule-manifest.validator";

import {
  AiScheduleLifecycleService,
} from "./ai-schedule-lifecycle.service";

class MemoryRepository
  implements AiScheduleRepository
{
  schedules =
    new Map<string, AiScheduleManifest>();

  occurrences =
    new Map<string, AiScheduledOccurrence>();

  attempts =
    new Map<string, AiScheduleAttempt>();

  async createSchedule(
    schedule: AiScheduleManifest,
  ): Promise<AiScheduleManifest> {
    this.schedules.set(
      schedule.id,
      structuredClone(schedule),
    );

    return structuredClone(schedule);
  }

  async getSchedule(
    id: string,
  ): Promise<AiScheduleManifest | null> {
    const value = this.schedules.get(id);

    return value
      ? structuredClone(value)
      : null;
  }

  async listSchedules(
    filter: AiScheduleListFilter = {},
  ): Promise<AiScheduleManifest[]> {
    return [...this.schedules.values()]
      .filter(
        (schedule) =>
          !filter.status ||
          schedule.status === filter.status,
      )
      .sort(
        (left, right) =>
          left.id.localeCompare(right.id),
      )
      .map(
        (schedule) =>
          structuredClone(schedule),
      );
  }

  async updateScheduleStatus(
    id: string,
    status: AiScheduleStatus,
  ): Promise<AiScheduleManifest | null> {
    const schedule =
      this.schedules.get(id);

    if (!schedule) {
      return null;
    }

    const updated = {
      ...schedule,
      status,
    };

    this.schedules.set(id, updated);

    return structuredClone(updated);
  }

  async createOccurrence(
    occurrence: AiScheduledOccurrence,
  ): Promise<AiScheduledOccurrence> {
    this.occurrences.set(
      occurrence.id,
      structuredClone(occurrence),
    );

    return structuredClone(occurrence);
  }


  async createOrResolveOccurrence(
    occurrence: AiScheduledOccurrence,
  ): Promise<{
    occurrence: AiScheduledOccurrence;
    created: boolean;
  }> {
    const existing = [...this.occurrences.values()]
      .find(
        (item) =>
          item.scheduleId === occurrence.scheduleId &&
          item.scheduledFor === occurrence.scheduledFor,
      );

    if (existing) {
      return {
        occurrence: structuredClone(existing),
        created: false,
      };
    }

    const created =
      await this.createOccurrence(occurrence);

    return {
      occurrence: created,
      created: true,
    };
  }

  async getOccurrence(
    id: string,
  ): Promise<AiScheduledOccurrence | null> {
    const value =
      this.occurrences.get(id);

    return value
      ? structuredClone(value)
      : null;
  }

  async findDueOccurrences(
    now: string,
    limit: number,
  ): Promise<AiScheduledOccurrence[]> {
    return [...this.occurrences.values()]
      .filter(
        (occurrence) =>
          occurrence.status === "pending" &&
          occurrence.scheduledFor <= now,
      )
      .slice(0, limit)
      .map(
        (occurrence) =>
          structuredClone(occurrence),
      );
  }

  async claimOccurrence(
    id: string,
    claim: AiOccurrenceClaim,
  ): Promise<AiScheduledOccurrence | null> {
    const occurrence =
      this.occurrences.get(id);

    if (
      !occurrence ||
      ![
        "pending",
        "retry_scheduled",
      ].includes(occurrence.status)
    ) {
      return null;
    }

    const updated:
      AiScheduledOccurrence = {
        ...occurrence,
        status: "claimed",
        workerId: claim.workerId,
        claimedAt: claim.claimedAt,
        claimExpiresAt:
          claim.claimExpiresAt,
        updatedAt: claim.claimedAt,
      };

    this.occurrences.set(id, updated);

    return structuredClone(updated);
  }

  async updateOccurrence(
    occurrence: AiScheduledOccurrence,
  ): Promise<AiScheduledOccurrence> {
    this.occurrences.set(
      occurrence.id,
      structuredClone(occurrence),
    );

    return structuredClone(occurrence);
  }

  async createAttempt(
    attempt: AiScheduleAttempt,
  ): Promise<AiScheduleAttempt> {
    this.attempts.set(
      attempt.id,
      structuredClone(attempt),
    );

    return structuredClone(attempt);
  }

  async updateAttempt(
    attempt: AiScheduleAttempt,
  ): Promise<AiScheduleAttempt> {
    this.attempts.set(
      attempt.id,
      structuredClone(attempt),
    );

    return structuredClone(attempt);
  }

  async listExecutionHistory(
    _filter?: AiScheduleHistoryFilter,
  ): Promise<AiScheduledOccurrence[]> {
    return [...this.occurrences.values()]
      .map(
        (occurrence) =>
          structuredClone(occurrence),
      );
  }
}

const createManifest = (
  overrides: Partial<AiScheduleManifest> = {},
): AiScheduleManifest => ({
  id: "property.daily.summary",
  name: "Property daily summary",
  commandName:
    "property.operations.summary",
  commandPayload: {
    propertyId: "property-1",
  },
  scheduleType: "once",
  runAt:
    "2026-08-01T08:00:00.000Z",
  timezone:
    "Asia/Kolkata",
  status: "active",
  retryPolicy: {
    maximumAttempts: 3,
    initialDelaySeconds: 60,
    maximumDelaySeconds: 900,
    backoffStrategy: "exponential",
  },
  governanceContext: {
    propertyId: "property-1",
  },
  createdBy: "user-1",
  createdAt:
    "2026-07-30T12:00:00.000Z",
  ...overrides,
});

describe(
  "AiScheduleLifecycleService",
  () => {
    const createService = () => {
      const repository =
        new MemoryRepository();

      const service =
        new AiScheduleLifecycleService(
          repository,
          new AiScheduleManifestValidator(),
        );

      return {
        repository,
        service,
      };
    };

    it("registers and retrieves a schedule", async () => {
      const { service } =
        createService();

      await service.registerSchedule(
        createManifest(),
      );

      await expect(
        service.getSchedule(
          "property.daily.summary",
        ),
      ).resolves.toEqual(
        createManifest(),
      );
    });

    it("rejects duplicate schedule identity", async () => {
      const { service } =
        createService();

      await service.registerSchedule(
        createManifest(),
      );

      await expect(
        service.registerSchedule(
          createManifest(),
        ),
      ).rejects.toThrow(
        AiScheduleAlreadyExistsError,
      );
    });

    it("lists schedules deterministically", async () => {
      const { service } =
        createService();

      await service.registerSchedule(
        createManifest({
          id: "z.schedule",
        }),
      );

      await service.registerSchedule(
        createManifest({
          id: "a.schedule",
        }),
      );

      await expect(
        service.listSchedules(),
      ).resolves.toEqual([
        expect.objectContaining({
          id: "a.schedule",
        }),
        expect.objectContaining({
          id: "z.schedule",
        }),
      ]);
    });

    it("pauses and resumes an active schedule", async () => {
      const { service } =
        createService();

      await service.registerSchedule(
        createManifest(),
      );

      await expect(
        service.pauseSchedule(
          "property.daily.summary",
          "2026-07-30T13:00:00.000Z",
        ),
      ).resolves.toEqual(
        expect.objectContaining({
          status: "paused",
        }),
      );

      await expect(
        service.resumeSchedule(
          "property.daily.summary",
          "2026-07-30T14:00:00.000Z",
        ),
      ).resolves.toEqual(
        expect.objectContaining({
          status: "active",
        }),
      );
    });

    it("cancels active schedules", async () => {
      const { service } =
        createService();

      await service.registerSchedule(
        createManifest(),
      );

      await expect(
        service.cancelSchedule(
          "property.daily.summary",
          "2026-07-30T13:00:00.000Z",
        ),
      ).resolves.toEqual(
        expect.objectContaining({
          status: "cancelled",
        }),
      );
    });

    it("rejects invalid state transitions", async () => {
      const { service } =
        createService();

      await service.registerSchedule(
        createManifest({
          status: "completed",
        }),
      );

      await expect(
        service.pauseSchedule(
          "property.daily.summary",
          "2026-07-30T13:00:00.000Z",
        ),
      ).rejects.toThrow(
        AiScheduleInvalidStateTransitionError,
      );
    });

    it("creates due occurrences for active schedules", async () => {
      const { service } =
        createService();

      await service.registerSchedule(
        createManifest(),
      );

      const occurrence =
        await service.createOccurrence(
          "property.daily.summary",
          1,
          "2026-08-01T08:00:00.000Z",
          "2026-07-30T13:00:00.000Z",
        );

      expect(occurrence).toEqual(
        expect.objectContaining({
          scheduleId:
            "property.daily.summary",
          sequence: 1,
          status: "pending",
          attemptCount: 0,
        }),
      );
    });

    it("finds due occurrences", async () => {
      const { service } =
        createService();

      await service.registerSchedule(
        createManifest(),
      );

      await service.createOccurrence(
        "property.daily.summary",
        1,
        "2026-08-01T08:00:00.000Z",
        "2026-07-30T13:00:00.000Z",
      );

      await expect(
        service.findDueOccurrences(
          "2026-08-01T08:00:00.000Z",
        ),
      ).resolves.toHaveLength(1);
    });

    it("claims an occurrence", async () => {
      const { service } =
        createService();

      await service.registerSchedule(
        createManifest(),
      );

      const occurrence =
        await service.createOccurrence(
          "property.daily.summary",
          1,
          "2026-08-01T08:00:00.000Z",
          "2026-07-30T13:00:00.000Z",
        );

      await expect(
        service.claimOccurrence(
          occurrence.id,
          "worker-1",
          "2026-08-01T08:00:00.000Z",
          "2026-08-01T08:05:00.000Z",
        ),
      ).resolves.toEqual(
        expect.objectContaining({
          status: "claimed",
          workerId: "worker-1",
        }),
      );
    });

    it("rejects duplicate occurrence claims", async () => {
      const { service } =
        createService();

      await service.registerSchedule(
        createManifest(),
      );

      const occurrence =
        await service.createOccurrence(
          "property.daily.summary",
          1,
          "2026-08-01T08:00:00.000Z",
          "2026-07-30T13:00:00.000Z",
        );

      await service.claimOccurrence(
        occurrence.id,
        "worker-1",
        "2026-08-01T08:00:00.000Z",
        "2026-08-01T08:05:00.000Z",
      );

      await expect(
        service.claimOccurrence(
          occurrence.id,
          "worker-2",
          "2026-08-01T08:01:00.000Z",
          "2026-08-01T08:06:00.000Z",
        ),
      ).rejects.toThrow(
        AiScheduleOccurrenceAlreadyClaimedError,
      );
    });
  },
);
