import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertySpecialistAgentRegistryService,
} from './property-specialist-agent.registry.service';

import {
  PropertyAgentDelegationPlannerService,
} from './property-agent-delegation-planner.service';


describe(
  'PropertyAgentDelegationPlannerService',
  () => {


    it(
      'delegates work to specialist agent',
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
              'Maintenance analysis agent',

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


        const planner =
          new PropertyAgentDelegationPlannerService(
            registry,
          );


        const result =
          planner.delegate(
            'property-operations-agent',

            'MAINTENANCE_ANALYSIS',

            'Maintenance SLA risk detected',
          );


        expect(result.targetAgentId)
          .toBe(
            'maintenance-agent',
          );


        expect(result.capability)
          .toBe(
            'MAINTENANCE_ANALYSIS',
          );

      },
    );


  },
);
