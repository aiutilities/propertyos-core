export type AiProviderRuntimeFailureCode =
  | 'CONFIGURATION_INVALID'
  | 'PROVIDER_DISABLED'
  | 'BASE_URL_MISSING'
  | 'LIVE_EXECUTION_BLOCKED'
  | 'CREDENTIAL_UNAVAILABLE'
  | 'INVALID_PATH'
  | 'INVALID_CREDENTIAL_HEADERS';

export class AiProviderRuntimeError
  extends Error
{
  readonly providerName: string;

  readonly code:
    AiProviderRuntimeFailureCode;

  readonly retriable: boolean;

  constructor(options: {
    providerName: string;
    code: AiProviderRuntimeFailureCode;
    message: string;
    retriable?: boolean;
  }) {
    super(options.message);

    this.name =
      'AiProviderRuntimeError';

    this.providerName =
      options.providerName;

    this.code =
      options.code;

    this.retriable =
      options.retriable ??
      false;
  }
}
