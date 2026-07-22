import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  PropertyAiActionOrchestrationService,
} from './property-ai-action-orchestration.service';


describe(
  'PropertyAiActionOrchestrationService',
  () => {


    it(
      'governs and executes AI recommendations',
      () => {


        const service =
          new PropertyAiActionOrchestrationService(

            {
              evaluate:
                () => ({

                  propertyId:
                    'property-001',

                  action:
                    'REVIEW_MAINTENANCE',

                  decision: {

                    mode:
                      'REQUEST_APPROVAL',

                  },

                }),
            } as never,


            {
              execute:
                () => ({

                  propertyId:
                    'property-001',

                  action:
                    'REVIEW_MAINTENANCE',

                  status:
                    'PENDING_APPROVAL',

                  message:
                    'Property action requires human approval',

                }),
            } as never,

          );


        const result =
          service.execute(

            'property-001',

            [
              {

                propertyId:
                  'property-001',

                action:
                  'REVIEW_MAINTENANCE',

                reason:
                  'Review maintenance queue',

                confidence:
                  0.9,

                priority:
                  'HIGH',

                requiresApproval:
                  true,

              },
            ],

          );


        expect(
          result.executions[0].status,
        )
        .toBe(
          'PENDING_APPROVAL',
        );


        expect(
          result.executions[0].governanceMode,
        )
        .toBe(
          'REQUEST_APPROVAL',
        );

      },
    );


  },
);
