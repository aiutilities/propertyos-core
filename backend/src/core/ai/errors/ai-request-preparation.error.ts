export type AiRequestPreparationErrorCode =
  | 'AI_REQUEST_PROVIDER_REQUIRED'
  | 'AI_REQUEST_MODEL_REQUIRED'
  | 'AI_REQUEST_MESSAGES_REQUIRED'
  | 'AI_REQUEST_INVALID_MESSAGE'
  | 'AI_REQUEST_INVALID_TEMPERATURE'
  | 'AI_REQUEST_INVALID_TOP_P'
  | 'AI_REQUEST_INVALID_MAX_OUTPUT_TOKENS'
  | 'AI_REQUEST_INVALID_STOP_SEQUENCE'
  | 'AI_REQUEST_INVALID_PREPARED_AT';

export class AiRequestPreparationError extends Error {
  constructor(
    public readonly code: AiRequestPreparationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AiRequestPreparationError';
    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}
