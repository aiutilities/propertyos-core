import { Injectable } from '@nestjs/common';
import { AiProviderPort } from '../contracts/ai-provider.contract';
import {
  AI_PROVIDER_CONTRACT_VERSION,
  AI_PROVIDER_MANIFEST_VERSION,
  AiProviderManifest,
} from '../manifest/ai-provider-manifest';
import {
  AiCapability,
  AiProvider,
  AiRequest,
  AiResponse,
} from '../types/ai.types';

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

  readonly manifest: AiProviderManifest = {
    manifestVersion:
      AI_PROVIDER_MANIFEST_VERSION,
    provider: {
      id: 'propertyos.mock-ai',
      name: this.name,
      displayName: this.displayName,
      version: '1.0.0',
      vendor: 'PropertyOS',
      description:
        'Local deterministic AI provider for development and testing',
    },
    compatibility: {
      propertyOsVersion: '^0.1.0',
      aiContractVersion:
        `^${AI_PROVIDER_CONTRACT_VERSION}`,
    },
    execution: {
      supportedModes: [
        'SIMULATED',
        'ISOLATED',
      ],
    },
    capabilities: [
      ...this.capabilities,
    ],
    models: [
      {
        id: 'mock-model',
        displayName: 'Mock Model',
        contextWindow: 8_192,
        maxInputTokens: 6_144,
        maxOutputTokens: 2_048,
        supportsStreaming: false,
        supportsVision: false,
        supportsToolCalling: false,
      },
    ],
    limits: {
      maxInputTokens: 6_144,
      maxOutputTokens: 2_048,
      maxTotalTokens: 8_192,
    },
    metadata: {
      runtime: 'local',
      liveExecution: false,
    },
  };

  getProvider(): AiProvider {
    return {
      id: this.name,
      name: this.name,
      displayName: this.displayName,
      status: 'ACTIVE',
      capabilities: this.capabilities,
      defaultModel: 'mock-model',
      metadata: {
        purpose:
          'Local development placeholder provider',
      },
    };
  }

  async generate(
    request: AiRequest,
  ): Promise<AiResponse> {
    const lastUserMessage = [
      ...request.messages,
    ]
      .reverse()
      .find(
        (message) =>
          message.role === 'user',
      );

    return {
      providerName: this.name,
      model:
        request.model ??
        'mock-model',
      content:
        `Mock AI response for: ` +
        `${lastUserMessage?.content ?? 'No user input'}`,
      usage: {
        inputTokens:
          request.messages.reduce(
            (total, message) =>
              total +
              message.content.length,
            0,
          ),
        outputTokens: 0,
        totalTokens:
          request.messages.reduce(
            (total, message) =>
              total +
              message.content.length,
            0,
          ),
      },
    };
  }
}
