import {
  CommunicationChannel,
} from '../contracts';

import {
  CommunicationRetryPolicy,
} from '../policies/retry-policy.types';

export interface DispatchCommunicationInput {
  communicationId: string;
  channel: CommunicationChannel;
  recipient: string;
  subject?: string;
  message: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;

  attemptNumber?: number;
  retryPolicy?: CommunicationRetryPolicy;
}

export interface DispatchCommunicationResult {
  communicationId: string;
  status:
    | 'SENT'
    | 'FAILED'
    | 'RETRY_SCHEDULED';

  providerName?: string;
  providerMessageId?: string;

  errorCode?: string;
  error?: string;

  nextAttemptNumber?: number;
  retryDelayMilliseconds?: number;

  metadata?: Record<string, unknown>;
}
