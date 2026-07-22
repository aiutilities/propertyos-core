import { Injectable } from '@nestjs/common';

import {
  AiRecoveryPlan,
} from '../types/ai-recovery.types';

import {
  AiRecoveryBudgetService,
} from './ai-recovery-budget.service';

import {
  AiRecoveryContext,
  AiRecoveryCoordinationResult,
} from '../types/ai-recovery-coordinator.types';

@Injectable()
export class AiRecoveryCoordinatorService {

  constructor(
    private readonly budgetService:
      AiRecoveryBudgetService,
  ) {}

  coordinate(
    plan: AiRecoveryPlan,
    context: AiRecoveryContext,
  ): AiRecoveryCoordinationResult {

    if (!plan.allowed) {
      return {
        plan,
        approved: false,
        executable: false,
        reason:
          'Recovery plan is not allowed',
      };
    }

    const budget =
      this.budgetService.evaluate({
        maxAttempts:
          context.maxAttempts,
        attemptsUsed:
          context.attemptCount,
      });

    if (!budget.allowed) {
      return {
        plan,
        approved: false,
        executable: false,
        reason:
          budget.reason,
      };
    }

    return {
      plan,
      approved: true,
      executable:
        plan.decision !== 'STOP',
      reason:
        'Recovery action approved',
    };
  }
}
