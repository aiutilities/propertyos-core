export interface AiRoutingSignal {
  providerName: string;

  capability?: string;

  reliabilityScore: number;

  confidence: number;

  recommendation:
    | 'PREFER'
    | 'ALLOW'
    | 'AVOID';

  reason: string;
}
