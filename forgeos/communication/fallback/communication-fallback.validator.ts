import {
  CommunicationFallbackPolicy,
} from './communication-fallback.types';

export interface CommunicationFallbackPolicyValidation {
  status:
    | 'READY'
    | 'BLOCKED';

  errors:
    readonly string[];
}

export function validateCommunicationFallbackPolicy(
  policy:
    CommunicationFallbackPolicy,
): CommunicationFallbackPolicyValidation {
  const errors: string[] = [];

  if (
    policy.enabled &&
    policy.channelOrder.length === 0
  ) {
    errors.push(
      'Fallback channel order must contain at least one channel',
    );
  }

  const uniqueChannels =
    new Set(policy.channelOrder);

  if (
    uniqueChannels.size !==
    policy.channelOrder.length
  ) {
    errors.push(
      'Fallback channel order must not contain duplicates',
    );
  }

  if (
    policy.enabled &&
    !policy.continueOnFailure &&
    !policy.stopAfterFirstSuccess
  ) {
    errors.push(
      'Fallback policy must either continue on failure or stop after success',
    );
  }

  return {
    status:
      errors.length === 0
        ? 'READY'
        : 'BLOCKED',
    errors,
  };
}
