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
  AnthropicMessagesResponse,
} from '../../types/anthropic-messages-protocol.types';
import {
  AnthropicMessagesProtocolService,
} from './anthropic-messages-protocol.service';

describe(
  'Anthropic Messages protocol',
  () => {
    const createConfiguration =
      (
        overrides:
          Partial<
            AiProviderRuntimeConfiguration
          > = {},
      ):
        AiProviderRuntimeConfiguration => ({
          providerName:
            ' Claude ',
          enabled:
            true,
          priority:
            10,
          defaultModel:
            ' claude-sonnet-5 ',
          baseUrl:
            'https://api.anthropic.com',
          timeoutMs:
            30_000,
          maxRetries:
            0,
          credential: {
            source:
              'ENVIRONMENT',
            variableName:
              'ANTHROPIC_API_KEY',
          },
          liveExecutionAuthorized:
            false,
          ...overrides,
        });

    const createRawResponse =
      (
        overrides:
          Partial<
            AnthropicMessagesResponse
          > = {},
      ):
        AnthropicMessagesResponse => ({
          id:
            'msg_01',
          type:
            'message',
          role:
            'assistant',
          model:
            'claude-sonnet-5',
          content: [
            {
              type:
                'text',
              text:
                'Protocol response',
            },
          ],
          stop_reason:
            'end_turn',
          stop_sequence:
            null,
          usage: {
            input_tokens:
              12,
            output_tokens:
              4,
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
                AnthropicMessagesResponse
              >
            >
          >(
            async (
              request,
            ) => ({
              providerName:
                request.configuration
                  .providerName
                  .trim()
                  .toLowerCase(),
              model:
                request.configuration
                  .defaultModel
                  ?.trim(),
              attempt:
                1,
              response: {
                providerName:
                  request.configuration
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

        return {
          runtime: {
            execute,
          } as unknown as
            AiProviderRuntimeService,
          execute,
        };
      };

    it(
      'maps system instructions to the top-level system field',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        expect(
          service.mapRequest({
            providerName:
              ' Claude ',
            defaultModel:
              ' claude-sonnet-5 ',
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
                    'system',
                  content:
                    ' Be concise. ',
                },
                {
                  role:
                    'user',
                  content:
                    ' Explain PropertyOS. ',
                },
              ],
              temperature:
                0.4,
              maxTokens:
                512,
            },
          }),
        ).toEqual({
          model:
            'claude-sonnet-5',
          system:
            'You are helpful.\n\nBe concise.',
          messages: [
            {
              role:
                'user',
              content:
                'Explain PropertyOS.',
            },
          ],
          max_tokens:
            512,
          temperature:
            0.4,
          stream:
            false,
        });
      },
    );

    it(
      'uses a safe default max token value',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        const mapped =
          service.mapRequest({
            providerName:
              'claude',
            defaultModel:
              'claude-sonnet-5',
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
          mapped.max_tokens,
        ).toBe(
          4_096,
        );
      },
    );

    it(
      'supports a provider-supplied default max token value',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        const mapped =
          service.mapRequest({
            providerName:
              'claude',
            defaultModel:
              'claude-sonnet-5',
            defaultMaxTokens:
              8_192,
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
          mapped.max_tokens,
        ).toBe(
          8_192,
        );
      },
    );

    it(
      'prefers the request model and token limit',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        const mapped =
          service.mapRequest({
            providerName:
              'claude',
            defaultModel:
              'claude-sonnet-5',
            defaultMaxTokens:
              8_192,
            request: {
              model:
                'claude-opus-4-8',
              messages: [
                {
                  role:
                    'user',
                  content:
                    'Hello',
                },
              ],
              maxTokens:
                900,
            },
          });

        expect(
          mapped.model,
        ).toBe(
          'claude-opus-4-8',
        );

        expect(
          mapped.max_tokens,
        ).toBe(
          900,
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
          new AnthropicMessagesProtocolService(
            runtime,
          );

        expect(
          () =>
            service.mapRequest({
              providerName:
                'claude',
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
      'rejects empty messages and system-only conversations',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        expect(
          () =>
            service.mapRequest({
              providerName:
                'claude',
              defaultModel:
                'claude-sonnet-5',
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

        expect(
          () =>
            service.mapRequest({
              providerName:
                'claude',
              defaultModel:
                'claude-sonnet-5',
              request: {
                messages: [
                  {
                    role:
                      'system',
                    content:
                      'System only',
                  },
                ],
              },
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'CONVERSATION_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects tool messages until native tool mapping exists',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        expect(
          () =>
            service.mapRequest({
              providerName:
                'claude',
              defaultModel:
                'claude-sonnet-5',
              request: {
                messages: [
                  {
                    role:
                      'tool',
                    content:
                      'Tool result',
                  },
                ],
              },
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'UNSUPPORTED_MESSAGE_ROLE',
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
          new AnthropicMessagesProtocolService(
            runtime,
          );

        expect(
          () =>
            service.mapRequest({
              providerName:
                'claude',
              defaultModel:
                'claude-sonnet-5',
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
                  1.1,
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
                'claude',
              defaultModel:
                'claude-sonnet-5',
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
      'maps and combines Anthropic text content blocks',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        const raw =
          createRawResponse({
            content: [
              {
                type:
                  'text',
                text:
                  'First block',
              },
              {
                type:
                  'thinking',
                thinking:
                  'not exposed',
              },
              {
                type:
                  'text',
                text:
                  'Second block',
              },
            ],
          });

        const response =
          service.mapResponse({
            providerName:
              ' Claude ',
            requestedModel:
              'fallback-model',
            raw,
          });

        expect(
          response,
        ).toEqual({
          providerName:
            'claude',
          model:
            'claude-sonnet-5',
          content:
            'First block\nSecond block',
          raw,
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
      'falls back to the requested model',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        const response =
          service.mapResponse({
            providerName:
              'claude',
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
      'accepts a tool-only Anthropic response',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        const raw =
          createRawResponse({
            content: [
              {
                type:
                  'tool_use',
                id:
                  'toolu-property',
                name:
                  'property.lookup',
                input: {
                  propertyId:
                    'property-1',
                },
              },
            ],
            stop_reason:
              'tool_use',
          });

        const response =
          service.mapResponse({
            providerName:
              ' Claude ',
            requestedModel:
              'fallback-model',
            raw,
          });

        expect(
          response,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'claude',
            content:
              '',
            raw,
          }),
        );
      },
    );

    it(
      'continues rejecting Anthropic responses without text or tool use',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        expect(
          () =>
            service.mapResponse({
              providerName:
                'claude',
              requestedModel:
                'model',
              raw:
                createRawResponse({
                  content: [
                    {
                      type:
                        'thinking',
                      thinking:
                        'not exposed',
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
      'rejects malformed and empty content-block responses',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        expect(
          () =>
            service.mapResponse({
              providerName:
                'claude',
              requestedModel:
                'model',
              raw: {
                content: [],
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
                'claude',
              requestedModel:
                'model',
              raw:
                createRawResponse({
                  content: [
                    {
                      type:
                        'text',
                      text:
                        '   ',
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
      'executes through the shared runtime with native Anthropic headers',
      async () => {
        const {
          runtime,
          execute,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
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
              '/v1/messages',
            method:
              'POST',
            headers: {
              accept:
                'application/json',
              'anthropic-version':
                '2023-06-01',
            },
            body: {
              model:
                'claude-sonnet-5',
              system:
                'You are helpful.',
              messages: [
                {
                  role:
                    'user',
                  content:
                    'Explain PropertyOS.',
                },
              ],
              max_tokens:
                300,
              temperature:
                undefined,
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
          'x-api-key':
            'secret-value',
        });

        expect(
          result.response,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'claude',
            content:
              'Protocol response',
          }),
        );
      },
    );

    it(
      'supports provider-specific path, version and headers',
      async () => {
        const {
          runtime,
          execute,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        await service.execute({
          configuration:
            createConfiguration(),
          path:
            '/custom/messages',
          anthropicVersion:
            '2024-01-01',
          headers: {
            'anthropic-beta':
              'example-beta',
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
              '/custom/messages',
            headers: {
              accept:
                'application/json',
              'anthropic-version':
                '2024-01-01',
              'anthropic-beta':
                'example-beta',
            },
          }),
        );
      },
    );

    it(
      'rejects malformed Anthropic version values',
      async () => {
        const {
          runtime,
          execute,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        await expect(
          service.execute({
            configuration:
              createConfiguration(),
            anthropicVersion:
              'latest',
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
        ).rejects.toEqual(
          expect.objectContaining({
            code:
              'INVALID_ANTHROPIC_VERSION',
          }),
        );

        expect(
          execute,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'does not identify or register a concrete provider',
      () => {
        const {
          runtime,
        } =
          createRuntime();

        const service =
          new AnthropicMessagesProtocolService(
            runtime,
          );

        expect(
          service,
        ).not.toHaveProperty(
          'manifest',
        );

        expect(
          service,
        ).not.toHaveProperty(
          'name',
        );

        expect(
          service,
        ).not.toHaveProperty(
          'getProvider',
        );
      },
    );
  },
);
