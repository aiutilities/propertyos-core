import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyActionProposal,
} from '../types/property-action-proposal.types';

import {
  PropertyActionGovernanceResult,
} from '../types/property-action-governance.types';

import {
  AiControlledAutonomyService,
} from '../governance/ai-controlled-autonomy.service';

import {
  AiDecisionGovernancePolicy,
} from '../types/ai-decision-governance.types';


@Injectable()
export class PropertyActionGovernanceService {


  constructor(
    private readonly autonomy:
      AiControlledAutonomyService,
  ) {}


  evaluate(
    proposal:
      PropertyActionProposal,
  ): PropertyActionGovernanceResult {


    const policy:
      AiDecisionGovernancePolicy =
      {

        tenantId:
          proposal.propertyId,

        allowedRecommendations:
          [
            proposal.action,
          ],

        minimumConfidence:
          0.9,

        approvalMode:
          'APPROVAL_REQUIRED',

        auditRequired:
          true,

        rollbackRequired:
          false,

      };


    const decision =
      this.autonomy.evaluate(
        'property-operations-agent',

        proposal.action,

        proposal.confidence,

        policy,
      );


    return {

      propertyId:
        proposal.propertyId,

      action:
        proposal.action,

      decision,

    };

  }

}
