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


@Injectable()
export class PropertyOperationsAiOrchestratorService {


  constructor(
    private readonly delegation:
      PropertyAgentDelegationPlannerService,

    private readonly collaboration:
      PropertyAgentCollaborationService,

    private readonly aggregator:
      PropertyAgentDecisionAggregatorService,
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


    return {

      propertyId:
        request.propertyId,

      decision:
        decision.decision,

      confidence:
        decision.confidence,

      participatingAgents:
        collaboration.participatingAgents,

    };

  }

}
