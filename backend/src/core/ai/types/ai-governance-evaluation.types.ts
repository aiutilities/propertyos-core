import {
  AiDecisionApprovalMode,
} from './ai-decision-governance.types';


export interface AiGovernanceEvaluation {

  allowed: boolean;

  mode: AiDecisionApprovalMode;

  reason: string;

  auditRequired: boolean;

  rollbackRequired: boolean;
}
