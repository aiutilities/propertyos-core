import { Module } from '@nestjs/common';
import { EnvironmentAiProviderCredentialResolverService } from './credentials/environment-ai-provider-credential-resolver.service';
import { AI_PROVIDER_CREDENTIAL_RESOLVER } from './contracts/ai-provider-credential-resolver.contract';
import { AiProviderRuntimeConfigurationService } from './configuration/ai-provider-runtime-configuration.service';
import { DiscoveryModule } from '@nestjs/core';
import { EventBusModule } from '../eventbus/eventbus.module';
import { AiController } from './controllers/ai.controller';
import { AiProviderDiscoveryService } from './discovery/ai-provider-discovery.service';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AiProviderRegistry } from './registry/ai-provider.registry';
import { AiProviderRegistrationBootstrapService } from './registration/ai-provider-registration-bootstrap.service';
import { AiProviderRegistrationService } from './registration/ai-provider-registration.service';
import { AiService } from './services/ai.service';
import { AiOrchestrationEvidenceService } from './services/ai-orchestration-evidence.service';
import { AiOrchestratorService } from './services/ai-orchestrator.service';
import { AiRoutingPolicyService } from './services/ai-routing-policy.service';

@Module({
  imports: [
    DiscoveryModule,
    EventBusModule,
  ],
  controllers: [
    AiController,
  ],
  providers: [
    EnvironmentAiProviderCredentialResolverService,
    {
      provide:
        AI_PROVIDER_CREDENTIAL_RESOLVER,
      useExisting:
        EnvironmentAiProviderCredentialResolverService,
    },
    AiProviderRuntimeConfigurationService,
    AiService,
    AiOrchestratorService,
    AiRoutingPolicyService,
    AiProviderRegistry,
    AiProviderDiscoveryService,
    AiProviderRegistrationService,
    AiProviderRegistrationBootstrapService,
    MockAiProvider,
    AiOrchestrationEvidenceService,
  ],
  exports: [
    EnvironmentAiProviderCredentialResolverService,
    AI_PROVIDER_CREDENTIAL_RESOLVER,
    AiProviderRuntimeConfigurationService,
    AiService,
    AiOrchestratorService,
    AiRoutingPolicyService,
    AiProviderRegistry,
    AiProviderDiscoveryService,
    AiProviderRegistrationService,
    AiOrchestrationEvidenceService,
  ],
})
export class AiModule {}
