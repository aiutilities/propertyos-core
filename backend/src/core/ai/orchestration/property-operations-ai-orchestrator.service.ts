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

import {
  PropertySpecialistAgentRuntimeService,
} from '../agents/runtime/property-specialist-agent-runtime.service';

import {
  PropertySpecialistAgentRegistryService,
} from '../agents/property-specialist-agent.registry.service';


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

    private readonly specialistRuntime:
      PropertySpecialistAgentRuntimeService,

    private readonly specialistRegistry:
      PropertySpecialistAgentRegistryService,
  ) {}


  async execute(
    request:
      PropertyOperationsAiRequest,
  ):
    Promise<PropertyOperationsAiResult> {


    const delegations =
      this.delegation.delegateMany(
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
            ...delegations.map(
              delegation =>
                delegation.targetAgentId,
            ),
          ],

      });


    const executionResults =
      await Promise.allSettled(

        delegations.map(
          delegation =>
            this.specialistRuntime.execute(

              delegation.targetAgentId,

              {
                propertyId:
                  request.propertyId,

                capability:
                  request.capability,

                objective:
                  request.reason,
              },

            ),
        ),

      );


    const specialistRecommendations =
      executionResults.flatMap(
        result =>
          result.status === 'fulfilled'
            ? [
                result.value,
              ]
            : [],
      );


    const specialistFailures =
      executionResults.flatMap(
        (
          result,
          index,
        ) => {

          if (
            result.status === 'fulfilled'
          ) {

            return [];

          }


          return [
            {
              agentId:
                delegations[index]
                  .targetAgentId,

              message:
                result.reason
                  instanceof Error
                    ? result.reason.message
                    : String(
                        result.reason,
                      ),
            },
          ];

        },
      );


    if (
      specialistRecommendations.length === 0
    ) {

      throw new Error(
        'All delegated specialists failed',
      );

    }


    const weightedRecommendations =
      specialistRecommendations.map(
        proposal => {

          const specialist =
            this.specialistRegistry
              .getByAgentId(
                proposal.agentId,
              );

          return {

            ...proposal,

            expertiseWeight:
              specialist
                ?.expertiseWeight
              ?? 1,

          };

        },
      );

    const negotiation =
      this.negotiation.negotiate(
        request.propertyId,
        weightedRecommendations,
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

      specialistFailures,

      proposals,

    };

  }

}
