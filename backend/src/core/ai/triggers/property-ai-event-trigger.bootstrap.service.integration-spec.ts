import {
  describe,
  it,
  expect,
} from '@jest/globals';

import {
  PropertyAiEventTriggerBootstrapService,
} from './property-ai-event-trigger.bootstrap.service';


describe(
  'PropertyAiEventTriggerBootstrapService',
  () => {


    it(
      'registers AI event subscriptions',
      () => {


        const subscriptions:
          string[] = [];


        const eventBus = {

          subscribe:
            (
              eventType: string,
            ) => {

              subscriptions.push(
                eventType,
              );

            },

        } as any;


        const trigger =
          {} as any;


        const service =
          new PropertyAiEventTriggerBootstrapService(
            eventBus,
            trigger,
          );


        service.onModuleInit();


        expect(subscriptions)
          .toContain(
            'maintenance.ticket.overdue',
          );


        expect(subscriptions)
          .toContain(
            'helpdesk.ticket.escalated',
          );


      },
    );


  },
);
