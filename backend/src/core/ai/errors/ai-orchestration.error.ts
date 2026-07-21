export type AiOrchestrationFailureCode =
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_EXECUTION_FAILED'
  | 'TOKEN_BUDGET_EXCEEDED'
  | 'ALL_PROVIDERS_FAILED';

export interface AiOrchestrationFailureDetails {
  providerName?: string;
  attempt?: number;
  timeoutMs?: number;
  observedTotalTokens?: number;
  allowedTotalTokens?: number;
  failures?: Array<{
    providerName: string;
    code: AiOrchestrationFailureCode;
    message: string;
  }>;
}

export class AiOrchestrationError extends Error {
  readonly code: AiOrchestrationFailureCode;
  readonly retriable: boolean;
  readonly details: AiOrchestrationFailureDetails;

  constructor(options: {
    code: AiOrchestrationFailureCode;
    message: string;
    retriable: boolean;
    details?: AiOrchestrationFailureDetails;
  }) {
    super(options.message);
    this.name = 'AiOrchestrationError';
    this.code = options.code;
    this.retriable = options.retriable;
    this.details = options.details ?? {};
  }
}
