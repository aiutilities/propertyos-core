import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiAgentNegotiationResult,
  PropertyAiAgentProposal,
} from './property-ai-agent-negotiation.types';


@Injectable()
export class PropertyAiAgentNegotiationService {


  negotiate(

    propertyId:
      string,

    proposals:
      PropertyAiAgentProposal[],

  ):
    PropertyAiAgentNegotiationResult {


    if (
      proposals.length === 0
    ) {

      throw new Error(
        'No agent proposals available',
      );

    }


    const sorted =
      [...proposals]
        .sort(
          (
            a,
            b,
          ) =>
            b.confidence -
            a.confidence,
        );


    const selectedProposal =
      sorted[0];


    const agreementScore =
      proposals.reduce(
        (
          sum,
          proposal,
        ) =>
          sum + proposal.confidence,
        0,
      )
      /
      proposals.length;


    return {

      propertyId,

      proposals,

      selectedProposal,

      agreementScore:

        Number(
          agreementScore.toFixed(2),
        ),

    };

  }

}
