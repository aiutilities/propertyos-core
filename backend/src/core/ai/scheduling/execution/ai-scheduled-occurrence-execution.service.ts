import {
  Inject,
  Injectable,
} from "@nestjs/common";

import {
  randomUUID,
} from "crypto";

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
  PropertyAiCommandType,
} from "../../types/property-ai-command.types";

import {
  AiScheduleError,
  AiScheduleInvalidStateTransitionError,
  AiScheduleNotFoundError,
} from "../errors/ai-schedule.error";

import {
  AI_SCHEDULE_REPOSITORY,
  AiScheduleRepository,
} from "../repositories/ai-schedule.repository";

import {
  AiScheduleAttempt,
  AiScheduleManifest,
  AiScheduledOccurrence,
} from "../types/ai-schedule.types";

export interface AiScheduledOccurrenceExecutionRequest {
  occurrenceId: string;
  workerId: string;
  executedAt: string;
  approvalReference?: string;
}

export interface AiScheduledOccurrenceExecutionResult {
  occurrence: AiScheduledOccurrence;
  attempt?: AiScheduleAttempt;
  dispatched: boolean;
  retryScheduled: boolean;
  approvalRequired: boolean;
}

@Injectable()
export class AiScheduledOccurrenceExecutionService {
  private readonly terminalStatuses =
    new Set<AiScheduledOccurrence["status"]>([
      "succeeded",
      "failed",
      "skipped",
      "cancelled",
    ]);

  private readonly registeredCommands =
    new Set<PropertyAiCommandType>([
      "ANALYZE_PROPERTY_HEALTH",
      "REVIEW_OPERATIONAL_RISK",
    ]);

  constructor(
    @Inject(AI_SCHEDULE_REPOSITORY)
    private readonly repository:
      AiScheduleRepository,

    private readonly commandService:
      PropertyAiCommandService,

    private readonly governanceService:
      AiDecisionGovernanceService,

    private readonly auditService:
      AiDecisionAuditService,

    private readonly failurePolicyService:
      AiFailurePolicyService,

    private readonly recoveryBudgetService:
      AiRecoveryBudgetService,
  ) {}

