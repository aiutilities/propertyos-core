import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  NotificationChannel,
  NotificationMessage,
} from '../types/notification.types';

export type NotificationTemplate = {
  code: string;
  event: string;
  channel: NotificationChannel;
  subject?: string;
  template: string;
  metadata?: Record<string, unknown>;
};

@Injectable()
export class NotificationService {
  private readonly messages: NotificationMessage[] = [];
  private readonly templates = new Map<string, NotificationTemplate>();

  createNotification(input: {
    channel: NotificationChannel;
    recipient: string;
    subject?: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): NotificationMessage {
    const notification: NotificationMessage = {
      id: randomUUID(),
      channel: input.channel,
      recipient: input.recipient,
      subject: input.subject,
      message: input.message,
      status: 'PENDING',
      metadata: input.metadata ?? {},
      createdAt: new Date(),
    };

    this.messages.push(notification);
    return notification;
  }

  registerTemplate(template: NotificationTemplate): void {
    this.templates.set(template.code, template);
  }

  registerTemplates(templates: NotificationTemplate[]): void {
    for (const template of templates) {
      this.registerTemplate(template);
    }
  }

  listTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  listNotifications(): NotificationMessage[] {
    return [...this.messages];
  }
}
