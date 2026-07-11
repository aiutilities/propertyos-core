import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  NotificationDeliveryResult,
  NotificationProvider,
} from '../contracts/notification-provider.contract';
import { NotificationMessage } from '../types/notification.types';

@Injectable()
export class MockWhatsAppNotificationProvider
  implements NotificationProvider
{
  readonly name = 'mock-whatsapp';
  readonly channel = 'WHATSAPP' as const;

  async send(
    notification: NotificationMessage,
  ): Promise<NotificationDeliveryResult> {
    return {
      success: true,
      providerName: this.name,
      providerMessageId: `mock-wa-${randomUUID()}`,
      metadata: {
        recipient: notification.recipient,
        simulated: true,
      },
    };
  }
}
