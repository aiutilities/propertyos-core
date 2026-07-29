export interface CommunicationRetryPolicy {
  maximumAttempts: number;
  initialDelayMilliseconds: number;
  backoffMultiplier: number;
  maximumDelayMilliseconds?: number;
  retryableErrorCodes?: readonly string[];
}

export interface RetryEvaluationInput {
  attemptNumber: number;
  retryable?: boolean;
  errorCode?: string;
}

export interface RetryEvaluation {
  shouldRetry: boolean;
  nextAttemptNumber?: number;
  delayMilliseconds?: number;
  reason:
    | 'RETRY_ALLOWED'
    | 'PROVIDER_NOT_RETRYABLE'
    | 'ERROR_CODE_NOT_ALLOWED'
    | 'ATTEMPTS_EXHAUSTED';
}
