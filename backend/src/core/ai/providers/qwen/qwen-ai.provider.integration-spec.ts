import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  validateAiProviderManifest,
} from '../../manifest/ai-provider-manifest.validator';
import {
  OpenAiCompatibleProtocolService,
} from '../../protocols/openai-compatible/openai-compatible-protocol.service';
import {
  OpenAiCompatibleProtocolResult,
} from '../../types/openai-compatible-protocol.types';
import {
  QwenAiProvider,
} from './qwen-ai.provider';

describe(
  'Qwen provider adapter',
  () => {
    const createProtocol =
      () => {
        const execute =
          jest.fn<
            OpenAiCompatibleProtocolService[
              'execute'
            ]
          >(
            async (
              options,
            ):
              Promise<
                OpenAiCompatibleProtocolResult
              > => ({
                request: {
                  model:
                    options.request
                      .model ??
                    options.configuration
                      .defaultModel!,
                  messages:
                    options.request
                      .messages.map(
                        (message) => ({
                          role:
                            message.role,
                          content:
                            message.content,
                        }),
                      ),
                  temperature:
                    options.request
                      .temperature,
                  max_tokens:
                    options.request
                      .maxTokens,
                  stream:
                    false,
                },
                response: {
                  providerName:
                    'qwen',
                  model:
                    options.request
                      .model ??
                    options.configuration
                      .defaultModel,
                  content:
                    'Mocked Qwen response',
                  usage: {
                    inputTokens:
                      18,
                    outputTokens:
                      5,
                    totalTokens:
                      23,
                  },
                },
                raw: {
                  model:
                    options.request
                      .model ??
                    options.configuration
                      .defaultModel,
                  choices: [
                    {
                      index:
                        0,
                      message: {
                        role:
                          'assistant',
                        content:
                          'Mocked Qwen response',
                      },
                      finish_reason:
                        'stop',
                    },
                  ],
                  usage: {
                    prompt_tokens:
                      18,
                    completion_tokens:
                      5,
                    total_tokens:
                      23,
                  },
                },
              }),
          );

        return {
          protocol: {
            execute,
          } as unknown as
            OpenAiCompatibleProtocolService,
          execute,
        };
      };

    it(
      'implements the concrete provider identity',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new QwenAiProvider(
            protocol,
          );

        expect(
          provider.name,
        ).toBe(
          'qwen',
        );

        expect(
          provider.displayName,
        ).toBe(
          'Qwen',
        );

        expect(
          provider.capabilities,
        ).toEqual([
          'CHAT',
          'TEXT_GENERATION',
          'CLASSIFICATION',
          'SUMMARIZATION',
          'EXTRACTION',
        ]);
      },
    );

    it(
      'publishes a valid and compatible manifest',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new QwenAiProvider(
            protocol,
          );

        expect(
          validateAiProviderManifest(
            provider.manifest,
          ),
        ).toEqual(
          expect.objectContaining({
            valid:
              true,
            compatible:
              true,
            errors: [],
          }),
        );

        expect(
          provider.manifest
            .provider,
        ).toEqual(
          expect.objectContaining({
            id:
              'propertyos.qwen',
            name:
              'qwen',
            displayName:
              'Qwen',
            version:
              '1.0.0',
            vendor:
              'Alibaba Cloud',
          }),
        );

        expect(
          provider.manifest
            .execution
            .supportedModes,
        ).toEqual([
          'LIVE',
        ]);
      },
    );

    it(
      'declares current Qwen 3.7 models',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new QwenAiProvider(
            protocol,
          );

        expect(
          provider.manifest
            .models.map(
              (model) =>
                model.id,
            ),
        ).toEqual([
          'qwen3.7-plus',
          'qwen3.7-max',
        ]);

        expect(
          provider
            .getProvider()
            .defaultModel,
        ).toBe(
          'qwen3.7-plus',
        );
      },
    );

    it(
      'is registered as inactive before explicit activation',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new QwenAiProvider(
            protocol,
          );

        expect(
          provider.getProvider(),
        ).toEqual(
          expect.objectContaining({
            id:
              'qwen',
            name:
              'qwen',
            displayName:
              'Qwen',
            status:
              'INACTIVE',
            defaultModel:
              'qwen3.7-plus',
          }),
        );
      },
    );

    it(
      'publishes a disabled Singapore runtime configuration',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new QwenAiProvider(
            protocol,
          );

        expect(
          provider
            .getRuntimeConfiguration(),
        ).toEqual({
          providerName:
            'qwen',
          enabled:
            false,
          priority:
            120,
          defaultModel:
            'qwen3.7-plus',
          baseUrl:
            'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
          timeoutMs:
            30_000,
          maxRetries:
            0,
          credential: {
            source:
              'ENVIRONMENT',
            variableName:
              'DASHSCOPE_API_KEY',
          },
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
        });
      },
    );

    it(
      'returns defensive runtime-configuration copies',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new QwenAiProvider(
            protocol,
          );

        const first =
          provider
            .getRuntimeConfiguration();

        first.enabled =
          true;

        first.credential
          .variableName =
          'CHANGED_KEY';

        first.metadata!
          .activation =
          'changed';

        expect(
          provider
            .getRuntimeConfiguration(),
        ).toEqual(
          expect.objectContaining({
            enabled:
              false,
            credential: {
              source:
                'ENVIRONMENT',
              variableName:
                'DASHSCOPE_API_KEY',
            },
            metadata:
              expect.objectContaining({
                activation:
                  'blocked',
              }),
          }),
        );
      },
    );

    it(
      'delegates generation to the shared protocol',
      async () => {
        const {
          protocol,
          execute,
        } =
          createProtocol();

        const provider =
          new QwenAiProvider(
            protocol,
          );

        const response =
          await provider
            .generate({
              model:
                'qwen3.7-max',
              messages: [
                {
                  role:
                    'system',
                  content:
                    'You are helpful.',
                },
                {
                  role:
                    'user',
                  content:
                    'Review PropertyOS.',
                },
              ],
              temperature:
                0.3,
              maxTokens:
                600,
              metadata: {
                private:
                  'not-forwarded-by-provider',
              },
            });

        expect(
          execute,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          execute,
        ).toHaveBeenCalledWith({
          configuration:
            expect.objectContaining({
              providerName:
                'qwen',
              enabled:
                false,
              defaultModel:
                'qwen3.7-plus',
              baseUrl:
                'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
              credential: {
                source:
                  'ENVIRONMENT',
                variableName:
                  'DASHSCOPE_API_KEY',
              },
              liveExecutionAuthorized:
                false,
            }),
          path:
            '/chat/completions',
          request: {
            model:
              'qwen3.7-max',
            messages: [
              {
                role:
                  'system',
                content:
                  'You are helpful.',
              },
              {
                role:
                  'user',
                content:
                  'Review PropertyOS.',
              },
            ],
            temperature:
              0.3,
            maxTokens:
              600,
            metadata: {
              private:
                'not-forwarded-by-provider',
            },
          },
        });

        expect(
          response,
        ).toEqual({
          providerName:
            'qwen',
          model:
            'qwen3.7-max',
          content:
            'Mocked Qwen response',
          usage: {
            inputTokens:
              18,
            outputTokens:
              5,
            totalTokens:
              23,
          },
        });
      },
    );

    it(
      'does not read credentials during construction or discovery',
      () => {
        const original =
          process.env
            .DASHSCOPE_API_KEY;

        process.env
          .DASHSCOPE_API_KEY =
          'must-not-be-read';

        try {
          const {
            protocol,
            execute,
          } =
            createProtocol();

          const provider =
            new QwenAiProvider(
              protocol,
            );

          provider
            .getProvider();

          void provider
            .manifest;

          provider
            .getRuntimeConfiguration();

          expect(
            execute,
          ).not.toHaveBeenCalled();
        } finally {
          if (
            original ===
              undefined
          ) {
            delete process.env
              .DASHSCOPE_API_KEY;
          } else {
            process.env
              .DASHSCOPE_API_KEY =
              original;
          }
        }
      },
    );

    it(
      'contains no provider SDK dependency',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new QwenAiProvider(
            protocol,
          );

        expect(
          provider.manifest
            .metadata,
        ).toEqual(
          expect.objectContaining({
            providerSdkRequired:
              false,
            workspaceDedicatedEndpointRecommended:
              true,
          }),
        );
      },
    );
  },
);
