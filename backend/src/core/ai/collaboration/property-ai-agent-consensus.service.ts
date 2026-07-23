import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiAgentNegotiationResult,
} from './property-ai-agent-negotiation.types';

import {
  PropertyAiAgentConsensusResult,
} from './property-ai-agent-consensus.types';


@Injectable()
export class PropertyAiAgentConsensusService {


  decide(
    negotiation:
      PropertyAiAgentNegotiationResult,
  ):
    PropertyAiAgentConsensusResult {


    if (
      negotiation.agreementScore >= 0.75
    ) {

      return {

        propertyId:
          negotiation.propertyId,

        decision:
          'CONSENSUS_REACHED',

        recommendation:
          negotiation.selectedProposal.recommendation,

        confidence:
          negotiation.agreementScore,

        reason:
          'Specialist agents reached strong agreement',

      };

    }


    return {

      propertyId:
        negotiation.propertyId,

      decision:
        'HUMAN_REVIEW_REQUIRED',

      recommendation:
        negotiation.selectedProposal.recommendation,

      confidence:
        negotiation.agreementScore,

      reason:
        'Agent proposals are not sufficiently aligned',

    };

  }

}
