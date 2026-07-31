import {
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

import {
  AiDecisionAuditService,
} from "../../audit/ai-decision-audit.service";

import {
  PropertyAiCommandService,
} from "../../commands/property-ai-command.service";

import {
  AiDecisionGovernanceService,
} from "../../governance/ai-decision-governance.service";

import {
  AiFailurePolicyService,
} from "../../resilience/ai-failure-policy.service";

import {
  AiRecoveryBudgetService,
} from "../../resilience/ai-recovery-budget.service";

import {
  AiOccurrenceClaim,
  AiScheduleAttempt,
  AiScheduleManifest,
  AiScheduledOccurrence,
  AiScheduleStatus,
} from "../types/ai-schedule.types";

import {
  AiScheduleHistoryFilter,
  AiScheduleListFilter,
  AiScheduleRepository,
} from "../repositories/ai-schedule.repository";

import {
  AiScheduledOccurrenceExecutionService,
} from "./ai-scheduled-occurrence-execution.service";

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
    const value =
      this.schedules.get(id);

    return value
      ? structuredClone(value)
      : null;
  }

  async listSchedules(
    _filter?: AiScheduleListFilter,
  ): Promise<AiScheduleManifest[]> {
    return [...this.schedules.values()]
      .map(
        (item) =>
          structuredClone(item),
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

    this.schedules.set(
      id,
      updated,
    );

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
    _now: string,
    _limit: number,
  ): Promise<AiScheduledOccurrence[]> {
    return [];
  }

  async claimOccurrence(
    id: string,
    claim: AiOccurrenceClaim,
  ): Promise<AiScheduledOccurrence | null> {
    const occurrence =
      this.occurrences.get(id);

    if (!occurrence) {
      return null;
    }

    const updated:
      AiScheduledOccurrence = {
        ...occurrence,
        status: "claimed",
        workerId:
          claim.workerId,
        claimedAt:
          claim.claimedAt,
        claimExpiresAt:
          claim.claimExpiresAt,
        updatedAt:
          claim.claimedAt,
      };

    this.occurrences.set(
      id,
      updated,
    );

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
        (item) =>
          structuredClone(item),
      );
  }
}

const createSchedule = (
  overrides: Partial<AiScheduleManifest> = {},
): AiScheduleManifest => ({
  id: "property.daily.summary",
  name: "Property daily summary",
  commandName:
    "ANALYZE_PROPERTY_HEALTH",
  commandPayload: {},
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
    organizationId:
      "organization-1",
  },
  createdBy: "user-1",
  createdAt:
    "2026-07-30T12:00:00.000Z",
  ...overrides,
});

const createOccurrence = (
  overrides: Partial<AiScheduledOccurrence> = {},
): AiScheduledOccurrence => ({
  id: "occurrence-1",
  scheduleId:
    "property.daily.summary",
  sequence: 1,
  scheduledFor:
    "2026-08-01T08:00:00.000Z",
  status: "claimed",
  attemptCount: 0,
  workerId: "worker-1",
  claimedAt:
    "2026-08-01T08:00:00.000Z",
  claimExpiresAt:
    "2026-08-01T08:05:00.000Z",
  createdAt:
    "2026-07-30T12:00:00.000Z",
  updatedAt:
    "2026-08-01T08:00:00.000Z",
  ...overrides,
});

const createHarness = (
  execute:
    PropertyAiCommandService["execute"],
) => {
  const repository =
    new MemoryRepository();

  repository.schedules.set(
    "property.daily.summary",
    createSchedule(),
  );

  repository.occurrences.set(
    "occurrence-1",
    createOccurrence(),
  );

  const commandService = {
    execute: jest.fn(execute),
  } as unknown as PropertyAiCommandService;

  const auditService =
    new AiDecisionAuditService();

  const service =
    new AiScheduledOccurrenceExecutionService(
      repository,
      commandService,
      new AiDecisionGovernanceService(),
      auditService,
      new AiFailurePolicyService(),
      new AiRecoveryBudgetService(),
    );

  return {
    repository,
    commandService,
    auditService,
    service,
  };
};

