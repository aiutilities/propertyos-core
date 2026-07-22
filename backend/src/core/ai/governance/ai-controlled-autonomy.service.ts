import {
  Injectable,
} from '@nestjs/common';

import {
  AiAutonomousDecisionGuardService,
} from './ai-autonomous-decision-guard.service';

import {
  AiDecisionGovernancePolicy,
} from '../types/ai-decision-governance.types';

import {
  AiControlledAutonomyResult,
} from '../types/ai-controlled-autonomy.types';


@Injectable()
export class AiControlledAutonomyService {

  constructor(
    private readonly guard:
      AiAutonomousDecisionGuardService,
  ) {}


  evaluate(
    providerName: string,

    recommendation: string,

    confidence: number,

    policy: AiDecisionGovernancePolicy,
  ): AiControlledAutonomyResult {


    const decision =
      this.guard.evaluate(
        providerName,
        recommendation,
        confidence,
        policy,
      );


    let evidenceEvent: string;


    if (
      decision.mode === 'EXECUTE'
    ) {
      evidenceEvent =
        'ai.decision.approved';
    }
    else if (
      decision.mode === 'REQUEST_APPROVAL'
    ) {
      evidenceEvent =
        'ai.decision.requires_approval';
    }
    else {
      evidenceEvent =
        'ai.decision.blocked';
    }


    return {
      providerName,

      recommendation,

      confidence,

      mode:
        decision.mode,

      executed:
        decision.mode === 'EXECUTE',

      evidenceEvent,

      reason:
        decision.reason,
    };
  }
}
