import {
  Injectable,
  OnModuleInit,
} from '@nestjs/common';

import {
  EventBusService,
} from '../../eventbus/services/eventbus.service';

import {
  PropertyAiEventTriggerService,
} from './property-ai-event-trigger.service';


@Injectable()
export class PropertyAiEventTriggerBootstrapService
  implements OnModuleInit {


  constructor(
    private readonly eventBus:
      EventBusService,

    private readonly trigger:
      PropertyAiEventTriggerService,
  ) {}


  onModuleInit(): void {

    const events = [

      'maintenance.ticket.overdue',

      'helpdesk.ticket.escalated',

      'inventory.low.stock',

    ];


    for (
      const eventType of events
    ) {

      this.eventBus.subscribe(
        eventType,

        async (
          event,
        ) => {

          await this.trigger.handle(
            event,
          );

        },
      );

    }

  }

}
