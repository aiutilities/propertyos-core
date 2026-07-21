export type AnthropicMessagesProtocolFailureCode =
  | 'MODEL_REQUIRED'
  | 'MESSAGES_REQUIRED'
  | 'INVALID_MESSAGE'
  | 'UNSUPPORTED_MESSAGE_ROLE'
  | 'CONVERSATION_REQUIRED'
  | 'INVALID_TEMPERATURE'
  | 'INVALID_MAX_TOKENS'
  | 'INVALID_ANTHROPIC_VERSION'
  | 'INVALID_RESPONSE'
  | 'EMPTY_RESPONSE_CONTENT';

export class AnthropicMessagesProtocolError
  extends Error
{
  readonly providerName: string;

  readonly code:
    AnthropicMessagesProtocolFailureCode;

  readonly retriable: boolean;

  constructor(options: {
    providerName: string;
    code:
      AnthropicMessagesProtocolFailureCode;
    message: string;
    retriable?: boolean;
  }) {
    super(options.message);

    this.name =
      'AnthropicMessagesProtocolError';

    this.providerName =
      options.providerName;

    this.code =
      options.code;

    this.retriable =
      options.retriable ??
      false;
  }
}
