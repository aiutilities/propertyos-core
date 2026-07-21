import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { EventBusModule } from '../eventbus/eventbus.module';
import { AiController } from './controllers/ai.controller';
import { AiProviderDiscoveryService } from './discovery/ai-provider-discovery.service';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AiProviderRegistry } from './registry/ai-provider.registry';
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
    AiService,
    AiOrchestratorService,
    AiRoutingPolicyService,
    AiProviderRegistry,
    AiProviderDiscoveryService,
    MockAiProvider,
    AiOrchestrationEvidenceService,
  ],
  exports: [
    AiService,
    AiOrchestratorService,
    AiRoutingPolicyService,
    AiProviderRegistry,
    AiProviderDiscoveryService,
    AiOrchestrationEvidenceService,
  ],
})
export class AiModule {}
