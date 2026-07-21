import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  AiProviderRuntimeService,
} from '../../runtime/ai-provider-runtime.service';
import {
  AiProviderRuntimeConfiguration,
} from '../../types/ai-provider-runtime-configuration.types';
import {
  AiProviderRuntimeExecutionRequest,
  AiProviderRuntimeExecutionResult,
} from '../../types/ai-provider-runtime.types';
import {
  OpenAiCompatibleChatCompletionResponse,
} from '../../types/openai-compatible-protocol.types';
import {
  OpenAiCompatibleProtocolService,
} from './openai-compatible-protocol.service';

describe(
  'OpenAI-compatible protocol',
  () => {
    const createConfiguration =
      (
        overrides:
          Partial<AiProviderRuntimeConfiguration> =
            {},
      ):
        AiProviderRuntimeConfiguration => ({
          providerName:
            ' DeepSeek ',
          enabled:
            true,
          priority:
            10,
          defaultModel:
            ' deepseek-chat ',
          baseUrl:
            'https://api.example.test/v1',
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
          ...overrides,
        });

    const createRawResponse =
      (
        overrides:
          Partial<
            OpenAiCompatibleChatCompletionResponse
          > =
            {},
      ):
        OpenAiCompatibleChatCompletionResponse => ({
          id:
            'completion-1',
          object:
            'chat.completion',
          created:
            1_700_000_000,
          model:
            'deepseek-chat',
          choices: [
            {
              index:
                0,
              message: {
                role:
                  'assistant',
                content:
                  'Protocol response',
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
          ...overrides,
        });

    const createRuntime =
      (
        raw =
          createRawResponse(),
      ) => {
        const execute =
          jest.fn<
            (
              request:
                AiProviderRuntimeExecutionRequest,
            ) => Promise<
              AiProviderRuntimeExecutionResult<
                OpenAiCompatibleChatCompletionResponse
              >
            >
          >(
            async (
              request,
            ) => ({
              providerName:
                request
                  .configuration
                  .providerName
                  .trim()
                  .toLowerCase(),
              model:
                request
                  .configuration
                  .defaultModel
                  ?.trim(),
              attempt:
                1,
              response: {
                providerName:
                  request
                    .configuration
                    .providerName
                    .trim()
                    .toLowerCase(),
                status:
                  200,
                ok:
                  true,
                headers: {
                  'content-type':
                    'application/json',
                },
                data:
                  raw,
                durationMs:
                  5,
              },
            }),
          );

        const runtime = {
          execute,
        } as unknown as
          AiProviderRuntimeService;

        return {
          runtime,
          execute,
        };
      };

    it(
      'maps an AI request to an OpenAI-compatible request',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new OpenAiCompatibleProtocolService(
            runtime,
          );

        expect(
          service.mapRequest({
            providerName:
              ' DeepSeek ',
            defaultModel:
              ' deepseek-chat ',
            request: {
              messages: [
                {
                  role:
                    'system',
                  content:
                    ' You are helpful. ',
                },
                {
                  role:
                    'user',
                  content:
                    ' Hello ',
                },
              ],
              temperature:
                0.4,
              maxTokens:
                256,
              metadata: {
                private:
                  'not-forwarded',
              },
            },
          }),
        ).toEqual({
          model:
            'deepseek-chat',
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
                'Hello',
            },
          ],
          temperature:
            0.4,
          max_tokens:
            256,
          stream:
            false,
        });
      },
    );

    it(
      'prefers the request model over the default model',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new OpenAiCompatibleProtocolService(
            runtime,
          );

        const mapped =
          service.mapRequest({
            providerName:
              'provider',
            defaultModel:
              'default-model',
            request: {
              model:
                'request-model',
              messages: [
                {
                  role:
                    'user',
                  content:
                    'Hello',
                },
              ],
            },
          });

        expect(
          mapped.model,
        ).toBe(
          'request-model',
        );
      },
    );

    it(
      'rejects a missing model',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new OpenAiCompatibleProtocolService(
            runtime,
          );

        expect(
          () =>
            service.mapRequest({
              providerName:
                'provider',
              request: {
                messages: [
                  {
                    role:
                      'user',
                    content:
                      'Hello',
                  },
                ],
              },
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'MODEL_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects empty messages',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new OpenAiCompatibleProtocolService(
            runtime,
          );

        expect(
          () =>
            service.mapRequest({
              providerName:
                'provider',
              defaultModel:
                'model',
              request: {
                messages: [],
              },
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'MESSAGES_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects invalid temperature and token limits',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new OpenAiCompatibleProtocolService(
            runtime,
          );

        expect(
          () =>
            service.mapRequest({
              providerName:
                'provider',
              defaultModel:
                'model',
              request: {
                messages: [
                  {
                    role:
                      'user',
                    content:
                      'Hello',
                  },
                ],
                temperature:
                  3,
              },
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'INVALID_TEMPERATURE',
          }),
        );

        expect(
          () =>
            service.mapRequest({
              providerName:
                'provider',
              defaultModel:
                'model',
              request: {
                messages: [
                  {
                    role:
                      'user',
                    content:
                      'Hello',
                  },
                ],
                maxTokens:
                  0,
              },
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'INVALID_MAX_TOKENS',
          }),
        );
      },
    );

    it(
      'maps a compatible response into the common AI response',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new OpenAiCompatibleProtocolService(
            runtime,
          );

        const response =
          service.mapResponse({
            providerName:
              ' DeepSeek ',
            requestedModel:
              'fallback-model',
            raw:
              createRawResponse(),
          });

        expect(
          response,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'deepseek',
            model:
              'deepseek-chat',
            content:
              'Protocol response',
            usage: {
              inputTokens:
                12,
              outputTokens:
                4,
              totalTokens:
                16,
            },
          }),
        );

        expect(
          response.raw,
        ).toEqual(
          createRawResponse(),
        );
      },
    );

    it(
      'uses the requested model when the response omits its model',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new OpenAiCompatibleProtocolService(
            runtime,
          );

        const response =
          service.mapResponse({
            providerName:
              'provider',
            requestedModel:
              'requested-model',
            raw:
              createRawResponse({
                model:
                  undefined,
              }),
          });

        expect(
          response.model,
        ).toBe(
          'requested-model',
        );
      },
    );

    it(
      'rejects malformed and empty responses',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new OpenAiCompatibleProtocolService(
            runtime,
          );

        expect(
          () =>
            service.mapResponse({
              providerName:
                'provider',
              requestedModel:
                'model',
              raw: {
                choices: [],
              },
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'INVALID_RESPONSE',
          }),
        );

        expect(
          () =>
            service.mapResponse({
              providerName:
                'provider',
              requestedModel:
                'model',
              raw:
                createRawResponse({
                  choices: [
                    {
                      message: {
                        content:
                          '   ',
                      },
                    },
                  ],
                }),
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'EMPTY_RESPONSE_CONTENT',
          }),
        );
      },
    );

    it(
      'executes through the provider runtime',
      async () => {
        const {
          runtime,
          execute,
        } =
          createRuntime();

        const service =
          new OpenAiCompatibleProtocolService(
            runtime,
          );

        const result =
          await service.execute({
            configuration:
              createConfiguration(),
            request: {
              messages: [
                {
                  role:
                    'user',
                  content:
                    'Explain PropertyOS',
                },
              ],
              temperature:
                0.2,
              maxTokens:
                300,
            },
          });

        expect(
          execute,
        ).toHaveBeenCalledTimes(
          1,
        );

        const runtimeRequest =
          execute.mock
            .calls[0][0];

        expect(
          runtimeRequest,
        ).toEqual(
          expect.objectContaining({
            path:
              '/chat/completions',
            method:
              'POST',
            headers: {
              accept:
                'application/json',
            },
            body: {
              model:
                'deepseek-chat',
              messages: [
                {
                  role:
                    'user',
                  content:
                    'Explain PropertyOS',
                },
              ],
              temperature:
                0.2,
              max_tokens:
                300,
              stream:
                false,
            },
          }),
        );

        expect(
          runtimeRequest
            .createCredentialHeaders(
              'secret-value',
            ),
        ).toEqual({
          authorization:
            'Bearer secret-value',
        });

        expect(
          result.response,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'deepseek',
            content:
              'Protocol response',
          }),
        );
      },
    );

    it(
      'supports a provider-specific relative endpoint path and headers',
      async () => {
        const {
          runtime,
          execute,
        } =
          createRuntime();

        const service =
          new OpenAiCompatibleProtocolService(
            runtime,
          );

        await service.execute({
          configuration:
            createConfiguration(),
          path:
            '/compatible/chat',
          headers: {
            'x-provider-option':
              'enabled',
          },
          request: {
            messages: [
              {
                role:
                  'user',
                content:
                  'Hello',
              },
            ],
          },
        });

        expect(
          execute.mock
            .calls[0][0],
        ).toEqual(
          expect.objectContaining({
            path:
              '/compatible/chat',
            headers: {
              accept:
                'application/json',
              'x-provider-option':
                'enabled',
            },
          }),
        );
      },
    );

    it(
      'does not register or identify a concrete provider',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new OpenAiCompatibleProtocolService(
            runtime,
          );

        expect(
          'name' in service,
        ).toBe(
          false,
        );

        expect(
          'manifest' in service,
        ).toBe(
          false,
        );

        expect(
          'generate' in service,
        ).toBe(
          false,
        );
      },
    );
  },
);
