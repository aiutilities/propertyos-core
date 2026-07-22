import { Injectable } from '@nestjs/common';

import {
  AiRecoveryPlan,
} from '../types/ai-recovery.types';

import {
  AiRecoveryContext,
  AiRecoveryCoordinationResult,
} from '../types/ai-recovery-coordinator.types';

@Injectable()
export class AiRecoveryCoordinatorService {

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

    if (
      context.attemptCount >=
      context.maxAttempts
    ) {
      return {
        plan,
        approved: false,
        executable: false,
        reason:
          'Recovery attempt limit reached',
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
