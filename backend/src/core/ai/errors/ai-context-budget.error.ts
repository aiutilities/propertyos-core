export type AiContextBudgetErrorCode =
  | 'AI_CONTEXT_INVALID_MODEL_PROFILE'
  | 'AI_CONTEXT_INVALID_BUDGET'
  | 'AI_CONTEXT_EMPTY_MESSAGES'
  | 'AI_CONTEXT_MANDATORY_CONTENT_EXCEEDS_BUDGET';

export class AiContextBudgetError
  extends Error
{
  constructor(
    readonly code:
      AiContextBudgetErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      'AiContextBudgetError';
  }
}
