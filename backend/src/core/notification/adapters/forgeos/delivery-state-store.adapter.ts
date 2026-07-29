import { Injectable } from '@nestjs/common';

import {
  DeliveryStateStore,
  StoredCommunicationDelivery,
  UpdateDeliveryStateInput,
} from '@forgeos/communication';

import {
  NotificationService,
} from '../../services/notification.service';

@Injectable()
export class PropertyOSDeliveryStateStoreAdapter
  implements DeliveryStateStore
{
  constructor(
    private readonly notificationService:
      NotificationService,
  ) {}

  async updateDeliveryState(
    input: UpdateDeliveryStateInput,
  ): Promise<StoredCommunicationDelivery | null> {
    const notification =
      await this.notificationService
        .updateDeliveryStatus(
          input.communicationId,
          input.status,
          input.metadata ?? {},
        );

    if (!notification) {
      return null;
    }

    return {
      id: notification.id,
      status: notification.status,
      metadata: notification.metadata,
    };
  }
}
