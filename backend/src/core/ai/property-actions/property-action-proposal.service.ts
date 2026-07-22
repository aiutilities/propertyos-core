import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyHealthAdvisory,
} from '../types/property-health-advisory.types';

import {
  PropertyActionProposal,
} from '../types/property-action-proposal.types';


@Injectable()
export class PropertyActionProposalService {


  create(
    propertyId: string,

    advisory:
      PropertyHealthAdvisory,

  ): PropertyActionProposal[] {


    const proposals:
      PropertyActionProposal[] = [];


    for (
      const action of advisory.actions
    ) {


      if (
        action.includes(
          'high priority',
        )
      ) {

        proposals.push({

          propertyId,

          action:
            'REVIEW_MAINTENANCE',

          reason:
            advisory.summary,

          confidence:
            0.85,

          requiresApproval:
            true,

        });

      }


      if (
        action.includes(
          'Assign owners',
        )
      ) {

        proposals.push({

          propertyId,

          action:
            'ASSIGN_OPERATIONAL_OWNER',

          reason:
            advisory.summary,

          confidence:
            0.75,

          requiresApproval:
            true,

        });

      }

    }


    return proposals;

  }

}
