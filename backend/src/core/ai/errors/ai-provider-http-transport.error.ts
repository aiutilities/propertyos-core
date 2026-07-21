import {
  AiProviderHttpTransportFailureDetails,
} from '../types/ai-provider-http-transport.types';

export class AiProviderHttpTransportError
  extends Error
{
  readonly code:
    AiProviderHttpTransportFailureDetails['code'];

  readonly providerName: string;

  readonly retriable: boolean;

  readonly status?: number;

  readonly timeoutMs?: number;

  constructor(options: {
    message: string;
    details: AiProviderHttpTransportFailureDetails;
  }) {
    super(options.message);

    this.name =
      'AiProviderHttpTransportError';

    this.code =
      options.details.code;

    this.providerName =
      options.details.providerName;

    this.retriable =
      options.details.retriable;

    this.status =
      options.details.status;

    this.timeoutMs =
      options.details.timeoutMs;
  }
}
