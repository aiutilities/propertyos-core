import {
  AiProviderRuntimeConfiguration,
} from './ai-provider-runtime-configuration.types';

export type AiDeploymentEnvironment =
  | 'development'
  | 'test'
  | 'staging'
  | 'production';

export type AiProviderActivationDenialCode =
  | 'GLOBAL_AI_DISABLED'
  | 'ENVIRONMENT_NOT_ALLOWED'
  | 'PROVIDER_NOT_ALLOWED'
  | 'PROVIDER_RUNTIME_DISABLED'
  | 'LIVE_EXECUTION_NOT_AUTHORIZED';

export interface AiProviderActivationPolicy {
  globalEnabled: boolean;
  environment: AiDeploymentEnvironment;
  allowedEnvironments:
    readonly AiDeploymentEnvironment[];
  allowedProviders:
    readonly string[];
}

export interface AiProviderActivationEvaluation {
  providerName: string;
  environment: AiDeploymentEnvironment;
  authorized: boolean;
  denialCodes:
    AiProviderActivationDenialCode[];
  evaluatedAt:
    string;
}

export interface AiProviderActivationInput {
  configuration:
    AiProviderRuntimeConfiguration;
  policy:
    AiProviderActivationPolicy;
}
