export type AiRecoveryOutcomeStatus =
  | 'STARTED'
  | 'SUCCEEDED'
  | 'FAILED';

export interface AiRecoveryOutcome {
  correlationId: string;

  tenantId: string;

  capability?: string;

  providerName?: string;

  model?: string;

  failureCode?: string;

  recoveryDecision: string;

  status: AiRecoveryOutcomeStatus;

  attemptNumber: number;

  latencyMs?: number;

  inputTokens?: number;

  outputTokens?: number;

  totalTokens?: number;

  metadata?: Record<string, unknown>;

  recordedAt: string;
}
