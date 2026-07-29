import { CommunicationAttachment } from './attachment';
import { CommunicationChannel } from './channel';
import { FallbackPolicy, RetryPolicy } from './policy';
import { CommunicationRecipient } from './recipient';

export interface CommunicationRequest {
  id?: string;
  correlationId?: string;
  idempotencyKey?: string;

  templateKey: string;
  templateVersion?: string;

  recipient: CommunicationRecipient;
  channels: readonly CommunicationChannel[];
  variables?: Record<string, unknown>;
  attachments?: readonly CommunicationAttachment[];

  retryPolicy?: RetryPolicy;
  fallbackPolicy?: FallbackPolicy;

  scheduledAt?: string;
  expiresAt?: string;

  source: string;
  sourceEvent?: string;
  metadata?: Record<string, unknown>;
}
