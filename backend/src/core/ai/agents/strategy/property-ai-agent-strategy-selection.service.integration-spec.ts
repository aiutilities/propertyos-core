import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiAgentStrategySelectionService,
} from './property-ai-agent-strategy-selection.service';


describe(
  'PropertyAiAgentStrategySelectionService',
  () => {


    it(
      'selects retry strategy from successful learning history',
      async () => {


        const service =
          new PropertyAiAgentStrategySelectionService(

            {
              buildProfile:
                async () => ({

                  propertyId:
                    'property-001',

                  actions:
                    [
                      {

                        action:
                          'REVIEW_MAINTENANCE',

                        confidenceAdjustment:
                          0.05,

                        pattern:
                          'SUCCESSFUL',

                        executionCount:
                          10,

                        successRate:
                          0.9,

                      },
                    ],

                  generatedAt:
                    new Date().toISOString(),

                }),
            } as any,


            {
              adjust:
                async () => ({

                  action:
                    'REVIEW_MAINTENANCE',

                  originalConfidence:
                    0.9,

                  adjustedConfidence:
                    0.95,

                  adjustment:
                    0.05,

                  historicalExecutions:
                    10,

                  successRate:
                    0.9,

                }),
            } as any,

          );


        const result =
          await service.decide(

            'property-001',

            'REVIEW_MAINTENANCE',

            0.9,

          );


        expect(
          result.decision,
        )
        .toBe(
          'RETRY',
        );


      },
    );


  },
);
