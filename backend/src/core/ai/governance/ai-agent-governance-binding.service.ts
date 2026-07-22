import {
  Injectable,
} from '@nestjs/common';

import {
  AiAgentGovernanceRequest,
  AiAgentGovernanceResult,
} from '../types/ai-agent-governance.types';


@Injectable()
export class AiAgentGovernanceBindingService {


  evaluate(
    request:
      AiAgentGovernanceRequest,
  ): AiAgentGovernanceResult {


    if (
      request.riskLevel === 'HIGH'
    ) {

      return {

        allowed:
          false,

        decision:
          'REQUIRES_APPROVAL',

        reason:
          'High risk capability requires approval',

        evidenceEvent:
          'ai.agent.governance.approval_required',
      };
    }


    if (
      request.autonomyLevel === 'ASSISTED'
    ) {

      return {

        allowed:
          false,

        decision:
          'REQUIRES_APPROVAL',

        reason:
          'Assisted agents require approval',

        evidenceEvent:
          'ai.agent.governance.approval_required',
      };
    }


    if (
      request.confidence < 0.7
    ) {

      return {

        allowed:
          false,

        decision:
          'BLOCK',

        reason:
          'Confidence below execution threshold',

        evidenceEvent:
          'ai.agent.governance.blocked',
      };
    }


    return {

      allowed:
        true,

      decision:
        'ALLOW',

      reason:
        'Governance checks passed',

      evidenceEvent:
        'ai.agent.governance.allowed',
    };
  }
}
