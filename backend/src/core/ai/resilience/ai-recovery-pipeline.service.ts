import { Injectable } from '@nestjs/common';

import {
  AiFailurePolicyService,
} from './ai-failure-policy.service';

import {
  AiRecoveryDecisionService,
} from './ai-recovery-decision.service';

import {
  AiRecoveryCoordinatorService,
} from './ai-recovery-coordinator.service';

import {
  AiRecoveryExecutionService,
} from './ai-recovery-execution.service';

import {
  AiOrchestrationEvidenceService,
} from '../services/ai-orchestration-evidence.service';

import {
  AiRecoveryPipelineInput,
  AiRecoveryPipelineResult,
} from '../types/ai-recovery-pipeline.types';

@Injectable()
export class AiRecoveryPipelineService {

  constructor(
    private readonly failurePolicy:
      AiFailurePolicyService,

    private readonly decisionService:
      AiRecoveryDecisionService,

    private readonly coordinator:
      AiRecoveryCoordinatorService,

    private readonly execution:
      AiRecoveryExecutionService,

    private readonly evidence:
      AiOrchestrationEvidenceService,
  ) {}

  async execute(
    input: AiRecoveryPipelineInput,
  ): Promise<AiRecoveryPipelineResult> {

    const classification =
      this.failurePolicy.classify(
        input.failureCode,
        input.retriable,
      );

    const plan =
      this.decisionService.decide(
        classification,
      );

    const coordination =
      this.coordinator.coordinate(
        plan,
        {
          correlationId:
            input.correlationId,

          tenantId:
            input.tenantId,

          attemptCount:
            input.attemptsUsed,

          maxAttempts:
            input.maxAttempts,
        },
      );

    if (
      !coordination.approved ||
      !coordination.executable
    ) {
      return {
        success:
          false,

        decision:
          plan.decision,

        executionStatus:
          'STOPPED',

        reason:
          coordination.reason,
      };
    }

    await this.evidence.recordRecoveryStarted({
      correlationId:
        input.correlationId,

      tenantId:
        input.tenantId,

      action:
        plan.decision,

      attemptNumber:
        input.attemptsUsed + 1,

      message:
        coordination.reason,
    });

    const execution =
      this.execution.execute({
        action:
          plan.decision,

        correlationId:
          input.correlationId,

        tenantId:
          input.tenantId,

        reason:
          coordination.reason,

        attemptNumber:
          input.attemptsUsed + 1,
      });

    if (execution.status === 'FAILED') {
      await this.evidence.recordRecoveryFailed({
        correlationId:
          input.correlationId,

        tenantId:
          input.tenantId,

        action:
          plan.decision,

        attemptNumber:
          input.attemptsUsed + 1,

        message:
          execution.message,
      });
    } else {
      await this.evidence.recordRecoveryCompleted({
        correlationId:
          input.correlationId,

        tenantId:
          input.tenantId,

        action:
          plan.decision,

        attemptNumber:
          input.attemptsUsed + 1,

        message:
          execution.message,
      });
    }

    return {
      success:
        execution.status !== 'FAILED',

      decision:
        plan.decision,

      executionStatus:
        execution.status,

      reason:
        execution.message,
    };
  }
}
