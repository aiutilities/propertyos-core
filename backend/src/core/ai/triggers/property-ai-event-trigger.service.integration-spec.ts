import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyAiEventTriggerService,
} from './property-ai-event-trigger.service';


describe(
  'PropertyAiEventTriggerService',
  () => {


    it(
      'converts property event into AI command',
      async () => {


        const commandService =
        {

          execute:
            async () => ({
              propertyId:
                'property-001',
            }),

        } as any;


        const service =
          new PropertyAiEventTriggerService(
            commandService,
          );


        const result =
          await service.handle({

            id:
              'event-001',

            type:
              'maintenance.ticket.overdue',

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


      },
    );


  },
);
