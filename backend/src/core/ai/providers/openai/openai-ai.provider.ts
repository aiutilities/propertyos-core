import {
  Injectable,
} from '@nestjs/common';
import {
  AiProviderPort,
} from '../../contracts/ai-provider.contract';
import {
  AI_PROVIDER_CONTRACT_VERSION,
  AI_PROVIDER_MANIFEST_VERSION,
  AiProviderManifest,
} from '../../manifest/ai-provider-manifest';
import {
  OpenAiCompatibleProtocolService,
} from '../../protocols/openai-compatible/openai-compatible-protocol.service';
import {
  AiProviderRuntimeConfiguration,
} from '../../types/ai-provider-runtime-configuration.types';
import {
  AiCapability,
  AiProvider,
  AiRequest,
  AiResponse,
} from '../../types/ai.types';

@Injectable()
export class OpenAiProvider
  implements AiProviderPort
{
  readonly name =
    'openai';

  readonly displayName =
    'OpenAI';

  readonly capabilities:
    AiCapability[] = [
      'CHAT',
      'TEXT_GENERATION',
      'CLASSIFICATION',
      'SUMMARIZATION',
      'EXTRACTION',
    ];

  private readonly defaultModel =
    'gpt-4o-mini-2024-07-18';

  private readonly configuration:
    AiProviderRuntimeConfiguration = {
      providerName:
        this.name,

      /*
       * The provider is registered for discovery,
       * routing inspection and configuration validation,
       * but cannot execute until a later explicit
       * activation checkpoint changes this value.
       */
      enabled:
        false,

      priority:
        100,

      defaultModel:
        this.defaultModel,

      baseUrl:
        'https://api.openai.com/v1',

      timeoutMs:
        30_000,

      /*
       * Retry orchestration has not yet been added.
       * The runtime currently performs one attempt.
       */
      maxRetries:
        0,

      credential: {
        source:
          'ENVIRONMENT',
        variableName:
          'OPENAI_API_KEY',
      },

      /*
       * Phase 16B6 authorization remains absent.
       */
      liveExecutionAuthorized:
        false,

      metadata: {
        vendor:
          'OpenAI',
        protocol:
          'openai-compatible',
        endpoint:
          '/chat/completions',
        activation:
          'blocked',
        credentialReadDuringRegistration:
          false,
      },
    };

  readonly manifest:
    AiProviderManifest = {
      manifestVersion:
        AI_PROVIDER_MANIFEST_VERSION,

      provider: {
        id:
          'propertyos.openai',
        name:
          this.name,
        displayName:
          this.displayName,
        version:
          '1.0.0',
        vendor:
          'OpenAI',
        description:
          'PropertyOS adapter for the OpenAI Chat Completions protocol',
      },

      compatibility: {
        propertyOsVersion:
          '^0.1.0',
        aiContractVersion:
          `^${AI_PROVIDER_CONTRACT_VERSION}`,
      },

      execution: {
        supportedModes: [
          'LIVE',
        ],
      },

      capabilities: [
        ...this.capabilities,
      ],

      models: [
        {
          id:
            this.defaultModel,
          displayName:
            'GPT-4o mini — 2024-07-18',
          contextWindow:
            128_000,

          /*
           * These are conservative PropertyOS
           * orchestration-policy limits rather
           * than a dynamically fetched vendor
           * capability claim.
           */
          maxInputTokens:
            120_000,
          maxOutputTokens:
            8_000,
          supportsStreaming:
            false,
          supportsVision:
            false,
          supportsToolCalling:
            false,
        },
      ],

      limits: {
        maxInputTokens:
          120_000,
        maxOutputTokens:
          8_000,
        maxTotalTokens:
          128_000,
      },

      metadata: {
        protocol:
          'openai-compatible',
        endpoint:
          '/chat/completions',
        credentialVariable:
          'OPENAI_API_KEY',
        runtimeEnabled:
          false,
        liveExecutionAuthorized:
          false,
        limitsSource:
          'propertyos-policy',
        providerSdkRequired:
          false,
      },
    };

  constructor(
    private readonly protocol:
      OpenAiCompatibleProtocolService,
  ) {}

  getProvider():
    AiProvider {
    return {
      id:
        this.name,
      name:
        this.name,
      displayName:
        this.displayName,
      status:
        this.configuration.enabled
          ? 'ACTIVE'
          : 'INACTIVE',
      capabilities: [
        ...this.capabilities,
      ],
      defaultModel:
        this.defaultModel,
      metadata: {
        vendor:
          'OpenAI',
        protocol:
          'openai-compatible',
        executionMode:
          'LIVE',
        runtimeEnabled:
          this.configuration
            .enabled,
        liveExecutionAuthorized:
          this.configuration
            .liveExecutionAuthorized,
      },
    };
  }

  async generate(
    request: AiRequest,
  ): Promise<AiResponse> {
    const result =
      await this.protocol
        .execute({
          configuration:
            this.copyConfiguration(),
          path:
            '/chat/completions',
          request,
        });

    return result.response;
  }

  getRuntimeConfiguration():
    AiProviderRuntimeConfiguration {
    return this.copyConfiguration();
  }

  private copyConfiguration():
    AiProviderRuntimeConfiguration {
    return {
      ...this.configuration,
      credential: {
        ...this.configuration
          .credential,
      },
      metadata:
        this.configuration
          .metadata
          ? {
              ...this.configuration
                .metadata,
            }
          : undefined,
    };
  }
}
