export interface AiProviderPerformanceProfile {
  providerName: string;

  totalExecutions: number;

  averageLatencyMs: number;

  averageTokens: number;

  estimatedCost: number;

  reliabilityScore: number;

  performanceScore: number;
}
