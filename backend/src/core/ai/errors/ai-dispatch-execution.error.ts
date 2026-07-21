export type AiDispatchExecutionErrorCode =
  | 'AI_DISPATCH_EXECUTION_INPUT_REQUIRED'
  | 'AI_DISPATCH_EXECUTION_ENVELOPE_REQUIRED'
  | 'AI_DISPATCH_EXECUTION_INVALID_ID'
  | 'AI_DISPATCH_EXECUTION_INVALID_TIMESTAMP'
  | 'AI_DISPATCH_EXECUTION_PROVIDER_NOT_FOUND'
  | 'AI_DISPATCH_EXECUTION_PROVIDER_MISMATCH'
  | 'AI_DISPATCH_EXECUTION_MODEL_MISMATCH'
  | 'AI_DISPATCH_EXECUTION_PROVIDER_FAILED'
  | 'AI_DISPATCH_EXECUTION_INVALID_CONTEXT'
  | 'AI_DISPATCH_EXECUTION_CONTEXT_MISMATCH';

export interface AiDispatchExecutionErrorDetails {
  executionId?: string;
  dispatchId?: string;
  requestId?: string;
  contextRequestId?: string;
  provider?: string;
  model?: string;
  causeName?: string;
  causeMessage?: string;
}

export class AiDispatchExecutionError
  extends Error {
  constructor(
    public readonly code:
      AiDispatchExecutionErrorCode,
    message: string,
    public readonly details:
      AiDispatchExecutionErrorDetails =
        {},
  ) {
    super(message);

    this.name =
      'AiDispatchExecutionError';

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}
