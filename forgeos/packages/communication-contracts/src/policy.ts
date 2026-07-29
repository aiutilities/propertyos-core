import { CommunicationChannel } from './channel';

export interface RetryPolicy {
  maximumAttempts: number;
  initialDelayMilliseconds: number;
  backoffMultiplier: number;
  maximumDelayMilliseconds?: number;
  retryableErrorCodes?: readonly string[];
}

export interface FallbackPolicy {
  enabled: boolean;
  channelOrder: readonly CommunicationChannel[];
  continueOnProviderFailure: boolean;
  stopAfterFirstSuccess: boolean;
}
