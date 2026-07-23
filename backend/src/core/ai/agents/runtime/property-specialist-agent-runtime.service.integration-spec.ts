import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertySpecialistAgentRuntimeService,
} from './property-specialist-agent-runtime.service';


describe(
  'PropertySpecialistAgentRuntimeService',
  () => {


    it(
      'executes a registered specialist agent',
      async () => {


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
            async context => ({

              agentId:
                'maintenance-agent',

              recommendation:
                'CREATE_REPAIR_ACTION',

              confidence:
                0.91,

              reasoning:
                context.objective,

            }),

        });


        const result =
          await runtime.execute(

            'maintenance-agent',

            {
              propertyId:
                'property-001',

              capability:
                'MAINTENANCE_ANALYSIS',

              objective:
                'SLA breach detected',
            },

          );


        expect(
          result,
        )
        .toEqual(
          expect.objectContaining({

            agentId:
              'maintenance-agent',

            recommendation:
              'CREATE_REPAIR_ACTION',

            confidence:
              0.91,

          }),
        );

      },
    );


    it(
      'rejects execution for an unsupported capability',
      async () => {


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
                'CREATE_REPAIR_ACTION',

              confidence:
                0.9,

              reasoning:
                'Maintenance risk',

            }),

        });


        await expect(
          runtime.execute(

            'maintenance-agent',

            {
              propertyId:
                'property-001',

              capability:
                'PAYMENT_ANALYSIS',

              objective:
                'Review payment risk',
            },

          ),
        )
        .rejects
        .toThrow(
          'does not support capability',
        );

      },
    );


    it(
      'rejects duplicate executable specialist registration',
      () => {


        const runtime =
          new PropertySpecialistAgentRuntimeService();


        const agent =
          {

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
                  'CREATE_REPAIR_ACTION',

                confidence:
                  0.9,

                reasoning:
                  'Maintenance risk',

              }),

          };


        runtime.register(
          agent,
        );


        expect(
          () =>
            runtime.register(
              agent,
            ),
        )
        .toThrow(
          'already registered',
        );

      },
    );


  },
);
