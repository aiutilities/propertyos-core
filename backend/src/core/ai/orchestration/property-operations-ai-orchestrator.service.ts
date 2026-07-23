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

import {
  PropertyOperationsIntelligenceService,
} from '../property-intelligence/property-operations-intelligence.service';

import {
  PropertyAiAgentNegotiationService,
} from '../collaboration/property-ai-agent-negotiation.service';

import {
  PropertyAiAgentConsensusService,
} from '../collaboration/property-ai-agent-consensus.service';


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

    private readonly intelligence:
      PropertyOperationsIntelligenceService,

    private readonly negotiation:
      PropertyAiAgentNegotiationService,

    private readonly consensus:
      PropertyAiAgentConsensusService,
  ) {}


  async execute(
    request:
      PropertyOperationsAiRequest,
  ):
    Promise<PropertyOperationsAiResult> {


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


    const specialistRecommendations =
      [
        {
          agentId:
            delegation.targetAgentId,

          recommendation:
            'CREATE_OPERATIONAL_ACTION',

          confidence:
            0.9,

          reasoning:
            request.reason,
        },
      ];


    const negotiation =
      this.negotiation.negotiate(
        request.propertyId,
        specialistRecommendations,
      );


    const consensus =
      this.consensus.decide(
        negotiation,
      );


    const fallbackDecision =
      this.aggregator.aggregate(

        request.propertyId,

        specialistRecommendations.map(
          proposal => ({

            agentId:
              proposal.agentId,

            recommendation:
              proposal.recommendation,

            confidence:
              proposal.confidence,

          }),
        ),

      );


    const decision =
      consensus.decision
      === 'CONSENSUS_REACHED'
        ? {
            decision:
              consensus.recommendation,

            confidence:
              consensus.confidence,
          }
        : {
            decision:
              'HUMAN_REVIEW_REQUIRED',

            confidence:
              fallbackDecision.confidence,
          };


    const intelligence =
      await this.intelligence.analyzeProperty(
        request.propertyId,
      );


    const healthAdvisory =
      intelligence.advisory;


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
