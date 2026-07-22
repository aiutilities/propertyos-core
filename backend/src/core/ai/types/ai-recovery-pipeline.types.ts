export interface AiRecoveryPipelineInput {
  failureCode: string;
  retriable: boolean;
  attemptsUsed: number;
  maxAttempts: number;
  correlationId: string;
  tenantId: string;
}

export interface AiRecoveryPipelineResult {
  success: boolean;
  decision: string;
  executionStatus: string;
  reason: string;
}
