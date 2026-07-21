import { Injectable } from '@nestjs/common';
import { EventBusService } from '../../eventbus/services/eventbus.service';
import { GenerateAiResponseDto } from '../dto/generate-ai-response.dto';
import { AiProviderRegistry } from '../registry/ai-provider.registry';
import { AiProvider, AiResponse } from '../types/ai.types';

@Injectable()
export class AiService {
  private readonly eventSource = 'core.ai';

  constructor(
    private readonly registry: AiProviderRegistry,
    private readonly eventBus: EventBusService,
  ) {}

  listProviders(): AiProvider[] {
    return this.registry.list().map((provider) => provider.getProvider());
  }

  async generate(dto: GenerateAiResponseDto): Promise<AiResponse> {
    const provider = dto.providerName
      ? this.registry.get(dto.providerName)
      : this.registry.getDefault();

    if (!provider) {
      throw new Error(`AI provider not found: ${dto.providerName ?? 'default'}`);
    }

    await this.eventBus.publish('ai.requested', this.eventSource, {
      providerName: provider.name,
      model: dto.model,
      metadata: dto.metadata ?? {},
    });

    const response = await provider.generate(dto);

    await this.eventBus.publish('ai.responded', this.eventSource, {
      providerName: response.providerName,
      model: response.model,
      usage: response.usage,
    });

    return response;
  }
}
