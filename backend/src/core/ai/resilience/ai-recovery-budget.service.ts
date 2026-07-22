import { Injectable } from '@nestjs/common';

import {
  AiRecoveryBudget,
  AiRecoveryBudgetStatus,
} from '../types/ai-recovery-budget.types';

@Injectable()
export class AiRecoveryBudgetService {

  evaluate(
    budget: AiRecoveryBudget,
  ): AiRecoveryBudgetStatus {

    const remainingAttempts =
      budget.maxAttempts -
      budget.attemptsUsed;

    if (
      remainingAttempts <= 0
    ) {
      return {
        allowed:
          false,
        remainingAttempts:
          0,
        reason:
          'Recovery budget exhausted',
      };
    }

    return {
      allowed:
        true,
      remainingAttempts,
      reason:
        'Recovery budget available',
    };
  }
}
