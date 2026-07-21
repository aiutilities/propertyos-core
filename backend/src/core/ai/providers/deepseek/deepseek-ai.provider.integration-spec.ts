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
  DeepSeekAiProvider,
} from './deepseek-ai.provider';

describe(
  'DeepSeek provider adapter',
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
                    'deepseek',
                  model:
                    options.request
                      .model ??
                    options.configuration
                      .defaultModel,
                  content:
                    'Mocked DeepSeek response',
                  usage: {
                    inputTokens:
                      20,
                    outputTokens:
                      6,
                    totalTokens:
                      26,
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
                          'Mocked DeepSeek response',
                      },
                      finish_reason:
                        'stop',
                    },
                  ],
                  usage: {
                    prompt_tokens:
                      20,
                    completion_tokens:
                      6,
                    total_tokens:
                      26,
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
          new DeepSeekAiProvider(
            protocol,
          );

        expect(
          provider.name,
        ).toBe(
          'deepseek',
        );

        expect(
          provider.displayName,
        ).toBe(
          'DeepSeek',
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
          new DeepSeekAiProvider(
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
              'propertyos.deepseek',
            name:
              'deepseek',
            displayName:
              'DeepSeek',
            version:
              '1.0.0',
            vendor:
              'DeepSeek',
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
      'declares current V4 models without legacy aliases',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new DeepSeekAiProvider(
            protocol,
          );

        expect(
          provider.manifest
            .models.map(
              (model) =>
                model.id,
            ),
        ).toEqual([
          'deepseek-v4-flash',
          'deepseek-v4-pro',
        ]);

        expect(
          provider.manifest
            .models.map(
              (model) =>
                model.id,
            ),
        ).not.toContain(
          'deepseek-chat',
        );

        expect(
          provider.manifest
            .models.map(
              (model) =>
                model.id,
            ),
        ).not.toContain(
          'deepseek-reasoner',
        );

        expect(
          provider
            .getProvider()
            .defaultModel,
        ).toBe(
          'deepseek-v4-flash',
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
          new DeepSeekAiProvider(
            protocol,
          );

        expect(
          provider.getProvider(),
        ).toEqual(
          expect.objectContaining({
            id:
              'deepseek',
            name:
              'deepseek',
            displayName:
              'DeepSeek',
            status:
              'INACTIVE',
            defaultModel:
              'deepseek-v4-flash',
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
          new DeepSeekAiProvider(
            protocol,
          );

        expect(
          provider
            .getRuntimeConfiguration(),
        ).toEqual({
          providerName:
            'deepseek',
          enabled:
            false,
          priority:
            110,
          defaultModel:
            'deepseek-v4-flash',
          baseUrl:
            'https://api.deepseek.com',
          timeoutMs:
            30_000,
          maxRetries:
            0,
          credential: {
            source:
              'ENVIRONMENT',
            variableName:
              'DEEPSEEK_API_KEY',
          },
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
          new DeepSeekAiProvider(
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
                'DEEPSEEK_API_KEY',
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
          new DeepSeekAiProvider(
            protocol,
          );

        const response =
          await provider
            .generate({
              model:
                'deepseek-v4-pro',
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
                    'Analyse PropertyOS.',
                },
              ],
              temperature:
                0.1,
              maxTokens:
                700,
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
                'deepseek',
              enabled:
                false,
              defaultModel:
                'deepseek-v4-flash',
              baseUrl:
                'https://api.deepseek.com',
              credential: {
                source:
                  'ENVIRONMENT',
                variableName:
                  'DEEPSEEK_API_KEY',
              },
              liveExecutionAuthorized:
                false,
            }),
          path:
            '/chat/completions',
          request: {
            model:
              'deepseek-v4-pro',
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
                  'Analyse PropertyOS.',
              },
            ],
            temperature:
              0.1,
            maxTokens:
              700,
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
            'deepseek',
          model:
            'deepseek-v4-pro',
          content:
            'Mocked DeepSeek response',
          usage: {
            inputTokens:
              20,
            outputTokens:
              6,
            totalTokens:
              26,
          },
        });
      },
    );

    it(
      'does not read credentials during construction or discovery',
      () => {
        const original =
          process.env
            .DEEPSEEK_API_KEY;

        process.env
          .DEEPSEEK_API_KEY =
          'must-not-be-read';

        try {
          const {
            protocol,
            execute,
          } =
            createProtocol();

          const provider =
            new DeepSeekAiProvider(
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
              .DEEPSEEK_API_KEY;
          } else {
            process.env
              .DEEPSEEK_API_KEY =
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
          new DeepSeekAiProvider(
            protocol,
          );

        expect(
          provider.manifest
            .metadata,
        ).toEqual(
          expect.objectContaining({
            providerSdkRequired:
              false,
            legacyModelAliasesIncluded:
              false,
          }),
        );
      },
    );
  },
);
