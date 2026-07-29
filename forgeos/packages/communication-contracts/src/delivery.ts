import { CommunicationChannel } from './channel';
import { DeliveryStatus } from './status';

export interface CommunicationDeliveryAttempt {
  id: string;
  communicationId: string;
  channel: CommunicationChannel;
  providerName: string;
  attemptNumber: number;
  status: DeliveryStatus;
  providerMessageId?: string;
  errorCode?: string;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface CommunicationDeliveryResult {
  communicationId: string;
  status: DeliveryStatus;
  successfulChannel?: CommunicationChannel;
  attempts: readonly CommunicationDeliveryAttempt[];
  completedAt?: string;
  metadata?: Record<string, unknown>;
}
