import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAgentDelegationPlannerService,
} from './property-agent-delegation-planner.service';

import {
  PropertySpecialistAgentRegistryService,
} from './property-specialist-agent.registry.service';


function createAgent(
  id:
    string,

  domain:
    string,
) {

  return {

    domain,

    agent: {

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

  };

}


describe(
  'PropertyAgentDelegationPlannerService',
  () => {


    it(
      'delegates to the first matching specialist',
      () => {


        const registry =
          new PropertySpecialistAgentRegistryService();


        registry.register(
          createAgent(
            'maintenance-agent',
            'MAINTENANCE',
          ),
        );


        const planner =
          new PropertyAgentDelegationPlannerService(
            registry,
          );


        const result =
          planner.delegate(

            'property-operations-agent',

            'MAINTENANCE_ANALYSIS',

            'SLA breach detected',

          );


        expect(
          result,
        )
        .toEqual({

          sourceAgentId:
            'property-operations-agent',

          targetAgentId:
            'maintenance-agent',

          capability:
            'MAINTENANCE_ANALYSIS',

          reason:
            'SLA breach detected',

        });

      },
    );


    it(
      'delegates to every matching specialist',
      () => {


        const registry =
          new PropertySpecialistAgentRegistryService();


        registry.register(
          createAgent(
            'maintenance-agent',
            'MAINTENANCE',
          ),
        );


        registry.register(
          createAgent(
            'helpdesk-agent',
            'HELPDESK',
          ),
        );


        const planner =
          new PropertyAgentDelegationPlannerService(
            registry,
          );


        const results =
          planner.delegateMany(

            'property-operations-agent',

            'MAINTENANCE_ANALYSIS',

            'Operational review',

          );


        expect(
          results,
        )
        .toHaveLength(
          2,
        );


        expect(
          results.map(
            result =>
              result.targetAgentId,
          ),
        )
        .toEqual(
          [
            'maintenance-agent',
            'helpdesk-agent',
          ],
        );


        expect(
          results,
        )
        .toEqual(
          expect.arrayContaining([
            expect.objectContaining({

              sourceAgentId:
                'property-operations-agent',

              capability:
                'MAINTENANCE_ANALYSIS',

              reason:
                'Operational review',

            }),
          ]),
        );

      },
    );


    it(
      'rejects delegation when no specialist supports the capability',
      () => {


        const registry =
          new PropertySpecialistAgentRegistryService();


        const planner =
          new PropertyAgentDelegationPlannerService(
            registry,
          );


        expect(
          () =>
            planner.delegateMany(

              'property-operations-agent',

              'UNKNOWN_CAPABILITY',

              'Unsupported request',

            ),
        )
        .toThrow(
          'No specialist found for capability: UNKNOWN_CAPABILITY',
        );

      },
    );


  },
);
