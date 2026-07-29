import {
  CommunicationEventPublisher,
  PublishedCommunicationEvent,
  PublishCommunicationEventInput,
} from '@forgeos/communication';

import {
  EventBusService,
} from '../../../eventbus/services/eventbus.service';

export class PropertyOSNotificationEventPublisherAdapter
  implements CommunicationEventPublisher
{
  constructor(
    private readonly eventBus:
      EventBusService,
  ) {}

  async publish(
    input: PublishCommunicationEventInput,
  ): Promise<PublishedCommunicationEvent> {
    const mappedType =
      input.type === 'communication.sent'
        ? 'notification.sent'
        : input.type === 'communication.failed'
          ? 'notification.failed'
          : input.type;

    const communicationId =
      input.payload?.communicationId;

    const {
      communicationId: _ignored,
      ...remainingPayload
    } = input.payload ?? {};

    const payload = {
      ...remainingPayload,
      notificationId:
        communicationId,
    };

    const event = await this.eventBus.publish(
      mappedType,
      'core.notification.dispatcher',
      payload,
      {
        correlationId:
          input.correlationId,
        causationId:
          input.causationId,
        metadata: input.metadata,
      },
    );

    return {
      id: event.id,
      type: event.type,
      source: event.source,
      payload: event.payload,
      occurredAt:
        event.createdAt.toISOString(),
      correlationId:
        event.correlationId,
      causationId:
        event.causationId,
      metadata: event.metadata,
    };
  }
}
