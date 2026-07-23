import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyAiCommandService,
} from './property-ai-command.service';


describe(
  'PropertyAiCommandService',
  () => {


    it(
      'executes property AI command',
      async () => {


        const orchestrator =
        {

          execute:
            async () => ({

              propertyId:
                'property-001',

              decision:
                'REVIEW_REQUIRED',

              confidence:
                0.85,

              proposals:
                [
                  {
                    action:
                      'REVIEW_MAINTENANCE',
                  },
                ],

            }),

        } as any;


        const service =
          new PropertyAiCommandService(
            orchestrator,
          );


        const result =
          await service.execute({

            propertyId:
              'property-001',

            command:
              'ANALYZE_PROPERTY_HEALTH',

            reason:
              'Monthly review',

          });


        expect(result.proposals.length)
          .toBe(1);


      },
    );


  },
);
