export type AiGovernanceDecisionStatus =
  | 'APPROVED'
  | 'REQUIRES_APPROVAL'
  | 'BLOCKED';


export interface AiGovernanceEvidence {

  correlationId: string;

  tenantId: string;

  providerName: string;

  recommendation: string;

  confidence: number;

  status: AiGovernanceDecisionStatus;

  reason: string;

  auditRequired: boolean;

  rollbackRequired: boolean;

  recordedAt: string;
}
