import {
  CommunicationProvider,
} from '../contracts';

export interface CommunicationProviderBootstrapContext {
  environment?: string;
  configuredProviders?: Record<
    string,
    string | undefined
  >;
}

export interface CommunicationProviderBootstrapResult {
  providers: readonly CommunicationProvider[];
  warnings?: readonly string[];
}

export interface CommunicationProviderBootstrap {
  resolveProviders(
    context: CommunicationProviderBootstrapContext,
  ): CommunicationProviderBootstrapResult;
}
