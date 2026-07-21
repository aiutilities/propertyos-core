import {
  AiProviderCredentialReference,
} from '../types/ai-provider-runtime-configuration.types';
import {
  AiProviderCredentialResolutionResult,
} from '../types/ai-provider-credential.types';

export const AI_PROVIDER_CREDENTIAL_RESOLVER =
  Symbol(
    'AI_PROVIDER_CREDENTIAL_RESOLVER',
  );

export interface AiProviderCredentialResolver {
  resolve(options: {
    providerName: string;
    reference: AiProviderCredentialReference;
  }): AiProviderCredentialResolutionResult;

  assertResolved(options: {
    providerName: string;
    reference: AiProviderCredentialReference;
  }): AiProviderCredentialResolutionResult;
}
