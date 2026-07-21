import {
  AiProviderFailoverEvidence,
} from '../types/ai-provider-failover.types';

export class AiProviderFailoverError
  extends Error
{
  readonly code =
    'AI_PROVIDER_FAILOVER_EXHAUSTED';

  readonly evidence:
    AiProviderFailoverEvidence;

  constructor(
    evidence:
      AiProviderFailoverEvidence,
  ) {
    super(
      'All eligible AI provider attempts were exhausted',
    );

    this.name =
      'AiProviderFailoverError';

    this.evidence = {
      ...evidence,
      attempts:
        evidence.attempts.map(
          attempt => ({
            ...attempt,
          }),
        ),
      providersAttempted: [
        ...evidence.providersAttempted,
      ],
    };
  }
}
