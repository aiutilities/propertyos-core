import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyAiEventTriggerService,
} from './property-ai-event-trigger.service';


describe(
  'Property AI helpdesk integration',
  () => {


    it(
      'routes helpdesk event into operational risk analysis',
      async () => {


        const execution =
        {
          execute:
            async (
              request: any,
            ) => ({

              propertyId:
                request.propertyId,

              command:
                request.command,

              decision:
                'CREATE_OPERATIONAL_ACTION',

              confidence:
                0.9,

              proposals:
                [],

            }),
        } as any;


        const service =
          new PropertyAiEventTriggerService(
            execution,
          );


        const result =
          await service.handle({

            id:
              'event-helpdesk-001',

            type:
              'helpdesk.ticket.created',

            source:
              'helpdesk',

            payload:
              {
                propertyId:
                  'property-001',
              },

            createdAt:
              new Date(),

          });


        expect(result?.executed)
          .toBe(true);


        expect(result?.command)
          .toBe(
            'REVIEW_OPERATIONAL_RISK',
          );


        expect(result?.propertyId)
          .toBe(
            'property-001',
          );

      },
    );


  },
);
