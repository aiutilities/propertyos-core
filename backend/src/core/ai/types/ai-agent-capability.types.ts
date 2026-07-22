export type AiCapabilityRiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH';


export interface AiAgentCapability {

  id: string;

  name: string;

  description: string;

  category: string;

  requiredPermissions: string[];

  riskLevel: AiCapabilityRiskLevel;

  enabled: boolean;

  version: string;
}
