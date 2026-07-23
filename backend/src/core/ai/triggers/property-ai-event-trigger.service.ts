import {
  Injectable,
} from '@nestjs/common';

import {
  PropertyAiCommandService,
} from '../commands/property-ai-command.service';

import {
  PropertyAiTriggerResult,
  PropertyAiTriggerCommand,
} from '../types/property-ai-trigger.types';

import {
  PropertyOSEvent,
} from '../../eventbus/types/event.types';

import {
  AI_EVENT_COMMAND_REGISTRY,
} from './ai-event-command.registry';


@Injectable()
export class PropertyAiEventTriggerService {


  constructor(
    private readonly commandService:
      PropertyAiCommandService,
  ) {}


  async handle(
    event:
      PropertyOSEvent,
  ):
    Promise<PropertyAiTriggerResult | undefined> {


    const command =
      this.resolveCommand(
        event.type,
      );


    if (!command) {

      return undefined;

    }


    const propertyId =
      String(
        event.payload.propertyId ?? '',
      );


    await this.commandService.execute({

      propertyId,

      command,

      reason:
        `Triggered by event ${event.type}`,

    });


    return {

      eventType:
        event.type,

      command,

      executed:
        true,

      propertyId,

    };

  }


  private resolveCommand(
    eventType:
      string,
  ):
    PropertyAiTriggerCommand | undefined {

    return AI_EVENT_COMMAND_REGISTRY[eventType];

  }

}
