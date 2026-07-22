import { Injectable } from '@nestjs/common';
import {
  AiRecoveryPlan,
} from '../types/ai-recovery.types';
import {
  AiFailureClassification,
} from '../types/ai-failure.types';

@Injectable()
export class AiRecoveryDecisionService {
  decide(
    classification: AiFailureClassification,
  ): AiRecoveryPlan {
    switch (classification.category) {
      case 'PROVIDER':
      case 'TIMEOUT':
      case 'RATE_LIMIT':
      case 'TRANSPORT':
        return {
          decision:
            classification.retriable
              ? 'RETRY'
              : 'FALLBACK_PROVIDER',
          allowed:
            true,
          reason:
            classification.retriable
              ? 'Failure is retry eligible'
              : 'Failure requires alternate provider',
        };

      case 'BUDGET':
        return {
          decision:
            'REDUCE_CONTEXT',
          allowed:
            true,
          reason:
            'Budget failure requires context reduction',
        };

      case 'AUTHORIZATION':
        return {
          decision:
            'REQUEST_PERMISSION',
          allowed:
            false,
          reason:
            'Authorization is required before continuation',
        };

      case 'TOOL':
      case 'VALIDATION':
      case 'UNKNOWN':
      default:
        return {
          decision:
            'STOP',
          allowed:
            false,
          reason:
            'Failure cannot be safely recovered',
        };
    }
  }
}
