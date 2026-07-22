import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertySpecialistAgentRegistryService,
} from './property-specialist-agent.registry.service';


describe(
  'PropertySpecialistAgentRegistryService',
  () => {


    it(
      'registers and discovers specialist agents',
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
              'Analyzes maintenance operations',

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


        const result =
          registry.getByCapability(
            'MAINTENANCE_ANALYSIS',
          );


        expect(result)
          .toHaveLength(1);


        expect(result[0].domain)
          .toBe(
            'MAINTENANCE',
          );

      },
    );


  },
);
