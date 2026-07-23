import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyAiEventTriggerService,
} from './property-ai-event-trigger.service';


describe(
  'Property AI maintenance integration',
  () => {


    it(
      'routes maintenance event into property health analysis',
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
              'event-maintenance-001',

            type:
              'maintenance.ticket.created',

            source:
              'maintenance',

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
            'ANALYZE_PROPERTY_HEALTH',
          );


        expect(result?.propertyId)
          .toBe(
            'property-001',
          );

      },
    );


  },
);
