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
  AnthropicMessagesProtocolService,
} from '../../protocols/anthropic-messages/anthropic-messages-protocol.service';
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
export class ClaudeAiProvider
  implements AiProviderPort
{
  readonly name =
    'claude';

  readonly displayName =
    'Claude';

  readonly capabilities:
    AiCapability[] = [
      'CHAT',
      'TEXT_GENERATION',
      'CLASSIFICATION',
      'SUMMARIZATION',
      'EXTRACTION',
    ];

  private readonly defaultModel =
    'claude-sonnet-5';

  private readonly defaultMaxTokens =
    4_096;

  private readonly configuration:
    AiProviderRuntimeConfiguration = {
      providerName:
        this.name,

      /*
       * Registration and discovery are allowed.
       * Runtime execution remains disabled pending
       * explicit activation and authorization.
       */
      enabled:
        false,

      priority:
        130,

      defaultModel:
        this.defaultModel,

      baseUrl:
        'https://api.anthropic.com',

      timeoutMs:
        30_000,

      /*
       * Runtime retry orchestration remains outside
       * this provider adapter.
       */
      maxRetries:
        0,

      credential: {
        source:
          'ENVIRONMENT',
        variableName:
          'ANTHROPIC_API_KEY',
      },

      /*
       * Explicit live authorization remains absent.
       */
      liveExecutionAuthorized:
        false,

      metadata: {
        vendor:
          'Anthropic',
        family:
          'Claude',
        protocol:
          'anthropic-messages',
        endpoint:
          '/v1/messages',
        endpointType:
          'anthropic-first-party',
        apiVersion:
          '2023-06-01',
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
          'propertyos.claude',
        name:
          this.name,
        displayName:
          this.displayName,
        version:
          '1.0.0',
        vendor:
          'Anthropic',
        description:
          'PropertyOS adapter for Claude through the native Anthropic Messages API',
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
            'claude-sonnet-5',
          displayName:
            'Claude Sonnet 5',

          /*
           * Conservative PropertyOS orchestration
           * policy limits. These are intentionally
           * narrower than provider-advertised limits.
           */
          contextWindow:
            200_000,
          maxInputTokens:
            180_000,
          maxOutputTokens:
            16_000,
          supportsStreaming:
            false,

          /*
           * Claude supports vision and tool use, but
           * the current common PropertyOS message
           * contract represents text only and native
           * tool-block mapping is deliberately blocked.
           */
          supportsVision:
            false,
          supportsToolCalling:
            false,
        },
        {
          id:
            'claude-opus-4-8',
          displayName:
            'Claude Opus 4.8',
          contextWindow:
            200_000,
          maxInputTokens:
            180_000,
          maxOutputTokens:
            16_000,
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
          180_000,
        maxOutputTokens:
          16_000,
        maxTotalTokens:
          196_000,
      },

      metadata: {
        family:
          'Claude',
        protocol:
          'anthropic-messages',
        endpoint:
          '/v1/messages',
        baseUrl:
          'https://api.anthropic.com',
        apiVersion:
          '2023-06-01',
        credentialVariable:
          'ANTHROPIC_API_KEY',
        runtimeEnabled:
          false,
        liveExecutionAuthorized:
          false,
        limitsSource:
          'propertyos-policy',
        providerSdkRequired:
          false,
        nativeVisionMappingImplemented:
          false,
        nativeToolMappingImplemented:
          false,
      },
    };

  constructor(
    private readonly protocol:
      AnthropicMessagesProtocolService,
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
          'Anthropic',
        family:
          'Claude',
        protocol:
          'anthropic-messages',
        executionMode:
          'LIVE',
        apiVersion:
          '2023-06-01',
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
            '/v1/messages',
          anthropicVersion:
            '2023-06-01',
          defaultMaxTokens:
            this.defaultMaxTokens,
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
