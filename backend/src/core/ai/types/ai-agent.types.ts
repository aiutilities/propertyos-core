export type AiAgentStatus =
  | 'ACTIVE'
  | 'INACTIVE';


export type AiAgentAutonomyLevel =
  | 'ASSISTED'
  | 'SUPERVISED'
  | 'AUTONOMOUS';


export interface AiAgentIdentity {

  id: string;

  name: string;

  description: string;

  capabilities: string[];

  permissions: string[];

  autonomyLevel: AiAgentAutonomyLevel;

  status: AiAgentStatus;

  governancePolicyId?: string;

  createdAt: string;
}
