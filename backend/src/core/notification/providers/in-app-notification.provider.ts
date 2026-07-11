import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  NotificationDeliveryResult,
  NotificationProvider,
} from '../contracts/notification-provider.contract';
import { NotificationMessage } from '../types/notification.types';

@Injectable()
export class InAppNotificationProvider
  implements NotificationProvider
{
  readonly name = 'in-app';
  readonly channel = 'IN_APP' as const;

  async send(
    notification: NotificationMessage,
  ): Promise<NotificationDeliveryResult> {
    return {
      success: true,
      providerName: this.name,
      providerMessageId: `in-app-${randomUUID()}`,
      metadata: {
        recipient: notification.recipient,
        persisted: true,
      },
    };
  }
}
