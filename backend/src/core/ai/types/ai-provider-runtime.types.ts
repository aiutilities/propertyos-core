import {
  AiProviderHttpMethod,
  AiProviderHttpResponse,
} from './ai-provider-http-transport.types';
import {
  AiProviderRuntimeConfiguration,
} from './ai-provider-runtime-configuration.types';

export interface AiProviderPreparedRuntime {
  providerName: string;
  configuration: AiProviderRuntimeConfiguration;
  credential: {
    value: string;
    source:
      AiProviderRuntimeConfiguration[
        'credential'
      ]['source'];
    variableName: string;
  };
}

export interface AiProviderRuntimeExecutionRequest {
  configuration:
    AiProviderRuntimeConfiguration;
  path: string;
  method: AiProviderHttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  createCredentialHeaders: (
    credential: string,
  ) => Record<string, string>;
}

export interface AiProviderRuntimeExecutionResult<
  T = unknown,
> {
  providerName: string;
  model?: string;
  attempt: number;
  response: AiProviderHttpResponse<T>;
}
