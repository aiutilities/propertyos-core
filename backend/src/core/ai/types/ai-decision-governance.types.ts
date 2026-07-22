export type AiDecisionApprovalMode =
  | 'AUTONOMOUS'
  | 'APPROVAL_REQUIRED'
  | 'BLOCKED';


export interface AiDecisionGovernancePolicy {

  tenantId: string;

  minimumConfidence: number;

  allowedRecommendations: string[];

  approvalMode: AiDecisionApprovalMode;

  auditRequired: boolean;

  rollbackRequired: boolean;
}
