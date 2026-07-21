import { AiProviderManifest } from '../manifest/ai-provider-manifest';
import {
  AiCapability,
  AiProvider,
  AiRequest,
  AiResponse,
} from '../types/ai.types';

export interface AiProviderPort {
  readonly name: string;
  readonly displayName: string;
  readonly capabilities: AiCapability[];
  readonly manifest: AiProviderManifest;

  getProvider(): AiProvider;

  generate(request: AiRequest): Promise<AiResponse>;
}
