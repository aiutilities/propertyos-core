export type NotificationChannel =
  | 'EMAIL'
  | 'SMS'
  | 'WHATSAPP'
  | 'PUSH'
  | 'IN_APP';

export type NotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'FAILED';

export interface NotificationMessage {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  message: string;
  status: NotificationStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
}
