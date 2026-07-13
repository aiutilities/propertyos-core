import {
  NotificationChannel,
  NotificationMessage,
} from '../types/notification.types';

export interface NotificationDeliveryResult {
  success: boolean;
  providerName: string;
  providerMessageId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationProvider {
  readonly name: string;
  readonly channel: NotificationChannel;

  send(
    notification: NotificationMessage,
  ): Promise<NotificationDeliveryResult>;
}
