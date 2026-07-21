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
  OpenAiProvider,
} from './openai-ai.provider';

describe(
  'OpenAI provider adapter',
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
                    'openai',
                  model:
                    options.request
                      .model ??
                    options.configuration
                      .defaultModel,
                  content:
                    'Mocked OpenAI response',
                  usage: {
                    inputTokens:
                      12,
                    outputTokens:
                      4,
                    totalTokens:
                      16,
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
                          'Mocked OpenAI response',
                      },
                      finish_reason:
                        'stop',
                    },
                  ],
                  usage: {
                    prompt_tokens:
                      12,
                    completion_tokens:
                      4,
                    total_tokens:
                      16,
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
          new OpenAiProvider(
            protocol,
          );

        expect(
          provider.name,
        ).toBe(
          'openai',
        );

        expect(
          provider.displayName,
        ).toBe(
          'OpenAI',
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
          new OpenAiProvider(
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
              'propertyos.openai',
            name:
              'openai',
            displayName:
              'OpenAI',
            version:
              '1.0.0',
            vendor:
              'OpenAI',
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
      'declares its pinned default model',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new OpenAiProvider(
            protocol,
          );

        expect(
          provider.manifest
            .models,
        ).toEqual([
          expect.objectContaining({
            id:
              'gpt-4o-mini-2024-07-18',
            supportsStreaming:
              false,
            supportsVision:
              false,
            supportsToolCalling:
              false,
          }),
        ]);

        expect(
          provider
            .getProvider()
            .defaultModel,
        ).toBe(
          'gpt-4o-mini-2024-07-18',
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
          new OpenAiProvider(
            protocol,
          );

        expect(
          provider.getProvider(),
        ).toEqual(
          expect.objectContaining({
            id:
              'openai',
            name:
              'openai',
            displayName:
              'OpenAI',
            status:
              'INACTIVE',
            defaultModel:
              'gpt-4o-mini-2024-07-18',
          }),
        );
      },
    );

    it(
      'publishes a disabled runtime configuration',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new OpenAiProvider(
            protocol,
          );

        expect(
          provider
            .getRuntimeConfiguration(),
        ).toEqual({
          providerName:
            'openai',
          enabled:
            false,
          priority:
            100,
          defaultModel:
            'gpt-4o-mini-2024-07-18',
          baseUrl:
            'https://api.openai.com/v1',
          timeoutMs:
            30_000,
          maxRetries:
            0,
          credential: {
            source:
              'ENVIRONMENT',
            variableName:
              'OPENAI_API_KEY',
          },
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
          new OpenAiProvider(
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
                'OPENAI_API_KEY',
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
          new OpenAiProvider(
            protocol,
          );

        const response =
          await provider
            .generate({
              model:
                'custom-openai-model',
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
                    'Explain PropertyOS.',
                },
              ],
              temperature:
                0.2,
              maxTokens:
                500,
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
                'openai',
              enabled:
                false,
              defaultModel:
                'gpt-4o-mini-2024-07-18',
              baseUrl:
                'https://api.openai.com/v1',
              credential: {
                source:
                  'ENVIRONMENT',
                variableName:
                  'OPENAI_API_KEY',
              },
              liveExecutionAuthorized:
                false,
            }),
          path:
            '/chat/completions',
          request: {
            model:
              'custom-openai-model',
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
                  'Explain PropertyOS.',
              },
            ],
            temperature:
              0.2,
            maxTokens:
              500,
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
            'openai',
          model:
            'custom-openai-model',
          content:
            'Mocked OpenAI response',
          usage: {
            inputTokens:
              12,
            outputTokens:
              4,
            totalTokens:
              16,
          },
        });
      },
    );

    it(
      'does not read credentials during construction or discovery',
      () => {
        const original =
          process.env
            .OPENAI_API_KEY;

        process.env
          .OPENAI_API_KEY =
          'must-not-be-read';

        try {
          const {
            protocol,
            execute,
          } =
            createProtocol();

          const provider =
            new OpenAiProvider(
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
              .OPENAI_API_KEY;
          } else {
            process.env
              .OPENAI_API_KEY =
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
          new OpenAiProvider(
            protocol,
          );

        expect(
          provider.manifest
            .metadata,
        ).toEqual(
          expect.objectContaining({
            providerSdkRequired:
              false,
          }),
        );
      },
    );
  },
);
