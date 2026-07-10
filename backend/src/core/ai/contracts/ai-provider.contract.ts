import { AiCapability, AiProvider, AiRequest, AiResponse } from '../types/ai.types';

export interface AiProviderPort {
  readonly name: string;
  readonly displayName: string;
  readonly capabilities: AiCapability[];

  getProvider(): AiProvider;

  generate(request: AiRequest): Promise<AiResponse>;
}
