export type AiAgentGovernanceDecision =
  | 'ALLOW'
  | 'REQUIRES_APPROVAL'
  | 'BLOCK';


export interface AiAgentGovernanceRequest {

  agentId: string;

  autonomyLevel:
    | 'ASSISTED'
    | 'SUPERVISED'
    | 'AUTONOMOUS';

  capabilityId: string;

  riskLevel:
    | 'LOW'
    | 'MEDIUM'
    | 'HIGH';

  confidence: number;
}


export interface AiAgentGovernanceResult {

  allowed: boolean;

  decision: AiAgentGovernanceDecision;

  reason: string;

  evidenceEvent: string;
}