  async executeOccurrence(
    request: AiScheduledOccurrenceExecutionRequest,
  ): Promise<AiScheduledOccurrenceExecutionResult> {
    const occurrence =
      await this.requireOccurrence(
        request.occurrenceId,
      );

    const schedule =
      await this.requireSchedule(
        occurrence.scheduleId,
      );

    this.assertExecutable(
      occurrence,
      request.workerId,
    );

    if (schedule.status === "cancelled") {
      const cancelled =
        await this.repository.updateOccurrence({
          ...occurrence,
          status: "cancelled",
          completedAt: request.executedAt,
          updatedAt: request.executedAt,
        });

      return {
        occurrence: cancelled,
        dispatched: false,
        retryScheduled: false,
        approvalRequired: false,
      };
    }

    if (
      this.requiresApproval(
        schedule,
        request.approvalReference,
      )
    ) {
      const approvalRequired =
        await this.repository.updateOccurrence({
          ...occurrence,
          status: "approval_required",
          workerId: undefined,
          claimedAt: undefined,
          claimExpiresAt: undefined,
          updatedAt: request.executedAt,
        });

      this.recordAudit(
        schedule,
        0,
        "SCHEDULE_APPROVAL_REQUIRED",
        "APPROVAL_REQUIRED",
        "approval_required",
        request.executedAt,
      );

      return {
        occurrence: approvalRequired,
        dispatched: false,
        retryScheduled: false,
        approvalRequired: true,
      };
    }

    const propertyId =
      schedule.governanceContext.propertyId;

    if (!propertyId) {
      throw new AiScheduleError(
        "AI_SCHEDULE_PROPERTY_SCOPE_REQUIRED",
        "Scheduled AI execution requires property scope",
      );
    }

    const command =
      schedule.commandName as PropertyAiCommandType;

    if (!this.registeredCommands.has(command)) {
      throw new AiScheduleError(
        "AI_SCHEDULE_COMMAND_NOT_REGISTERED",
        `Scheduled AI command is not registered: "${schedule.commandName}"`,
      );
    }

    const attemptNumber =
      occurrence.attemptCount + 1;

    const runningOccurrence =
      await this.repository.updateOccurrence({
        ...occurrence,
        status: "running",
        attemptCount: attemptNumber,
        startedAt:
          occurrence.startedAt ??
          request.executedAt,
        updatedAt: request.executedAt,
      });

    let attempt: AiScheduleAttempt = {
      id: randomUUID(),
      occurrenceId: occurrence.id,
      attemptNumber,
      workerId: request.workerId,
      status: "running",
      startedAt: request.executedAt,
    };

    attempt =
      await this.repository.createAttempt(
        attempt,
      );

    try {
      const commandResult =
        await this.commandService.execute({
          propertyId,
          command,
          reason:
            `Scheduled AI execution ${schedule.id}/${occurrence.id}`,
        });

      const governance =
        this.governanceService.evaluate(
          {
            tenantId:
              schedule.governanceContext.organizationId ??
              propertyId,
            minimumConfidence: 0,
            allowedRecommendations: [
              commandResult.decision,
            ],
            approvalMode: "AUTONOMOUS",
            auditRequired: true,
            rollbackRequired: false,
          },
          commandResult.confidence,
          commandResult.decision,
        );

      if (!governance.allowed) {
        throw new AiScheduleError(
          "AI_SCHEDULE_GOVERNANCE_REJECTED",
          governance.reason,
        );
      }

      attempt =
        await this.repository.updateAttempt({
          ...attempt,
          status: "succeeded",
          outcome: {
            decision:
              commandResult.decision,
            confidence:
              commandResult.confidence,
            proposals:
              commandResult.proposals,
          },
          completedAt:
            request.executedAt,
        });

      const succeeded =
        await this.repository.updateOccurrence({
          ...runningOccurrence,
          status: "succeeded",
          outcome: {
            decision:
              commandResult.decision,
            confidence:
              commandResult.confidence,
            proposals:
              commandResult.proposals,
          },
          completedAt:
            request.executedAt,
          errorCode: undefined,
          errorMessage: undefined,
          nextAttemptAt: undefined,
          updatedAt:
            request.executedAt,
        });

      if (schedule.scheduleType === "once") {
        await this.repository.updateScheduleStatus(
          schedule.id,
          "completed",
          request.executedAt,
        );
      }

      this.recordAudit(
        schedule,
        commandResult.confidence,
        commandResult.decision,
        governance.mode,
        "succeeded",
        request.executedAt,
      );

      return {
        occurrence: succeeded,
        attempt,
        dispatched: true,
        retryScheduled: false,
        approvalRequired: false,
      };
    } catch (error) {
      const code =
        this.errorCode(error);

      const classification =
        this.failurePolicyService.classify(
          code,
          this.isRetryableError(error),
        );

      const budget =
        this.recoveryBudgetService.evaluate({
          maxAttempts:
            schedule.retryPolicy.maximumAttempts,
          attemptsUsed:
            attemptNumber,
        });

      const retryScheduled =
        classification.retriable &&
        budget.allowed &&
        schedule.status === "active";

      attempt =
        await this.repository.updateAttempt({
          ...attempt,
          status: "failed",
          retryable:
            classification.retriable,
          errorCode: code,
          errorMessage:
            this.errorMessage(error),
          completedAt:
            request.executedAt,
        });

      const failedOccurrence =
        await this.repository.updateOccurrence({
          ...runningOccurrence,
          status:
            retryScheduled
              ? "retry_scheduled"
              : "failed",
          nextAttemptAt:
            retryScheduled
              ? this.calculateNextAttemptAt(
                  request.executedAt,
                  schedule,
                  attemptNumber,
                )
              : undefined,
          completedAt:
            retryScheduled
              ? undefined
              : request.executedAt,
          errorCode: code,
          errorMessage:
            this.errorMessage(error),
          workerId:
            retryScheduled
              ? undefined
              : runningOccurrence.workerId,
          claimedAt:
            retryScheduled
              ? undefined
              : runningOccurrence.claimedAt,
          claimExpiresAt:
            retryScheduled
              ? undefined
              : runningOccurrence.claimExpiresAt,
          updatedAt:
            request.executedAt,
        });

      this.recordAudit(
        schedule,
        0,
        code,
        retryScheduled
          ? "RETRY_SCHEDULED"
          : "FAILED",
        failedOccurrence.status,
        request.executedAt,
      );

      return {
        occurrence:
          failedOccurrence,
        attempt,
        dispatched: true,
        retryScheduled,
        approvalRequired: false,
      };
    }
  }

