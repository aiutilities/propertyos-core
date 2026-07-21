export type AiProviderFailoverFailureCode =
  | 'AI_PROVIDER_TIMEOUT'
  | 'AI_PROVIDER_RATE_LIMITED'
  | 'AI_PROVIDER_OUTAGE'
  | 'AI_PROVIDER_MALFORMED_RESPONSE'
  | 'AI_PROVIDER_NON_RETRYABLE_FAILURE'
  | 'AI_PROVIDER_UNKNOWN_FAILURE';

export type AiProviderFailoverAttemptOutcome =
  | 'SUCCEEDED'
  | 'FAILED';

export interface AiProviderFailoverCandidate {
  providerName: string;
  model: string;
}

export interface AiProviderFailoverRequest<TResponse> {
  candidates:
    readonly AiProviderFailoverCandidate[];
  maximumAttemptsPerProvider?: number;
  retryDelayMs?: number;
  retryableFailureCodes?:
    readonly AiProviderFailoverFailureCode[];
  execute: (
    candidate:
      AiProviderFailoverCandidate,
    context:
      AiProviderFailoverExecutionContext,
  ) => Promise<TResponse>;
}

export interface AiProviderFailoverExecutionContext {
  providerIndex: number;
  attemptNumber: number;
  globalAttemptNumber: number;
}

export interface AiProviderFailoverAttemptEvidence {
  providerName: string;
  model: string;
  providerIndex: number;
  attemptNumber: number;
  globalAttemptNumber: number;
  outcome:
    AiProviderFailoverAttemptOutcome;
  failureCode?:
    AiProviderFailoverFailureCode;
  retryable?: boolean;
  startedAt: string;
  completedAt: string;
}

export interface AiProviderFailoverEvidence {
  attempts:
    AiProviderFailoverAttemptEvidence[];
  providersAttempted: string[];
  totalAttempts: number;
  failoverCount: number;
  successfulProviderName?: string;
  exhausted: boolean;
}

export interface AiProviderFailoverSuccess<TResponse> {
  providerName: string;
  model: string;
  response: TResponse;
  evidence:
    AiProviderFailoverEvidence;
}
