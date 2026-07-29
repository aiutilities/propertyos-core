import {
  CommunicationChannel,
} from '../contracts';

import {
  DispatchCommunicationInput,
  DispatchCommunicationResult,
} from '../dispatcher/communication-dispatcher.types';

export interface CommunicationFallbackPolicy {
  enabled: boolean;
  channelOrder:
    readonly CommunicationChannel[];
  continueOnFailure: boolean;
  stopAfterFirstSuccess: boolean;
}

export interface DispatchWithFallbackInput
  extends Omit<
    DispatchCommunicationInput,
    'channel'
  > {
  primaryChannel:
    CommunicationChannel;

  fallbackPolicy:
    CommunicationFallbackPolicy;
}

export interface CommunicationFallbackAttempt {
  channel:
    CommunicationChannel;

  result:
    DispatchCommunicationResult;
}

export interface DispatchWithFallbackResult {
  communicationId: string;

  status:
    | 'SENT'
    | 'FAILED'
    | 'RETRY_SCHEDULED';

  successfulChannel?:
    CommunicationChannel;

  attempts:
    readonly CommunicationFallbackAttempt[];

  terminalResult:
    DispatchCommunicationResult;
}
