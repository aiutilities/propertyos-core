export type OpenAiCompatibleProtocolFailureCode =
  | 'MODEL_REQUIRED'
  | 'MESSAGES_REQUIRED'
  | 'INVALID_MESSAGE'
  | 'INVALID_TEMPERATURE'
  | 'INVALID_MAX_TOKENS'
  | 'INVALID_RESPONSE'
  | 'EMPTY_RESPONSE_CONTENT';

export class OpenAiCompatibleProtocolError
  extends Error
{
  readonly providerName: string;

  readonly code:
    OpenAiCompatibleProtocolFailureCode;

  readonly retriable: boolean;

  constructor(options: {
    providerName: string;
    code:
      OpenAiCompatibleProtocolFailureCode;
    message: string;
    retriable?: boolean;
  }) {
    super(options.message);

    this.name =
      'OpenAiCompatibleProtocolError';

    this.providerName =
      options.providerName;

    this.code =
      options.code;

    this.retriable =
      options.retriable ??
      false;
  }
}
