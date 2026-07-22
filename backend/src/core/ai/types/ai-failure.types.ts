export type AiFailureCategory =
  | 'PROVIDER'
  | 'TRANSPORT'
  | 'TIMEOUT'
  | 'AUTHORIZATION'
  | 'RATE_LIMIT'
  | 'BUDGET'
  | 'TOOL'
  | 'VALIDATION'
  | 'UNKNOWN';

export type AiFailureSeverity =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'CRITICAL';

export type AiFailureRecoveryAction =
  | 'RETRY'
  | 'FALLBACK_PROVIDER'
  | 'REDUCE_CONTEXT'
  | 'CHECK_CONFIGURATION'
  | 'REQUEST_PERMISSION'
  | 'FIX_INPUT'
  | 'NONE';

export interface AiFailureClassification {
  category: AiFailureCategory;
  severity: AiFailureSeverity;
  recoveryAction: AiFailureRecoveryAction;
  retriable: boolean;
  code: string;
}
