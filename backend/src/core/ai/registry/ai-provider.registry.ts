import { Injectable } from '@nestjs/common';
import { AiProviderPort } from '../contracts/ai-provider.contract';

@Injectable()
export class AiProviderRegistry {
  private readonly providers = new Map<string, AiProviderPort>();

  register(provider: AiProviderPort): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): AiProviderPort | undefined {
    return this.providers.get(name);
  }

  list(): AiProviderPort[] {
    return Array.from(this.providers.values());
  }

  getDefault(): AiProviderPort | undefined {
    return this.list()[0];
  }
}
