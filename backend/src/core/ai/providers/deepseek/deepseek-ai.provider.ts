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
export class DeepSeekAiProvider
  implements AiProviderPort
{
  readonly name =
    'deepseek';

  readonly displayName =
    'DeepSeek';

  readonly capabilities:
    AiCapability[] = [
      'CHAT',
      'TEXT_GENERATION',
      'CLASSIFICATION',
      'SUMMARIZATION',
      'EXTRACTION',
    ];

  private readonly defaultModel =
    'deepseek-v4-flash';

  private readonly configuration:
    AiProviderRuntimeConfiguration = {
      providerName:
        this.name,

      /*
       * Discovery and registration are allowed.
       * Runtime execution remains disabled until
       * a later explicit activation checkpoint.
       */
      enabled:
        false,

      priority:
        110,

      defaultModel:
        this.defaultModel,

      baseUrl:
        'https://api.deepseek.com',

      timeoutMs:
        30_000,

      /*
       * Runtime retry orchestration has not yet
       * been implemented.
       */
      maxRetries:
        0,

      credential: {
        source:
          'ENVIRONMENT',
        variableName:
          'DEEPSEEK_API_KEY',
      },

      /*
       * Explicit Phase 16B6 live authorization
       * remains absent.
       */
      liveExecutionAuthorized:
        false,

      metadata: {
        vendor:
          'DeepSeek',
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
          'propertyos.deepseek',
        name:
          this.name,
        displayName:
          this.displayName,
        version:
          '1.0.0',
        vendor:
          'DeepSeek',
        description:
          'PropertyOS adapter for the DeepSeek OpenAI-compatible Chat Completions API',
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
            'deepseek-v4-flash',
          displayName:
            'DeepSeek V4 Flash',
          contextWindow:
            128_000,

          /*
           * Conservative PropertyOS policy limits.
           * These limits are deliberately lower
           * than potential vendor capabilities.
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
        {
          id:
            'deepseek-v4-pro',
          displayName:
            'DeepSeek V4 Pro',
          contextWindow:
            128_000,
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
          'DEEPSEEK_API_KEY',
        runtimeEnabled:
          false,
        liveExecutionAuthorized:
          false,
        limitsSource:
          'propertyos-policy',
        providerSdkRequired:
          false,
        legacyModelAliasesIncluded:
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
          'DeepSeek',
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
