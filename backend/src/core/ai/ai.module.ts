import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { AiController } from './controllers/ai.controller';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AiProviderRegistry } from './registry/ai-provider.registry';
import { AiService } from './services/ai.service';
import { AiOrchestratorService } from './services/ai-orchestrator.service';
import { AiRoutingPolicyService } from './services/ai-routing-policy.service';

@Module({
  imports: [EventBusModule],
  controllers: [AiController],
  providers: [
    AiService,
    AiOrchestratorService,
    AiRoutingPolicyService,
    AiProviderRegistry,
    MockAiProvider,
  ],
  exports: [
    AiService,
    AiOrchestratorService,
    AiRoutingPolicyService,
    AiProviderRegistry,
  ],
})
export class AiModule {}
