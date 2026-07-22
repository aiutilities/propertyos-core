import {
  Injectable,
} from '@nestjs/common';

import {
  AiDecisionGovernancePolicy,
} from '../types/ai-decision-governance.types';

import {
  AiGovernanceEvaluation,
} from '../types/ai-governance-evaluation.types';


@Injectable()
export class AiDecisionGovernanceService {


  evaluate(
    policy: AiDecisionGovernancePolicy,

    confidence: number,

    recommendation: string,
  ): AiGovernanceEvaluation {


    if (
      !policy.allowedRecommendations.includes(
        recommendation,
      )
    ) {
      return {
        allowed: false,

        mode:
          'BLOCKED',

        reason:
          'Recommendation is not allowed by policy',

        auditRequired:
          policy.auditRequired,

        rollbackRequired:
          policy.rollbackRequired,
      };
    }


    if (
      confidence <
      policy.minimumConfidence
    ) {
      return {
        allowed: false,

        mode:
          'APPROVAL_REQUIRED',

        reason:
          'Confidence below governance threshold',

        auditRequired:
          policy.auditRequired,

        rollbackRequired:
          policy.rollbackRequired,
      };
    }


    return {
      allowed: true,

      mode:
        policy.approvalMode,

      reason:
        'Decision approved by governance policy',

      auditRequired:
        policy.auditRequired,

      rollbackRequired:
        policy.rollbackRequired,
    };
  }
}
