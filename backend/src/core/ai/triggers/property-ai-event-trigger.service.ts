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


    switch(eventType) {


      case 'maintenance.ticket.overdue':

        return 'ANALYZE_PROPERTY_HEALTH';


      case 'helpdesk.ticket.escalated':

        return 'REVIEW_OPERATIONAL_RISK';


      case 'inventory.low.stock':

        return 'REVIEW_OPERATIONAL_RISK';


      default:

        return undefined;

    }

  }

}
