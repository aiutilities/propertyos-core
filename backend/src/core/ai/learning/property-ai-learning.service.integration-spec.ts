import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiLearningService,
} from './property-ai-learning.service';


describe(
  'PropertyAiLearningService',
  () => {


    it(
      'creates learning profile from feedback',
      async () => {


        const service =
          new PropertyAiLearningService(

            {
              analyze:
                async () => [
                  {

                    propertyId:
                      'property-001',

                    action:
                      'REVIEW_MAINTENANCE',

                    executionCount:
                      10,

                    successRate:
                      0.9,

                    confidenceAdjustment:
                      0.05,

                  },
                ],
            } as any,

          );


        const result =
          await service.buildProfile(
            'property-001',
          );


        expect(
          result.actions.length,
        )
        .toBe(
          1,
        );


        expect(
          result.actions[0].pattern,
        )
        .toBe(
          'SUCCESSFUL',
        );

      },
    );


  },
);
