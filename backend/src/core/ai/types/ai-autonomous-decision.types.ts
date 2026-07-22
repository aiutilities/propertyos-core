export type AiAutonomousDecisionMode =
  | 'EXECUTE'
  | 'REQUEST_APPROVAL'
  | 'BLOCK';


export interface AiAutonomousDecision {

  providerName: string;

  recommendation: string;

  confidence: number;

  mode: AiAutonomousDecisionMode;

  allowed: boolean;

  reason: string;

  auditRequired: boolean;

  rollbackRequired: boolean;
}
