export type AiConversationSessionErrorCode =
  | 'AI_CONVERSATION_SESSION_NOT_FOUND'
  | 'AI_CONVERSATION_SESSION_VERSION_CONFLICT'
  | 'AI_CONVERSATION_SESSION_ARCHIVED'
  | 'AI_CONVERSATION_SESSION_LIMIT_EXCEEDED'
  | 'AI_CONVERSATION_MESSAGE_TOO_LARGE'
  | 'AI_CONVERSATION_TENANT_MISMATCH';

export class AiConversationSessionError
  extends Error
{
  constructor(
    readonly code:
      AiConversationSessionErrorCode,
    message:
      string,
  ) {
    super(
      message,
    );

    this.name =
      'AiConversationSessionError';
  }
}