describe(
  "AiScheduledOccurrenceExecutionService",
  () => {
    it("dispatches through the registered command service", async () => {
      const {
        commandService,
        repository,
        service,
      } = createHarness(
        async (request) => ({
          propertyId:
            request.propertyId,
          command:
            request.command,
          decision:
            "HEALTHY",
          confidence: 0.95,
          proposals: [],
        }),
      );

      const result =
        await service.executeOccurrence({
          occurrenceId:
            "occurrence-1",
          workerId: "worker-1",
          executedAt:
            "2026-08-01T08:01:00.000Z",
        });

      expect(
        commandService.execute,
      ).toHaveBeenCalledWith({
        propertyId:
          "property-1",
        command:
          "ANALYZE_PROPERTY_HEALTH",
        reason:
          "Scheduled AI execution property.daily.summary/occurrence-1",
      });

      expect(result.occurrence.status)
        .toBe("succeeded");

      expect(result.dispatched)
        .toBe(true);

      expect(
        repository.schedules.get(
          "property.daily.summary",
        )?.status,
      ).toBe("completed");
    });

    it("records success audit evidence", async () => {
      const {
        auditService,
        service,
      } = createHarness(
        async (request) => ({
          propertyId:
            request.propertyId,
          command:
            request.command,
          decision:
            "HEALTHY",
          confidence: 0.9,
          proposals: [],
        }),
      );

      await service.executeOccurrence({
        occurrenceId:
          "occurrence-1",
        workerId: "worker-1",
        executedAt:
          "2026-08-01T08:01:00.000Z",
      });

      expect(
        auditService.count(),
      ).toBe(1);

      expect(
        auditService.listByProperty(
          "property-1",
        )[0],
      ).toEqual(
        expect.objectContaining({
          action:
            "SCHEDULED_AI_EXECUTION",
          executionStatus:
            "succeeded",
        }),
      );
    });

    it("requires exact human approval before dispatch", async () => {
      const harness =
        createHarness(
          async (request) => ({
            propertyId:
              request.propertyId,
            command:
              request.command,
            decision:
              "HEALTHY",
            confidence: 0.9,
            proposals: [],
          }),
        );

      harness.repository.schedules.set(
        "property.daily.summary",
        createSchedule({
          governanceContext: {
            propertyId:
              "property-1",
            requiresHumanApproval:
              true,
            approvalReference:
              "approval-1",
          },
        }),
      );

      const result =
        await harness.service
          .executeOccurrence({
            occurrenceId:
              "occurrence-1",
            workerId:
              "worker-1",
            executedAt:
              "2026-08-01T08:01:00.000Z",
          });

      expect(result.approvalRequired)
        .toBe(true);

      expect(result.dispatched)
        .toBe(false);

      expect(
        result.occurrence.status,
      ).toBe("approval_required");

      expect(
        harness.commandService.execute,
      ).not.toHaveBeenCalled();
    });

    it("executes after exact approval", async () => {
      const harness =
        createHarness(
          async (request) => ({
            propertyId:
              request.propertyId,
            command:
              request.command,
            decision:
              "HEALTHY",
            confidence: 0.9,
            proposals: [],
          }),
        );

      harness.repository.schedules.set(
        "property.daily.summary",
        createSchedule({
          governanceContext: {
            propertyId:
              "property-1",
            requiresHumanApproval:
              true,
            approvalReference:
              "approval-1",
          },
        }),
      );

      harness.repository.occurrences.set(
        "occurrence-1",
        createOccurrence({
          status:
            "approval_required",
          workerId: undefined,
          claimedAt: undefined,
          claimExpiresAt:
            undefined,
        }),
      );

      const result =
        await harness.service
          .executeOccurrence({
            occurrenceId:
              "occurrence-1",
            workerId:
              "worker-1",
            approvalReference:
              "approval-1",
            executedAt:
              "2026-08-01T08:01:00.000Z",
          });

      expect(result.occurrence.status)
        .toBe("succeeded");

      expect(
        harness.commandService.execute,
      ).toHaveBeenCalledTimes(1);
    });

    it("rejects unrelated approval evidence", async () => {
      const harness =
        createHarness(
          async (request) => ({
            propertyId:
              request.propertyId,
            command:
              request.command,
            decision:
              "HEALTHY",
            confidence: 0.9,
            proposals: [],
          }),
        );

      harness.repository.schedules.set(
        "property.daily.summary",
        createSchedule({
          governanceContext: {
            propertyId:
              "property-1",
            requiresHumanApproval:
              true,
            approvalReference:
              "approval-1",
          },
        }),
      );

      const result =
        await harness.service
          .executeOccurrence({
            occurrenceId:
              "occurrence-1",
            workerId:
              "worker-1",
            approvalReference:
              "unrelated",
            executedAt:
              "2026-08-01T08:01:00.000Z",
          });

      expect(result.approvalRequired)
        .toBe(true);

      expect(
        harness.commandService.execute,
      ).not.toHaveBeenCalled();
    });

    it("schedules retryable failures with exponential backoff", async () => {
      const error =
        Object.assign(
          new Error("timeout"),
          {
            code:
              "PROVIDER_TIMEOUT",
            retriable: true,
          },
        );

      const {
        service,
      } = createHarness(
        async () => {
          throw error;
        },
      );

      const result =
        await service.executeOccurrence({
          occurrenceId:
            "occurrence-1",
          workerId: "worker-1",
          executedAt:
            "2026-08-01T08:01:00.000Z",
        });

      expect(result.retryScheduled)
        .toBe(true);

      expect(result.occurrence)
        .toEqual(
          expect.objectContaining({
            status:
              "retry_scheduled",
            nextAttemptAt:
              "2026-08-01T08:02:00.000Z",
          }),
        );
    });

    it("does not retry non-retryable failures", async () => {
      const error =
        Object.assign(
          new Error("unauthorized"),
          {
            code: "UNAUTHORIZED",
            retriable: false,
          },
        );

      const {
        service,
      } = createHarness(
        async () => {
          throw error;
        },
      );

      const result =
        await service.executeOccurrence({
          occurrenceId:
            "occurrence-1",
          workerId: "worker-1",
          executedAt:
            "2026-08-01T08:01:00.000Z",
        });

      expect(result.retryScheduled)
        .toBe(false);

      expect(result.occurrence.status)
        .toBe("failed");
    });

    it("enforces the retry budget", async () => {
      const error =
        Object.assign(
          new Error("timeout"),
          {
            code:
              "PROVIDER_TIMEOUT",
            retriable: true,
          },
        );

      const harness =
        createHarness(
          async () => {
            throw error;
          },
        );

      harness.repository.occurrences.set(
        "occurrence-1",
        createOccurrence({
          attemptCount: 2,
        }),
      );

      const result =
        await harness.service
          .executeOccurrence({
            occurrenceId:
              "occurrence-1",
            workerId:
              "worker-1",
            executedAt:
              "2026-08-01T08:01:00.000Z",
          });

      expect(result.retryScheduled)
        .toBe(false);

      expect(result.occurrence.status)
        .toBe("failed");
    });

    it("calculates fixed backoff deterministically", () => {
      const {
        service,
      } = createHarness(
        async (request) => ({
          propertyId:
            request.propertyId,
          command:
            request.command,
          decision:
            "HEALTHY",
          confidence: 1,
          proposals: [],
        }),
      );

      expect(
        service.calculateBackoffSeconds(
          createSchedule({
            retryPolicy: {
              maximumAttempts: 3,
              initialDelaySeconds: 30,
              maximumDelaySeconds: 300,
              backoffStrategy: "fixed",
            },
          }),
          3,
        ),
      ).toBe(30);
    });

    it("caps exponential backoff deterministically", () => {
      const {
        service,
      } = createHarness(
        async (request) => ({
          propertyId:
            request.propertyId,
          command:
            request.command,
          decision:
            "HEALTHY",
          confidence: 1,
          proposals: [],
        }),
      );

      expect(
        service.calculateBackoffSeconds(
          createSchedule({
            retryPolicy: {
              maximumAttempts: 10,
              initialDelaySeconds: 60,
              maximumDelaySeconds: 300,
              backoffStrategy:
                "exponential",
            },
          }),
          5,
        ),
      ).toBe(300);
    });

    it("prevents execution of terminal occurrences", async () => {
      const harness =
        createHarness(
          async (request) => ({
            propertyId:
              request.propertyId,
            command:
              request.command,
            decision:
              "HEALTHY",
            confidence: 1,
            proposals: [],
          }),
        );

      harness.repository.occurrences.set(
        "occurrence-1",
        createOccurrence({
          status: "succeeded",
        }),
      );

      await expect(
        harness.service
          .executeOccurrence({
            occurrenceId:
              "occurrence-1",
            workerId:
              "worker-1",
            executedAt:
              "2026-08-01T08:01:00.000Z",
          }),
      ).rejects.toThrow(
        "Invalid AI schedule state transition",
      );
    });
  },
);
