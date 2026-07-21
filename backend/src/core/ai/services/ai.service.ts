import { Injectable } from '@nestjs/common';
import { AiProviderRegistry } from '../registry/ai-provider.registry';
import { AiProvider } from '../types/ai.types';

@Injectable()
export class AiService {
  constructor(
    private readonly registry: AiProviderRegistry,
  ) {}

  listProviders(): AiProvider[] {
    return this.registry
      .list()
      .map(
        provider =>
          provider.getProvider(),
      );
  }
}
