export type AiRecoveryExecutionStatus =
  | 'REQUESTED'
  | 'STARTED'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'STOPPED';

export type AiRecoveryExecutionAction =
  | 'RETRY'
  | 'FALLBACK_PROVIDER'
  | 'REDUCE_CONTEXT'
  | 'REQUEST_PERMISSION'
  | 'STOP';

export interface AiRecoveryExecutionRequest {
  correlationId: string;
  tenantId: string;
  action: AiRecoveryExecutionAction;
  attemptNumber: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface AiRecoveryExecutionResult {
  status: AiRecoveryExecutionStatus;
  action: AiRecoveryExecutionAction;
  correlationId: string;
  attemptNumber: number;
  message: string;
}
