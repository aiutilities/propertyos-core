export type AiPreparedRequestDispatchErrorCode =
  | 'AI_DISPATCH_REQUEST_REQUIRED'
  | 'AI_DISPATCH_TARGET_REQUIRED'
  | 'AI_DISPATCH_PROVIDER_REQUIRED'
  | 'AI_DISPATCH_RUNTIME_PROVIDER_REQUIRED'
  | 'AI_DISPATCH_PROTOCOL_REQUIRED'
  | 'AI_DISPATCH_UNSUPPORTED_PROTOCOL'
  | 'AI_DISPATCH_PROVIDER_MISMATCH'
  | 'AI_DISPATCH_MODEL_MISMATCH'
  | 'AI_DISPATCH_TARGET_DISABLED'
  | 'AI_DISPATCH_INVALID_TIMESTAMP'
  | 'AI_DISPATCH_INVALID_ID';

export class AiPreparedRequestDispatchError extends Error {
  constructor(
    public readonly code: AiPreparedRequestDispatchErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AiPreparedRequestDispatchError';

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}
