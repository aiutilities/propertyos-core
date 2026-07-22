export type AiRecoveryDecision =
  | 'RETRY'
  | 'FALLBACK_PROVIDER'
  | 'REDUCE_CONTEXT'
  | 'REQUEST_PERMISSION'
  | 'STOP';

export interface AiRecoveryPlan {
  decision: AiRecoveryDecision;
  allowed: boolean;
  reason: string;
}
