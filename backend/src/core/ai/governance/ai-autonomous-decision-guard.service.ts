import {
  Injectable,
} from '@nestjs/common';

import {
  AiDecisionGovernanceService,
} from './ai-decision-governance.service';

import {
  AiDecisionGovernancePolicy,
} from '../types/ai-decision-governance.types';

import {
  AiAutonomousDecision,
} from '../types/ai-autonomous-decision.types';


@Injectable()
export class AiAutonomousDecisionGuardService {

  constructor(
    private readonly governanceService:
      AiDecisionGovernanceService,
  ) {}


  evaluate(
    providerName: string,

    recommendation: string,

    confidence: number,

    policy: AiDecisionGovernancePolicy,
  ): AiAutonomousDecision {


    const governance =
      this.governanceService.evaluate(
        policy,

        confidence,

        recommendation,
      );


    if (
      governance.mode === 'BLOCKED'
    ) {
      return {
        providerName,

        recommendation,

        confidence,

        mode:
          'BLOCK',

        allowed:
          false,

        reason:
          governance.reason,

        auditRequired:
          governance.auditRequired,

        rollbackRequired:
          governance.rollbackRequired,
      };
    }


    if (
      governance.mode === 'APPROVAL_REQUIRED'
    ) {
      return {
        providerName,

        recommendation,

        confidence,

        mode:
          'REQUEST_APPROVAL',

        allowed:
          false,

        reason:
          governance.reason,

        auditRequired:
          governance.auditRequired,

        rollbackRequired:
          governance.rollbackRequired,
      };
    }


    return {
      providerName,

      recommendation,

      confidence,

      mode:
        'EXECUTE',

      allowed:
        true,

      reason:
        governance.reason,

      auditRequired:
        governance.auditRequired,

      rollbackRequired:
        governance.rollbackRequired,
    };
  }
}
