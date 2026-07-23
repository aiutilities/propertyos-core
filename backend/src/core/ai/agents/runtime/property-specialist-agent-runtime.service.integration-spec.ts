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


    it(
      'executes multiple specialists concurrently',
      async () => {


        const runtime =
          new PropertySpecialistAgentRuntimeService();


        let startedAgents =
          0;


        let releaseExecutions:
          (() => void) | undefined;


        const executionBarrier =
          new Promise<void>(
            resolve => {

              releaseExecutions =
                resolve;

            },
          );


        const createAgent =
          (
            agentId:
              string,
          ) => ({

            agentId,

            capabilities:
              [
                'MAINTENANCE_ANALYSIS',
              ],

            execute:
              async () => {


                startedAgents +=
                  1;


                if (
                  startedAgents === 2
                ) {

                  releaseExecutions?.();

                }


                await executionBarrier;


                return {

                  agentId,

                  recommendation:
                    'CREATE_REPAIR_ACTION',

                  confidence:
                    0.9,

                  reasoning:
                    `${agentId} completed concurrently`,

                };

              },

          });


        runtime.register(
          createAgent(
            'maintenance-agent',
          ),
        );


        runtime.register(
          createAgent(
            'helpdesk-agent',
          ),
        );


        const executions =
          Promise.all([
            runtime.execute(

              'maintenance-agent',

              {
                propertyId:
                  'property-001',

                capability:
                  'MAINTENANCE_ANALYSIS',

                objective:
                  'Review maintenance risk',
              },

            ),

            runtime.execute(

              'helpdesk-agent',

              {
                propertyId:
                  'property-001',

                capability:
                  'MAINTENANCE_ANALYSIS',

                objective:
                  'Review maintenance risk',
              },

            ),
          ]);


        const results =
          await executions;


        expect(
          startedAgents,
        )
        .toBe(
          2,
        );


        expect(
          results.map(
            result =>
              result.agentId,
          ),
        )
        .toEqual(
          [
            'maintenance-agent',
            'helpdesk-agent',
          ],
        );

      },
    );


  },
);
