import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiAgentReplanningService,
} from './property-ai-agent-replanning.service';


describe(
  'PropertyAiAgentReplanningService',
  () => {


    it(
      'requests replanning when execution fails',
      () => {


        const service =
          new PropertyAiAgentReplanningService();


        const result =
          service.evaluate({

            goalId:
              'goal-001',

            plan:
              {} as any,

            executions:
              [
                {

                  success:
                    false,

                  agentId:
                    'agent-001',

                  capabilityId:
                    'maintenance',

                  stepOrder:
                    1,

                  status:
                    'FAILED',

                  evidenceEvent:
                    'failed',

                  reason:
                    'Execution failed',

                },
              ],

            completed:
              false,

            generatedAt:
              new Date()
                .toISOString(),

          });


        expect(
          result.decision,
        )
        .toBe(
          'REPLAN_REQUIRED',
        );


        expect(
          result.failedExecutions,
        )
        .toBe(
          1,
        );

      },
    );


  },
);
