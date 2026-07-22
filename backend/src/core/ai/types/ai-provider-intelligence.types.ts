export type AiProviderRecommendation =
  | 'PRIMARY'
  | 'SECONDARY'
  | 'AVOID';


export interface AiProviderIntelligenceProfile {

  providerName: string;

  reliabilityScore: number;

  performanceScore: number;

  overallScore: number;

  confidence: number;

  recommendation: AiProviderRecommendation;
}
