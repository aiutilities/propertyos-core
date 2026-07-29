import {
  Injectable,
} from '@nestjs/common';

import {
  PaymentEventPublisher,
  PublishedPaymentEvent,
  PublishPaymentEventInput,
} from '@forgeos/payment';

import {
  EventBusService,
} from '../../../eventbus/services/eventbus.service';

@Injectable()
export class PropertyOSPaymentEventPublisherAdapter
  implements PaymentEventPublisher
{
  constructor(
    private readonly eventBus:
      EventBusService,
  ) {}

  async publish(
    input:
      PublishPaymentEventInput,
  ): Promise<PublishedPaymentEvent> {
    const event =
      await this.eventBus.publish(
        input.type,
        input.source,
        input.payload ?? {},
        {
          correlationId:
            input.correlationId,

          causationId:
            input.causationId,

          metadata:
            input.metadata,
        },
      );

    return {
      id:
        event.id,

      type:
        event.type,

      source:
        event.source,

      payload:
        event.payload,

      occurredAt:
        event.createdAt
          .toISOString(),

      correlationId:
        event.correlationId,

      causationId:
        event.causationId,

      metadata:
        event.metadata,
    };
  }
}
