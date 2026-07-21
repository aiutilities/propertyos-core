import {
  AiProviderSelectionEvaluation,
} from '../types/ai-provider-selection.types';

export class AiProviderSelectionError
  extends Error
{
  readonly code =
    'AI_PROVIDER_SELECTION_FAILED';

  readonly evaluations:
    readonly AiProviderSelectionEvaluation[];

  constructor(
    evaluations:
      readonly AiProviderSelectionEvaluation[],
  ) {
    super(
      'No eligible AI provider candidate was available',
    );

    this.name =
      'AiProviderSelectionError';

    this.evaluations =
      evaluations.map(
        evaluation => ({
          ...evaluation,
          exclusionCodes: [
            ...evaluation.exclusionCodes,
          ],
          score: {
            ...evaluation.score,
          },
        }),
      );
  }
}
