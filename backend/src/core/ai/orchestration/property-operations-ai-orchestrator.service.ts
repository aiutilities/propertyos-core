import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAgentDelegationPlannerService,
} from '../agents/property-agent-delegation-planner.service';

import {
  PropertyAgentCollaborationService,
} from '../agents/property-agent-collaboration.service';

import {
  PropertyAgentDecisionAggregatorService,
} from '../agents/property-agent-decision-aggregator.service';

import {
  PropertyOperationsAiRequest,
  PropertyOperationsAiResult,
} from '../types/property-operations-ai-orchestration.types';

import {
  PropertyHealthAdvisoryService,
} from '../property-intelligence/property-health-advisory.service';

import {
  PropertyActionProposalService,
} from '../property-actions/property-action-proposal.service';


@Injectable()
export class PropertyOperationsAiOrchestratorService {


  constructor(
    private readonly delegation:
      PropertyAgentDelegationPlannerService,

    private readonly collaboration:
      PropertyAgentCollaborationService,

    private readonly aggregator:
      PropertyAgentDecisionAggregatorService,

    private readonly advisory:
      PropertyHealthAdvisoryService,

    private readonly actionProposal:
      PropertyActionProposalService,
  ) {}


  execute(
    request:
      PropertyOperationsAiRequest,
  ):
    PropertyOperationsAiResult {


    const delegation =
      this.delegation.delegate(
        'property-operations-agent',
        request.capability,
        request.reason,
      );


    const collaboration =
      this.collaboration.collaborate({

        propertyId:
          request.propertyId,

        objective:
          request.reason,

        coordinatorAgentId:
          'property-operations-agent',

        specialistAgentIds:
          [
            delegation.targetAgentId,
          ],

      });


    const decision =
      this.aggregator.aggregate(

        request.propertyId,

        [
          {
            agentId:
              delegation.targetAgentId,

            recommendation:
              'CREATE_OPERATIONAL_ACTION',

            confidence:
              0.9,
          },
        ],

      );


    const healthAdvisory =
      this.advisory.advise({

        signals:
          [],

        overallRisk:
          'HIGH',

        recommendations:
          [
            'Review high priority operational issues',
            'Assign owners for unresolved risks',
          ],

      });


    const proposals =
      this.actionProposal.create(
        request.propertyId,
        healthAdvisory,
      );



    return {

      propertyId:
        request.propertyId,

      decision:
        decision.decision,

      confidence:
        decision.confidence,

      participatingAgents:
        collaboration.participatingAgents,

      proposals,

    };

  }

}
