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

import {
  AI_EVENT_COMMAND_REGISTRY,
} from './ai-event-command.registry';


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

    const events =
      Object.keys(
        AI_EVENT_COMMAND_REGISTRY,
      );


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
