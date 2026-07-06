import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../eventbus/services/eventbus.service';
import { PropertyOSEvent } from '../eventbus/types/event.types';
import {
  NotificationService,
  NotificationTemplate,
} from './services/notification.service';
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

    this.eventBusService.subscribeAll((event) =>
      this.handleTemplateDrivenNotification(event),
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
        orchestrationMode: 'direct-request',
      },
    });
  }

  private handleTemplateDrivenNotification(event: PropertyOSEvent): void {
    if (event.type === 'NOTIFICATION_REQUESTED') {
      return;
    }

    const templates = this.notificationService
      .listTemplates()
      .filter((template) => template.event === event.type);

    for (const template of templates) {
      this.createNotificationFromTemplate(template, event);
    }
  }

  private createNotificationFromTemplate(
    template: NotificationTemplate,
    event: PropertyOSEvent,
  ): void {
    const payload = event.payload as Record<string, unknown>;
    const recipient = this.resolveRecipient(template, payload);

    if (!recipient) {
      return;
    }

    this.notificationService.createNotification({
      channel: template.channel,
      recipient,
      subject: this.render(template.subject, payload),
      message: this.render(template.template, payload),
      metadata: {
        ...(template.metadata ?? {}),
        sourceEventId: event.id,
        sourceEventType: event.type,
        source: event.source,
        templateCode: template.code,
        orchestrationMode: 'template-event',
      },
    });
  }

  private resolveRecipient(
    template: NotificationTemplate,
    payload: Record<string, unknown>,
  ): string | undefined {
    const metadata = template.metadata ?? {};
    const recipientField = metadata.recipientField;

    if (typeof recipientField === 'string') {
      const value = payload[recipientField];
      return typeof value === 'string' ? value : undefined;
    }

    const fallbackFields = [
      'recipient',
      'recipientId',
      'hostPersonId',
      'visitorMobile',
      'mobile',
      'visitorId',
    ];

    for (const field of fallbackFields) {
      const value = payload[field];

      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return undefined;
  }

  private render(
    template: string | undefined,
    payload: Record<string, unknown>,
  ): string | undefined {
    if (!template) {
      return undefined;
    }

    return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key) => {
      const value = payload[key];

      if (value === undefined || value === null) {
        return '';
      }

      return String(value);
    });
  }
}
