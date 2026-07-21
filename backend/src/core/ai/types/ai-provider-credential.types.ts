import {
  AiProviderCredentialReference,
} from './ai-provider-runtime-configuration.types';

export type AiProviderCredentialResolutionStatus =
  | 'RESOLVED'
  | 'MISSING'
  | 'BLANK';

export interface AiProviderResolvedCredential {
  providerName: string;
  value: string;
  source: AiProviderCredentialReference['source'];
  variableName: string;
}

export interface AiProviderCredentialResolutionReport {
  providerName: string;
  source: AiProviderCredentialReference['source'];
  variableName: string;
  status: AiProviderCredentialResolutionStatus;
  present: boolean;
  maskedValue?: string;
}

export interface AiProviderCredentialResolutionResult {
  credential?: AiProviderResolvedCredential;
  report: AiProviderCredentialResolutionReport;
}
