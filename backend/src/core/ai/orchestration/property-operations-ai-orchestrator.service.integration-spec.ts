import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyOperationsAiOrchestratorService,
} from './property-operations-ai-orchestrator.service';

import {
  PropertyAgentDelegationPlannerService,
} from '../agents/property-agent-delegation-planner.service';

import {
  PropertySpecialistAgentRegistryService,
} from '../agents/property-specialist-agent.registry.service';

import {
  PropertyAgentCollaborationService,
} from '../agents/property-agent-collaboration.service';

import {
  AiAgentCollaborationService,
} from '../collaboration/ai-agent-collaboration.service';

import {
  PropertyAgentDecisionAggregatorService,
} from '../agents/property-agent-decision-aggregator.service';

import {
  PropertyHealthAdvisoryService,
} from '../property-intelligence/property-health-advisory.service';

import {
  PropertyActionProposalService,
} from '../property-actions/property-action-proposal.service';


describe(
  'PropertyOperationsAiOrchestratorService',
  () => {


    it(
      'runs property AI operational loop',
      () => {


        const registry =
          new PropertySpecialistAgentRegistryService();


        registry.register({

          domain:
            'MAINTENANCE',

          agent:
          {
            id:
              'maintenance-agent',

            name:
              'Maintenance Specialist',

            description:
              'Maintenance analysis',

            capabilities:
              [
                'MAINTENANCE_ANALYSIS',
              ],

            permissions:
              [],

            autonomyLevel:
              'SUPERVISED',

            status:
              'ACTIVE',

            createdAt:
              new Date().toISOString(),
          },

        });


        const service =
          new PropertyOperationsAiOrchestratorService(

            new PropertyAgentDelegationPlannerService(
              registry,
            ),

            new PropertyAgentCollaborationService(
              new AiAgentCollaborationService(),
            ),

            new PropertyAgentDecisionAggregatorService(),

            new PropertyHealthAdvisoryService(),

            new PropertyActionProposalService(),

          );


        const result =
          service.execute({

            propertyId:
              'property-001',

            capability:
              'MAINTENANCE_ANALYSIS',

            reason:
              'SLA breach detected',

          });


        expect(result.decision)
          .toBe(
            'CREATE_OPERATIONAL_ACTION',
          );


        expect(result.participatingAgents)
          .toContain(
            'maintenance-agent',
          );

      },
    );


  },
);
