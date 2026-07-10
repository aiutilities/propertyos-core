import { Injectable } from '@nestjs/common';
import { AiProviderPort } from '../contracts/ai-provider.contract';
import { AiCapability, AiProvider, AiRequest, AiResponse } from '../types/ai.types';

@Injectable()
export class MockAiProvider implements AiProviderPort {
  readonly name = 'mock';
  readonly displayName = 'Mock AI Provider';
  readonly capabilities: AiCapability[] = [
    'CHAT',
    'TEXT_GENERATION',
    'CLASSIFICATION',
    'SUMMARIZATION',
    'EXTRACTION',
  ];

  getProvider(): AiProvider {
    return {
      id: this.name,
      name: this.name,
      displayName: this.displayName,
      status: 'ACTIVE',
      capabilities: this.capabilities,
      defaultModel: 'mock-model',
      metadata: {
        purpose: 'Local development placeholder provider',
      },
    };
  }

  async generate(request: AiRequest): Promise<AiResponse> {
    const lastUserMessage = [...request.messages]
      .reverse()
      .find((message) => message.role === 'user');

    return {
      providerName: this.name,
      model: request.model ?? 'mock-model',
      content: `Mock AI response for: ${lastUserMessage?.content ?? 'No user input'}`,
      usage: {
        inputTokens: request.messages.reduce(
          (total, message) => total + message.content.length,
          0,
        ),
        outputTokens: 0,
        totalTokens: request.messages.reduce(
          (total, message) => total + message.content.length,
          0,
        ),
      },
    };
  }
}
