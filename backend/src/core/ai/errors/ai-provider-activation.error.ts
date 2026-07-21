import {
  AiProviderActivationDenialCode,
  AiProviderActivationEvaluation,
} from '../types/ai-provider-activation.types';

export class AiProviderActivationError
  extends Error
{
  readonly code =
    'AI_PROVIDER_ACTIVATION_DENIED';

  readonly providerName:
    string;

  readonly denialCodes:
    readonly AiProviderActivationDenialCode[];

  readonly evaluation:
    AiProviderActivationEvaluation;

  constructor(
    evaluation:
      AiProviderActivationEvaluation,
  ) {
    super(
      [
        `AI provider activation denied for ${evaluation.providerName}`,
        evaluation.denialCodes.join(', '),
      ].join(': '),
    );

    this.name =
      'AiProviderActivationError';

    this.providerName =
      evaluation.providerName;

    this.denialCodes = [
      ...evaluation.denialCodes,
    ];

    this.evaluation = {
      ...evaluation,
      denialCodes: [
        ...evaluation.denialCodes,
      ],
    };
  }
}
