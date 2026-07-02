import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../eventbus/services/eventbus.service';
import { PropertyOSEvent } from '../eventbus/types/event.types';
import { NotificationService } from './services/notification.service';
import { NotificationChannel } from './types/notification.types';

@Injectable()
export class NotificationSubscriber implements OnModuleInit {
  constructor(
    private readonly eventBusService: EventBusService,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit(): void {
    this.eventBusService.subscribe('NOTIFICATION_REQUESTED', (event) =>
      this.handleNotificationRequested(event),
    );
  }

  private handleNotificationRequested(event: PropertyOSEvent): void {
    const payload = event.payload as {
      channel?: NotificationChannel;
      recipient?: string;
      subject?: string;
      message?: string;
      metadata?: Record<string, unknown>;
    };

    if (!payload.channel || !payload.recipient || !payload.message) {
      return;
    }

    this.notificationService.createNotification({
      channel: payload.channel,
      recipient: payload.recipient,
      subject: payload.subject,
      message: payload.message,
      metadata: {
        ...payload.metadata,
        sourceEventId: event.id,
        sourceEventType: event.type,
        source: event.source,
      },
    });
  }
}
