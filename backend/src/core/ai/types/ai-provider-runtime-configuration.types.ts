export type AiProviderCredentialSource =
  'ENVIRONMENT';

export interface AiProviderCredentialReference {
  source: AiProviderCredentialSource;
  variableName: string;
}

export interface AiProviderRuntimeConfiguration {
  providerName: string;
  enabled: boolean;
  priority: number;
  defaultModel?: string;
  baseUrl?: string;
  timeoutMs: number;
  maxRetries: number;
  credential: AiProviderCredentialReference;
  liveExecutionAuthorized: boolean;
  metadata?: Record<string, unknown>;
}

export type AiProviderRuntimeConfigurationValidationCode =
  | 'EMPTY_PROVIDER_NAME'
  | 'DUPLICATE_PROVIDER_NAME'
  | 'INVALID_PRIORITY'
  | 'INVALID_TIMEOUT'
  | 'INVALID_MAX_RETRIES'
  | 'EMPTY_CREDENTIAL_VARIABLE'
  | 'INVALID_CREDENTIAL_VARIABLE'
  | 'INVALID_BASE_URL'
  | 'LIVE_EXECUTION_NOT_AUTHORIZED';

export interface AiProviderRuntimeConfigurationValidationError {
  providerName?: string;
  code: AiProviderRuntimeConfigurationValidationCode;
  message: string;
}

export interface AiProviderRuntimeConfigurationReport {
  valid: boolean;
  configurations: AiProviderRuntimeConfiguration[];
  errors: AiProviderRuntimeConfigurationValidationError[];
}
