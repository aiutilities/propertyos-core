import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  NotificationChannel,
  NotificationMessage,
} from '../types/notification.types';

@Injectable()
export class NotificationService {
  private readonly messages: NotificationMessage[] = [];

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

  listNotifications(): NotificationMessage[] {
    return [...this.messages];
  }
}