  calculateBackoffSeconds(
    schedule: AiScheduleManifest,
    attemptNumber: number,
  ): number {
    const policy =
      schedule.retryPolicy;

    if (
      policy.backoffStrategy === "fixed"
    ) {
      return Math.min(
        policy.initialDelaySeconds,
        policy.maximumDelaySeconds,
      );
    }

    const multiplier =
      Math.pow(
        2,
        Math.max(
          attemptNumber - 1,
          0,
        ),
      );

    return Math.min(
      policy.initialDelaySeconds *
        multiplier,
      policy.maximumDelaySeconds,
    );
  }

  private calculateNextAttemptAt(
    executedAt: string,
    schedule: AiScheduleManifest,
    attemptNumber: number,
  ): string {
    const delaySeconds =
      this.calculateBackoffSeconds(
        schedule,
        attemptNumber,
      );

    return new Date(
      Date.parse(executedAt) +
        delaySeconds * 1000,
    ).toISOString();
  }

  private requiresApproval(
    schedule: AiScheduleManifest,
    suppliedApproval?: string,
  ): boolean {
    if (
      !schedule.governanceContext
        .requiresHumanApproval
    ) {
      return false;
    }

    const expected =
      schedule.governanceContext
        .approvalReference;

    return (
      !expected ||
      suppliedApproval !== expected
    );
  }

  private assertExecutable(
    occurrence: AiScheduledOccurrence,
    workerId: string,
  ): void {
    if (
      this.terminalStatuses.has(
        occurrence.status,
      )
    ) {
      throw new AiScheduleInvalidStateTransitionError(
        occurrence.status,
        "running",
      );
    }

    if (
      occurrence.status ===
      "approval_required"
    ) {
      return;
    }

    if (
      occurrence.status !== "claimed" ||
      occurrence.workerId !== workerId
    ) {
      throw new AiScheduleInvalidStateTransitionError(
        occurrence.status,
        "running",
      );
    }
  }

  private async requireSchedule(
    id: string,
  ): Promise<AiScheduleManifest> {
    const schedule =
      await this.repository.getSchedule(id);

    if (!schedule) {
      throw new AiScheduleNotFoundError(id);
    }

    return schedule;
  }

  private async requireOccurrence(
    id: string,
  ): Promise<AiScheduledOccurrence> {
    const occurrence =
      await this.repository.getOccurrence(id);

    if (!occurrence) {
      throw new AiScheduleError(
        "AI_SCHEDULE_OCCURRENCE_NOT_FOUND",
        `AI schedule occurrence not found: "${id}"`,
      );
    }

    return occurrence;
  }

  private recordAudit(
    schedule: AiScheduleManifest,
    confidence: number,
    decision: string,
    governanceResult: string,
    executionStatus: string,
    createdAt: string,
  ): void {
    const propertyId =
      schedule.governanceContext.propertyId;

    if (!propertyId) {
      return;
    }

    this.auditService.record({
      id: randomUUID(),
      propertyId,
      command:
        schedule.commandName,
      confidence,
      decision,
      governanceResult,
      action:
        "SCHEDULED_AI_EXECUTION",
      executionStatus,
      createdAt:
        new Date(createdAt),
    });
  }

  private isRetryableError(
    error: unknown,
  ): boolean {
    if (
      error &&
      typeof error === "object" &&
      "retriable" in error
    ) {
      return Boolean(
        (error as {
          retriable?: unknown;
        }).retriable,
      );
    }

    const code =
      this.errorCode(error);

    return [
      "PROVIDER_TIMEOUT",
      "AI_PROVIDER_TIMEOUT",
      "TOOL_EXECUTION_FAILED",
    ].includes(code);
  }

  private errorCode(
    error: unknown,
  ): string {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      typeof (error as {
        code?: unknown;
      }).code === "string"
    ) {
      return (error as {
        code: string;
      }).code;
    }

    return "SCHEDULED_AI_EXECUTION_FAILED";
  }

  private errorMessage(
    error: unknown,
  ): string {
    return error instanceof Error
      ? error.message
      : "Scheduled AI execution failed";
  }
}
