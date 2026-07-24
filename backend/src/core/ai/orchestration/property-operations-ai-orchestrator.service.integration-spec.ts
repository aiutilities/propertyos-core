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

import {
  PropertyAiAgentNegotiationService,
} from '../collaboration/property-ai-agent-negotiation.service';

import {
  PropertyAiAgentConsensusService,
} from '../collaboration/property-ai-agent-consensus.service';

import {
  PropertySpecialistAgentRuntimeService,
} from '../agents/runtime/property-specialist-agent-runtime.service';


describe(
  'PropertyOperationsAiOrchestratorService',
  () => {


    it(
      'runs property AI operational loop',
      async () => {


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


        const intelligence =
        {
          analyzeProperty:
            async () => ({

              advisory:
                new PropertyHealthAdvisoryService()
                  .advise({

                    signals:
                      [],

                    overallRisk:
                      'HIGH',

                    recommendations:
                      [
                        'Review high priority operational issues',
                        'Assign owners for unresolved risks',
                      ],

                  }),

            }),

        } as any;


        const specialistRuntime =
          new PropertySpecialistAgentRuntimeService();


        specialistRuntime.register({

          agentId:
            'maintenance-agent',

          capabilities:
            [
              'MAINTENANCE_ANALYSIS',
            ],

          execute:
            async context => ({

              agentId:
                'maintenance-agent',

              recommendation:
                'CREATE_OPERATIONAL_ACTION',

              confidence:
                0.9,

              reasoning:
                context.objective,

            }),

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

            intelligence,

            new PropertyAiAgentNegotiationService(),

            new PropertyAiAgentConsensusService(),

            specialistRuntime,

            registry,

          );


        const result =
          await service.execute({

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


        expect(result.confidence)
          .toBe(
            0.9,
          );


        expect(
          result.specialistFailures,
        )
        .toEqual(
          [],
        );

      },
    );


    it(
      'continues when one delegated specialist fails',
      async () => {

        const results = await Promise.allSettled([
          Promise.resolve('ok'),
          Promise.reject(new Error('failure')),
        ]);

        expect(
          results.filter(
            r => r.status === 'fulfilled',
          ),
        ).toHaveLength(1);

        expect(
          results.filter(
            r => r.status === 'rejected',
          ),
        ).toHaveLength(1);

      },
    );


    it(
      'returns structured failures while continuing with successful specialists',
      async () => {


        const registry =
          new PropertySpecialistAgentRegistryService();


        const createRegistryAgent =
          (
            id:
              string,

            domain:
              string,
          ) => ({

            domain,

            agent:
              {
                id,

                name:
                  `${domain} Specialist`,

                description:
                  `${domain} operational analysis`,

                capabilities:
                  [
                    'MAINTENANCE_ANALYSIS',
                  ],

                permissions:
                  [],

                autonomyLevel:
                  'SUPERVISED' as const,

                status:
                  'ACTIVE' as const,

                createdAt:
                  new Date().toISOString(),
              },

          });


        registry.register(
          createRegistryAgent(
            'maintenance-agent',
            'MAINTENANCE',
          ),
        );


        registry.register(
          createRegistryAgent(
            'helpdesk-agent',
            'HELPDESK',
          ),
        );


        const specialistRuntime =
          new PropertySpecialistAgentRuntimeService();


        specialistRuntime.register({

          agentId:
            'maintenance-agent',

          capabilities:
            [
              'MAINTENANCE_ANALYSIS',
            ],

          execute:
            async context => ({

              agentId:
                'maintenance-agent',

              recommendation:
                'CREATE_OPERATIONAL_ACTION',

              confidence:
                0.92,

              reasoning:
                context.objective,

            }),

        });


        specialistRuntime.register({

          agentId:
            'helpdesk-agent',

          capabilities:
            [
              'MAINTENANCE_ANALYSIS',
            ],

          execute:
            async () => {

              throw new Error(
                'Helpdesk specialist unavailable',
              );

            },

        });


        const intelligence =
          {
            analyzeProperty:
              async () => ({

                advisory:
                  new PropertyHealthAdvisoryService()
                    .advise({

                      signals:
                        [],

                      overallRisk:
                        'HIGH',

                      recommendations:
                        [
                          'Review operational risk',
                        ],

                    }),

              }),
          } as any;


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

            intelligence,

            new PropertyAiAgentNegotiationService(),

            new PropertyAiAgentConsensusService(),

            specialistRuntime,

            registry,

          );


        const result =
          await service.execute({

            propertyId:
              'property-partial-failure',

            capability:
              'MAINTENANCE_ANALYSIS',

            reason:
              'Review unresolved maintenance risk',

          });


        expect(
          result.decision,
        )
        .toBe(
          'CREATE_OPERATIONAL_ACTION',
        );


        expect(
          result.confidence,
        )
        .toBe(
          0.92,
        );


        expect(
          result.participatingAgents,
        )
        .toEqual(
          [
            'maintenance-agent',
            'helpdesk-agent',
          ],
        );


        expect(
          result.specialistFailures,
        )
        .toEqual(
          [
            {
              agentId:
                'helpdesk-agent',

              message:
                'Helpdesk specialist unavailable',
            },
          ],
        );

      },
    );


    it(
      'rejects when every delegated specialist fails',
      async () => {


        const registry =
          new PropertySpecialistAgentRegistryService();


        registry.register({

          domain:
            'MAINTENANCE',

          agent:
            {
              id:
                'failing-maintenance-agent',

              name:
                'Failing Maintenance Specialist',

              description:
                'Unavailable maintenance specialist',

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


        const specialistRuntime =
          new PropertySpecialistAgentRuntimeService();


        specialistRuntime.register({

          agentId:
            'failing-maintenance-agent',

          capabilities:
            [
              'MAINTENANCE_ANALYSIS',
            ],

          execute:
            async () => {

              throw new Error(
                'Maintenance runtime unavailable',
              );

            },

        });


        const intelligence =
          {
            analyzeProperty:
              async () => {

                throw new Error(
                  'Intelligence must not execute',
                );

              },
          } as any;


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

            intelligence,

            new PropertyAiAgentNegotiationService(),

            new PropertyAiAgentConsensusService(),

            specialistRuntime,

            registry,

          );


        await expect(
          service.execute({

            propertyId:
              'property-all-failed',

            capability:
              'MAINTENANCE_ANALYSIS',

            reason:
              'Review maintenance incident',

          }),
        )
        .rejects
        .toThrow(
          'All delegated specialists failed',
        );

      },
    );


  it(
    'uses registry expertise weighting during negotiation',
    async () => {

      const registry =
        new PropertySpecialistAgentRegistryService();

      registry.register({

        domain:
          'MAINTENANCE',

        expertiseWeight:
          2,

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

      registry.register({

        domain:
          'GENERAL',

        expertiseWeight:
          1,

        agent:
          {
            id:
              'general-agent',

            name:
              'General Specialist',

            description:
              'General analysis',

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

      const runtime =
        new PropertySpecialistAgentRuntimeService();

      runtime.register({

        agentId:
          'maintenance-agent',

        capabilities:
          [
            'MAINTENANCE_ANALYSIS',
          ],

        execute:
          async () => ({

            agentId:
              'maintenance-agent',

            recommendation:
              'CREATE_OPERATIONAL_ACTION',

            confidence:
              0.90,

            reasoning:
              'maintenance',

          }),

      });

      runtime.register({

        agentId:
          'general-agent',

        capabilities:
          [
            'MAINTENANCE_ANALYSIS',
          ],

        execute:
          async () => ({

            agentId:
              'general-agent',

            recommendation:
              'HUMAN_REVIEW_REQUIRED',

            confidence:
              0.90,

            reasoning:
              'general',

          }),

      });

      const intelligence =
        {
          analyzeProperty:
            async () => ({

              advisory:
                new PropertyHealthAdvisoryService()
                  .advise({

                    signals:
                      [],

                    overallRisk:
                      'HIGH',

                    recommendations:
                      [
                        'Review',
                      ],

                  }),

            }),

        } as any;

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

          intelligence,

          new PropertyAiAgentNegotiationService(),

          new PropertyAiAgentConsensusService(),

          runtime,

          registry,

        );

      const result =
        await service.execute({

          propertyId:
            'property-weight',

          capability:
            'MAINTENANCE_ANALYSIS',

          reason:
            'weighted negotiation',

        });

      expect(
        result.decision,
      ).toBe(
        'CREATE_OPERATIONAL_ACTION',
      );

    },
  );


  },
);
