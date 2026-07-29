import {
  DispatchCommunicationInput,
} from '../dispatcher/communication-dispatcher.types';

export interface ScheduleCommunicationRetryInput {
  communication: DispatchCommunicationInput;
  nextAttemptNumber: number;
  delayMilliseconds: number;
  providerName: string;
  errorCode?: string;
  errorMessage: string;
  metadata?: Record<string, unknown>;
}

export interface CommunicationRetryScheduler {
  scheduleRetry(
    input: ScheduleCommunicationRetryInput,
  ): Promise<void>;
}

export class NoopCommunicationRetryScheduler
  implements CommunicationRetryScheduler
{
  async scheduleRetry(
    _input: ScheduleCommunicationRetryInput,
  ): Promise<void> {
    return;
  }
}
