import {
  CommunicationChannel,
} from '../contracts';

export interface DispatchCommunicationInput {
  communicationId: string;
  channel: CommunicationChannel;
  recipient: string;
  subject?: string;
  message: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
}

export interface DispatchCommunicationResult {
  communicationId: string;
  status: 'SENT' | 'FAILED';
  providerName?: string;
  providerMessageId?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}
