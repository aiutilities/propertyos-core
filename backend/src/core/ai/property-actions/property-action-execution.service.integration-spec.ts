import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyActionExecutionService,
} from './property-action-execution.service';


describe(
  'PropertyActionExecutionService',
  () => {


    it(
      'creates approval boundary for governed action',
      () => {

        const service =
          new PropertyActionExecutionService();


        const result =
          service.execute({

            propertyId:
              'property-001',

            action:
              'REVIEW_MAINTENANCE',

            decision:
              {

                mode:
                  'REQUEST_APPROVAL',

                reason:
                  'Confidence below threshold',

                providerName:
                  'property-operations-agent',

                recommendation:
                  'REVIEW_MAINTENANCE',

                confidence:
                  0.85,

                executed:
                  false,

                evidenceEvent:
                  'ai.decision.requires_approval',

              },

          });


        expect(
          result.status,
        )
          .toBe(
            'PENDING_APPROVAL',
          );

      },
    );


  },
);
