export type AiProviderCapability =
  | 'TEXT'
  | 'REASONING'
  | 'CODING'
  | 'VISION'
  | 'TOOL_CALLING'
  | 'STRUCTURED_OUTPUT';

export type AiProviderAvailability =
  | 'AVAILABLE'
  | 'DEGRADED'
  | 'UNAVAILABLE';

export type AiProviderSelectionExclusionCode =
  | 'PROVIDER_DISABLED'
  | 'PROVIDER_UNAVAILABLE'
  | 'REQUIRED_CAPABILITY_MISSING'
  | 'LATENCY_LIMIT_EXCEEDED'
  | 'COST_LIMIT_EXCEEDED';

export interface AiProviderSelectionCandidate {
  providerName: string;
  model: string;
  enabled: boolean;
  availability:
    AiProviderAvailability;
  capabilities:
    readonly AiProviderCapability[];
  estimatedLatencyMs: number;
  estimatedCostPerMillionTokensUsd:
    number;
  priority: number;
}

export interface AiProviderSelectionRequest {
  requiredCapabilities:
    readonly AiProviderCapability[];
  maximumLatencyMs?: number;
  maximumCostPerMillionTokensUsd?:
    number;
  preferredProviders?:
    readonly string[];
  candidates:
    readonly AiProviderSelectionCandidate[];
}

export interface AiProviderSelectionScore {
  capabilityScore: number;
  availabilityScore: number;
  latencyScore: number;
  costScore: number;
  preferenceScore: number;
  priorityScore: number;
  totalScore: number;
}

export interface AiProviderSelectionEvaluation {
  providerName: string;
  model: string;
  eligible: boolean;
  exclusionCodes:
    AiProviderSelectionExclusionCode[];
  score:
    AiProviderSelectionScore;
}

export interface AiProviderSelectionResult {
  selectedProviderName: string;
  selectedModel: string;
  selectedScore: number;
  evaluations:
    AiProviderSelectionEvaluation[];
  selectedAt: string;
}
