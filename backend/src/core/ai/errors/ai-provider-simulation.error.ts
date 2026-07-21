import {
  AiProviderSimulationEvidence,
  AiProviderSimulationFailureCode,
} from '../types/ai-provider-simulation.types';

export class AiProviderSimulationError
  extends Error
{
  readonly code:
    AiProviderSimulationFailureCode;

  readonly providerName:
    string;

  readonly simulationId:
    string;

  readonly evidence:
    AiProviderSimulationEvidence;

  constructor(
    code:
      AiProviderSimulationFailureCode,
    message:
      string,
    evidence:
      AiProviderSimulationEvidence,
  ) {
    super(
      message,
    );

    this.name =
      'AiProviderSimulationError';

    this.code =
      code;

    this.providerName =
      evidence.providerName;

    this.simulationId =
      evidence.simulationId;

    this.evidence = {
      ...evidence,
    };
  }
}
