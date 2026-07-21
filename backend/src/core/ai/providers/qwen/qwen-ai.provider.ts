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
export class QwenAiProvider
  implements AiProviderPort
{
  readonly name =
    'qwen';

  readonly displayName =
    'Qwen';

  readonly capabilities:
    AiCapability[] = [
      'CHAT',
      'TEXT_GENERATION',
      'CLASSIFICATION',
      'SUMMARIZATION',
      'EXTRACTION',
    ];

  private readonly defaultModel =
    'qwen3.7-plus';

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
        120,

      defaultModel:
        this.defaultModel,

      /*
       * Singapore shared DashScope endpoint.
       * A workspace-specific endpoint can replace
       * this value during production configuration.
       */
      baseUrl:
        'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',

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
          'DASHSCOPE_API_KEY',
      },

      /*
       * Explicit Phase 16B6 live authorization
       * remains absent.
       */
      liveExecutionAuthorized:
        false,

      metadata: {
        vendor:
          'Alibaba Cloud',
        family:
          'Qwen',
        protocol:
          'openai-compatible',
        endpoint:
          '/chat/completions',
        region:
          'ap-southeast-1',
        endpointType:
          'shared-dashscope',
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
          'propertyos.qwen',
        name:
          this.name,
        displayName:
          this.displayName,
        version:
          '1.0.0',
        vendor:
          'Alibaba Cloud',
        description:
          'PropertyOS adapter for Qwen through the Alibaba Cloud OpenAI-compatible Chat Completions API',
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
            'qwen3.7-plus',
          displayName:
            'Qwen 3.7 Plus',
          contextWindow:
            128_000,

          /*
           * Conservative PropertyOS orchestration
           * policy limits rather than dynamically
           * fetched vendor limits.
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
            'qwen3.7-max',
          displayName:
            'Qwen 3.7 Max',
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
        family:
          'Qwen',
        protocol:
          'openai-compatible',
        endpoint:
          '/chat/completions',
        region:
          'ap-southeast-1',
        credentialVariable:
          'DASHSCOPE_API_KEY',
        runtimeEnabled:
          false,
        liveExecutionAuthorized:
          false,
        limitsSource:
          'propertyos-policy',
        providerSdkRequired:
          false,
        workspaceDedicatedEndpointRecommended:
          true,
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
          'Alibaba Cloud',
        family:
          'Qwen',
        protocol:
          'openai-compatible',
        executionMode:
          'LIVE',
        region:
          'ap-southeast-1',
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
