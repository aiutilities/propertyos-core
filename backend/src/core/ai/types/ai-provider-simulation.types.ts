export type AiProviderSimulationScenario =
  | 'SUCCESS'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'MALFORMED_RESPONSE'
  | 'PROVIDER_OUTAGE';

export type AiProviderSimulationFailureCode =
  | 'AI_PROVIDER_SIMULATED_TIMEOUT'
  | 'AI_PROVIDER_SIMULATED_RATE_LIMIT'
  | 'AI_PROVIDER_SIMULATED_MALFORMED_RESPONSE'
  | 'AI_PROVIDER_SIMULATED_OUTAGE';

export interface AiProviderSimulationRequest {
  providerName: string;
  model: string;
  prompt: string;
  scenario:
    AiProviderSimulationScenario;
  latencyMs?: number;
  responseText?: string;
}

export interface AiProviderSimulationEvidence {
  simulationId: string;
  providerName: string;
  model: string;
  scenario:
    AiProviderSimulationScenario;
  promptLength: number;
  latencyMs: number;
  startedAt: string;
  completedAt: string;
  outcome:
    'SUCCEEDED' | 'FAILED';
  failureCode?:
    AiProviderSimulationFailureCode;
}

export interface AiProviderSimulationSuccess {
  simulationId: string;
  providerName: string;
  model: string;
  text: string;
  simulated: true;
  evidence:
    AiProviderSimulationEvidence;
}
