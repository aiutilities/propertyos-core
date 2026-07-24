export interface PropertySpecialistAgentDescriptor {
  id: string;
  domain: string;
  priority: number;
  capabilities: readonly string[];
  enabled: boolean;
}

export interface PropertySpecialistRouteRequest {
  objective: string;
  requiredCapabilities: readonly string[];
  preferredAgentId?: string;
}

export interface PropertySpecialistRouteDecision {
  selectedAgentId: string;
  confidence: number;
  reason: string;
}
