import { AiMessage } from '../types/ai.types';

export class GenerateAiResponseDto {
  providerName?: string;
  model?: string;
  messages!: AiMessage[];
  temperature?: number;
  maxTokens?: number;
  metadata?: Record<string, unknown>;
}
