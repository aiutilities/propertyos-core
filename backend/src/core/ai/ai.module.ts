import { Module } from '@nestjs/common';
import { EventBusModule } from '../eventbus/eventbus.module';
import { AiController } from './controllers/ai.controller';
import { MockAiProvider } from './providers/mock-ai.provider';
import { AiProviderRegistry } from './registry/ai-provider.registry';
import { AiService } from './services/ai.service';

@Module({
  imports: [EventBusModule],
  controllers: [AiController],
  providers: [AiService, AiProviderRegistry, MockAiProvider],
  exports: [AiService, AiProviderRegistry],
})
export class AiModule {}
