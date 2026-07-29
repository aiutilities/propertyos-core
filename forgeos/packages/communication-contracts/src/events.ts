import { CommunicationChannel } from './channel';
import { DeliveryStatus } from './status';

export const COMMUNICATION_EVENTS = {
  REQUESTED: 'communication.requested',
  QUEUED: 'communication.queued',
  ATTEMPTED: 'communication.attempted',
  SENT: 'communication.sent',
  DELIVERED: 'communication.delivered',
  READ: 'communication.read',
  FAILED: 'communication.failed',
  RETRY_SCHEDULED: 'communication.retry_scheduled',
  COMPLETED: 'communication.completed',
} as const;

export type CommunicationEventName =
  (typeof COMMUNICATION_EVENTS)[keyof typeof COMMUNICATION_EVENTS];

export interface CommunicationEventPayload {
  communicationId: string;
  correlationId?: string;
  attemptId?: string;
  channel?: CommunicationChannel;
  providerName?: string;
  providerMessageId?: string;
  status: DeliveryStatus;
  occurredAt: string;
  source: string;
  metadata?: Record<string, unknown>;
}
