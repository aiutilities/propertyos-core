import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  AnthropicMessagesProtocolService,
} from '../../protocols/anthropic-messages/anthropic-messages-protocol.service';
import {
  AnthropicMessagesExecutionOptions,
  AnthropicMessagesProtocolResult,
} from '../../types/anthropic-messages-protocol.types';
import {
  AiRequest,
} from '../../types/ai.types';
import {
  ClaudeAiProvider,
} from './claude-ai.provider';

describe(
  'Claude provider adapter',
  () => {
    const createProtocol =
      () => {
        const execute =
          jest.fn<
            (
              options:
                AnthropicMessagesExecutionOptions,
            ) => Promise<
              AnthropicMessagesProtocolResult
            >
          >(
            async (
              options,
            ) => ({
              request: {
                model:
                  options.request.model ??
                  options.configuration
                    .defaultModel ??
                  'claude-sonnet-5',
                messages: [
                  {
                    role:
                      'user',
                    content:
                      'Hello',
                  },
                ],
                max_tokens:
                  options.defaultMaxTokens ??
                  4_096,
                stream:
                  false,
              },
              response: {
                providerName:
                  'claude',
                model:
                  options.request.model ??
                  options.configuration
                    .defaultModel,
                content:
                  'Claude protocol response',
              },
              raw: {
                type:
                  'message',
                model:
                  options.request.model ??
                  options.configuration
                    .defaultModel,
                content: [
                  {
                    type:
                      'text',
                    text:
                      'Claude protocol response',
                  },
                ],
              },
            }),
          );

        return {
          protocol: {
            execute,
          } as unknown as
            AnthropicMessagesProtocolService,
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
          new ClaudeAiProvider(
            protocol,
          );

        expect(
          provider.name,
        ).toBe(
          'claude',
        );

        expect(
          provider.displayName,
        ).toBe(
          'Claude',
        );

        expect(
          provider.manifest
            .provider.id,
        ).toBe(
          'propertyos.claude',
        );

        expect(
          provider.manifest
            .provider.vendor,
        ).toBe(
          'Anthropic',
        );
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
          new ClaudeAiProvider(
            protocol,
          );

        expect(
          provider.manifest
            .manifestVersion,
        ).toBeTruthy();

        expect(
          provider.manifest
            .compatibility
            .propertyOsVersion,
        ).toBe(
          '^0.1.0',
        );

        expect(
          provider.manifest
            .execution
            .supportedModes,
        ).toEqual([
          'LIVE',
        ]);

        expect(
          provider.manifest
            .capabilities,
        ).toEqual(
          provider.capabilities,
        );
      },
    );

    it(
      'declares current pinned Claude model identifiers',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new ClaudeAiProvider(
            protocol,
          );

        expect(
          provider.manifest
            .models.map(
              (model) =>
                model.id,
            ),
        ).toEqual([
          'claude-sonnet-5',
          'claude-opus-4-8',
        ]);

        expect(
          provider.getProvider()
            .defaultModel,
        ).toBe(
          'claude-sonnet-5',
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
          new ClaudeAiProvider(
            protocol,
          );

        expect(
          provider.getProvider()
            .status,
        ).toBe(
          'INACTIVE',
        );

        expect(
          provider
            .getRuntimeConfiguration()
            .enabled,
        ).toBe(
          false,
        );

        expect(
          provider
            .getRuntimeConfiguration()
            .liveExecutionAuthorized,
        ).toBe(
          false,
        );
      },
    );

    it(
      'publishes a disabled native Anthropic runtime configuration',
      () => {
        const {
          protocol,
        } =
          createProtocol();

        const provider =
          new ClaudeAiProvider(
            protocol,
          );

        expect(
          provider
            .getRuntimeConfiguration(),
        ).toEqual(
          expect.objectContaining({
            providerName:
              'claude',
            enabled:
              false,
            priority:
              130,
            defaultModel:
              'claude-sonnet-5',
            baseUrl:
              'https://api.anthropic.com',
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
          }),
        );
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
          new ClaudeAiProvider(
            protocol,
          );

        const first =
          provider
            .getRuntimeConfiguration();

        const second =
          provider
            .getRuntimeConfiguration();

        expect(
          first,
        ).not.toBe(
          second,
        );

        expect(
          first.credential,
        ).not.toBe(
          second.credential,
        );

        expect(
          first.metadata,
        ).not.toBe(
          second.metadata,
        );

        first.credential
          .variableName =
          'CHANGED';

        expect(
          provider
            .getRuntimeConfiguration()
            .credential
            .variableName,
        ).toBe(
          'ANTHROPIC_API_KEY',
        );
      },
    );

    it(
      'delegates generation to the native Anthropic protocol',
      async () => {
        const {
          protocol,
          execute,
        } =
          createProtocol();

        const provider =
          new ClaudeAiProvider(
            protocol,
          );

        const request:
          AiRequest = {
            model:
              'claude-opus-4-8',
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
              800,
          };

        const response =
          await provider.generate(
            request,
          );

        expect(
          execute,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          execute.mock
            .calls[0][0],
        ).toEqual(
          expect.objectContaining({
            path:
              '/v1/messages',
            anthropicVersion:
              '2023-06-01',
            defaultMaxTokens:
              4_096,
            request,
          }),
        );

        expect(
          execute.mock
            .calls[0][0]
            .configuration,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'claude',
            enabled:
              false,
            liveExecutionAuthorized:
              false,
          }),
        );

        expect(
          response,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'claude',
            content:
              'Claude protocol response',
          }),
        );
      },
    );

    it(
      'does not read credentials during construction or discovery',
      () => {
        const original =
          process.env
            .ANTHROPIC_API_KEY;

        process.env
          .ANTHROPIC_API_KEY =
          'discovery-secret';

        try {
          const {
            protocol,
            execute,
          } =
            createProtocol();

          const provider =
            new ClaudeAiProvider(
              protocol,
            );

          provider.getProvider();
          provider.getRuntimeConfiguration();

          expect(
            execute,
          ).not.toHaveBeenCalled();

          expect(
            provider.manifest
              .metadata,
          ).toEqual(
            expect.objectContaining({
              credentialVariable:
                'ANTHROPIC_API_KEY',
              runtimeEnabled:
                false,
              liveExecutionAuthorized:
                false,
            }),
          );
        } finally {
          if (
            original ===
              undefined
          ) {
            delete process.env
              .ANTHROPIC_API_KEY;
          } else {
            process.env
              .ANTHROPIC_API_KEY =
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
          new ClaudeAiProvider(
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
