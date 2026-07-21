import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  AiProviderPort,
} from '../contracts/ai-provider.contract';

import {
  AiDispatchExecutionError,
} from '../errors/ai-dispatch-execution.error';

import {
  AiProviderRegistry,
} from '../registry/ai-provider.registry';

import {
  AiExecutionContext,
} from '../types/ai-execution-context.types';

import {
  AiPreparedRequestDispatchEnvelope,
} from '../types/ai-prepared-request-dispatch.types';

import {
  AiResponse,
} from '../types/ai.types';

import {
  AiDispatchExecutionCoordinatorService,
} from './ai-dispatch-execution-coordinator.service';

describe(
  'AI dispatch execution coordinator',
  () => {
    const createEnvelope =
      (
        overrides:
          Partial<
            AiPreparedRequestDispatchEnvelope
          > = {},
      ):
        AiPreparedRequestDispatchEnvelope => {
        const request =
          Object.freeze({
            requestId:
              'airq_12345678',
            provider:
              'openai',
            model:
              'model-a',
            messages:
              Object.freeze([
                Object.freeze({
                  role:
                    'SYSTEM' as const,
                  content:
                    'Follow instructions',
                }),
                Object.freeze({
                  role:
                    'USER' as const,
                  content:
                    'Hello',
                  name:
                    'user-one',
                  metadata:
                    Object.freeze({
                      source:
                        'test',
                    }),
                }),
              ]),
            systemPrompt:
              'System prompt',
            temperature:
              0.2,
            topP:
              0.9,
            maxOutputTokens:
              512,
            stopSequences:
              Object.freeze([
                'STOP',
              ]),
            metadata:
              Object.freeze({
                tenantId:
                  'tenant-1',
              }),
            evidence:
              Object.freeze({
                requestId:
                  'airq_12345678',
                provider:
                  'openai',
                model:
                  'model-a',
                messageCount:
                  2,
                systemPromptPresent:
                  true,
                temperature:
                  0.2,
                topP:
                  0.9,
                maxOutputTokens:
                  512,
                stopSequenceCount:
                  1,
                preparedAt:
                  '2026-07-21T00:00:00.000Z',
                normalizations:
                  Object.freeze([]),
              }),
          });

        return Object.freeze({
          dispatchId:
            'aidp_12345678',
          requestId:
            request.requestId,
          provider:
            request.provider,
          runtimeProvider:
            'openai-runtime',
          protocol:
            'OPENAI_COMPATIBLE' as const,
          model:
            request.model,
          request,
          evidence:
            Object.freeze({
              dispatchId:
                'aidp_12345678',
              requestId:
                request.requestId,
              provider:
                request.provider,
              runtimeProvider:
                'openai-runtime',
              protocol:
                'OPENAI_COMPATIBLE' as const,
              model:
                request.model,
              messageCount:
                2,
              maxOutputTokens:
                512,
              dispatchedAt:
                '2026-07-21T00:00:00.000Z',
              validations:
                Object.freeze([]),
              normalizations:
                Object.freeze([]),
            }),
          ...overrides,
        });
      };

    const createExecutionContext =
      (
        overrides:
          Partial<
            AiExecutionContext
          > = {},
      ):
        AiExecutionContext =>
        Object.freeze({
          tenantId:
            'tenant-1',
          requestId:
            'airq_12345678',
          correlationId:
            'correlation-1',
          executionId:
            'execution-1',
          attempt:
            1,
          capability:
            'CHAT',
          classification:
            'INTERNAL',
          executionMode:
            'LIVE',
          timeoutMs:
            30_000,
          timestamps:
            Object.freeze({
              createdAt:
                '2026-07-21T00:00:00.000Z',
              startedAt:
                '2026-07-21T00:00:00.000Z',
            }),
          metadata:
            Object.freeze({
              source:
                'orchestrator',
            }),
          ...overrides,
        });

    const createResponse =
      (): AiResponse =>
        ({
          id:
            'response-1',
          providerName:
            'openai',
          model:
            'model-a',
          content:
            'Completed',
          usage: {
            inputTokens:
              10,
            outputTokens:
              5,
            totalTokens:
              15,
          },
          createdAt:
            '2026-07-21T00:00:01.000Z',
        }) as AiResponse;

    const createProvider =
      (
        generate:
          AiProviderPort['generate'] =
            jest.fn(
              async () =>
                createResponse(),
            ),
      ):
        AiProviderPort =>
        ({
          name:
            'openai',
          displayName:
            'OpenAI',
          capabilities: [
            'CHAT',
          ],
          manifest: {
            manifestVersion:
              '1.0.0',
            provider: {
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
              description:
                'Test provider',
            },
            compatibility: {
              propertyOsVersion:
                '^0.1.0',
              aiContractVersion:
                '^1.0.0',
            },
            execution: {
              supportedModes: [
                'LIVE',
              ],
            },
            capabilities: [
              'CHAT',
            ],
            models: [
              {
                id:
                  'model-a',
                displayName:
                  'Model A',
                contextWindow:
                  10_000,
                maxInputTokens:
                  8_000,
                maxOutputTokens:
                  2_000,
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
                8_000,
              maxOutputTokens:
                2_000,
              maxTotalTokens:
                10_000,
            },
          },
          getProvider: () => ({
            id:
              'openai',
            name:
              'openai',
            displayName:
              'OpenAI',
            status:
              'ACTIVE',
            capabilities: [
              'CHAT',
            ],
            defaultModel:
              'model-a',
          }),
          generate,
        }) as AiProviderPort;

    const createService =
      (
        provider:
          AiProviderPort | null =
            createProvider(),
      ) => {
        const registry = {
          get:
            jest.fn(
              () =>
                provider ??
                undefined,
            ),
        } as unknown as
          AiProviderRegistry;

        return {
          registry,
          service:
            new AiDispatchExecutionCoordinatorService(
              registry,
            ),
        };
      };

    it(
      'uses execution identity from the immutable context',
      async () => {
        const {
          service,
        } =
          createService();

        const result =
          await service.execute({
            envelope:
              createEnvelope(),
            context:
              createExecutionContext({
                executionId:
                  'execution-context-1',
                timestamps:
                  Object.freeze({
                    createdAt:
                      '2026-07-21T00:00:00.000Z',
                    startedAt:
                      '2026-07-21T00:00:01.000Z',
                  }),
              }),
          });

        expect(
          result.executionId,
        ).toBe(
          'execution-context-1',
        );

        expect(
          result.evidence.startedAt,
        ).toBe(
          '2026-07-21T00:00:01.000Z',
        );
      },
    );

    it(
      'projects immutable execution context into result metadata',
      async () => {
        const {
          service,
        } =
          createService();

        const result =
          await service.execute({
            envelope:
              createEnvelope(),
            context:
              createExecutionContext(),
          });

        expect(
          result.metadata,
        ).toEqual(
          expect.objectContaining({
            source:
              'orchestrator',
            tenantId:
              'tenant-1',
            requestId:
              'airq_12345678',
            correlationId:
              'correlation-1',
            executionId:
              'execution-1',
            attempt:
              1,
            capability:
              'CHAT',
            dataClassification:
              'INTERNAL',
            executionMode:
              'LIVE',
            timeoutMs:
              30_000,
          }),
        );

        expect(
          Object.isFrozen(
            result.metadata,
          ),
        ).toBe(true);
      },
    );

    it(
      'rejects a structurally invalid execution context',
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.execute({
            envelope:
              createEnvelope(),
            context:
              createExecutionContext({
                attempt:
                  0,
              }),
          }),
        ).rejects.toEqual(
          expect.objectContaining({
            code:
              'AI_DISPATCH_EXECUTION_INVALID_CONTEXT',
          }),
        );
      },
    );

    it(
      'rejects a context whose request identity differs from the envelope',
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.execute({
            envelope:
              createEnvelope(),
            context:
              createExecutionContext({
                requestId:
                  'airq_different',
              }),
          }),
        ).rejects.toEqual(
          expect.objectContaining({
            code:
              'AI_DISPATCH_EXECUTION_CONTEXT_MISMATCH',
            details:
              expect.objectContaining({
                requestId:
                  'airq_12345678',
                contextRequestId:
                  'airq_different',
              }),
          }),
        );
      },
    );

    it(
      'executes a dispatch envelope through the registered provider',
      async () => {
        const provider =
          createProvider();

        const {
          service,
        } =
          createService(
            provider,
          );

        const result =
          await service.execute({
            envelope:
              createEnvelope(),
            startedAt:
              '2026-07-21T00:00:00.000Z',
          });

        expect(
          result.provider,
        ).toBe('openai');

        expect(
          result.response.content,
        ).toBe('Completed');

        expect(
          provider.generate,
        ).toHaveBeenCalledTimes(
          1,
        );
      },
    );

    it(
      'resolves the provider using the dispatch provider',
      async () => {
        const {
          service,
          registry,
        } =
          createService();

        await service.execute({
          envelope:
            createEnvelope(),
        });

        expect(
          registry.get,
        ).toHaveBeenCalledWith(
          'openai',
        );
      },
    );

    it(
      'translates prepared messages into the provider request',
      async () => {
        const generate:
          AiProviderPort['generate'] =
            jest.fn<
              AiProviderPort['generate']
            >(
              async (
                _request,
              ) =>
                createResponse(),
            );

        const {
          service,
        } =
          createService(
            createProvider(
              generate,
            ),
          );

        await service.execute({
          envelope:
            createEnvelope(),
        });

        expect(
          generate,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            providerName:
              'openai',
            model:
              'model-a',
            messages: [
              expect.objectContaining({
                role:
                  'SYSTEM',
                content:
                  'Follow instructions',
              }),
              expect.objectContaining({
                role:
                  'USER',
                content:
                  'Hello',
                name:
                  'user-one',
              }),
            ],
          }),
        );
      },
    );

    it(
      'maps prepared generation settings',
      async () => {
        const generate:
          AiProviderPort['generate'] =
            jest.fn<
              AiProviderPort['generate']
            >(
              async (
                _request,
              ) =>
                createResponse(),
            );

        const {
          service,
        } =
          createService(
            createProvider(
              generate,
            ),
          );

        await service.execute({
          envelope:
            createEnvelope(),
        });

        expect(
          generate,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            temperature:
              0.2,
            topP:
              0.9,
            maxTokens:
              512,
            stopSequences: [
              'STOP',
            ],
          }),
        );
      },
    );

    it(
      'propagates PropertyOS request identity through metadata',
      async () => {
        const generate:
          AiProviderPort['generate'] =
            jest.fn<
              AiProviderPort['generate']
            >(
              async (
                _request,
              ) =>
                createResponse(),
            );

        const {
          service,
        } =
          createService(
            createProvider(
              generate,
            ),
          );

        await service.execute({
          envelope:
            createEnvelope(),
        });

        expect(
          generate,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata:
              expect.objectContaining({
                tenantId:
                  'tenant-1',
                propertyOsRequestId:
                  'airq_12345678',
                propertyOsDispatchId:
                  'aidp_12345678',
                propertyOsRuntimeProvider:
                  'openai-runtime',
                propertyOsProtocol:
                  'OPENAI_COMPATIBLE',
              }),
          }),
        );
      },
    );

    it(
      'creates deterministic execution ids',
      async () => {
        const {
          service,
        } =
          createService();

        const first =
          await service.execute({
            envelope:
              createEnvelope(),
          });

        const second =
          await service.execute({
            envelope:
              createEnvelope(),
          });

        expect(
          first.executionId,
        ).toBe(
          second.executionId,
        );
      },
    );

    it(
      'preserves a supplied execution id',
      async () => {
        const {
          service,
        } =
          createService();

        const result =
          await service.execute({
            envelope:
              createEnvelope(),
            executionId:
              'execution-1',
          });

        expect(
          result.executionId,
        ).toBe(
          'execution-1',
        );
      },
    );

    it(
      'trims a supplied execution id',
      async () => {
        const {
          service,
        } =
          createService();

        const result =
          await service.execute({
            envelope:
              createEnvelope(),
            executionId:
              ' execution-1 ',
          });

        expect(
          result.executionId,
        ).toBe(
          'execution-1',
        );
      },
    );

    it(
      'normalizes the supplied start timestamp',
      async () => {
        const {
          service,
        } =
          createService();

        const result =
          await service.execute({
            envelope:
              createEnvelope(),
            startedAt:
              '2026-07-21T05:30:00+05:30',
          });

        expect(
          result.evidence
            .startedAt,
        ).toBe(
          '2026-07-21T00:00:00.000Z',
        );
      },
    );

    it(
      'creates successful execution evidence',
      async () => {
        const {
          service,
        } =
          createService();

        const result =
          await service.execute({
            envelope:
              createEnvelope(),
          });

        expect(
          result.evidence,
        ).toEqual(
          expect.objectContaining({
            executionId:
              result.executionId,
            dispatchId:
              'aidp_12345678',
            requestId:
              'airq_12345678',
            provider:
              'openai',
            runtimeProvider:
              'openai-runtime',
            protocol:
              'OPENAI_COMPATIBLE',
            model:
              'model-a',
            messageCount:
              2,
            outcome:
              'SUCCEEDED',
            providerResolved:
              true,
            providerInvoked:
              true,
          }),
        );
      },
    );

    it(
      'returns an immutable result and evidence',
      async () => {
        const {
          service,
        } =
          createService();

        const result =
          await service.execute({
            envelope:
              createEnvelope(),
          });

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            result.evidence,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            result.evidence
              .validations,
          ),
        ).toBe(true);
      },
    );

    it(
      'clones execution metadata',
      async () => {
        const metadata = {
          source:
            'test',
        };

        const {
          service,
        } =
          createService();

        const result =
          await service.execute({
            envelope:
              createEnvelope(),
            metadata,
          });

        metadata.source =
          'changed';

        expect(
          result.metadata,
        ).toEqual({
          source:
            'test',
        });
      },
    );

    it(
      'rejects a missing execution input',
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.execute(
            undefined as unknown as never,
          ),
        ).rejects.toMatchObject({
          code:
            'AI_DISPATCH_EXECUTION_INPUT_REQUIRED',
        });
      },
    );

    it(
      'rejects a missing envelope',
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.execute({
            envelope:
              undefined as unknown as
                AiPreparedRequestDispatchEnvelope,
          }),
        ).rejects.toMatchObject({
          code:
            'AI_DISPATCH_EXECUTION_ENVELOPE_REQUIRED',
        });
      },
    );

    it(
      'rejects inconsistent request identity',
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.execute({
            envelope:
              createEnvelope({
                requestId:
                  'different',
              }),
          }),
        ).rejects.toMatchObject({
          code:
            'AI_DISPATCH_EXECUTION_ENVELOPE_REQUIRED',
        });
      },
    );

    it(
      'rejects an empty supplied execution id',
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.execute({
            envelope:
              createEnvelope(),
            executionId:
              ' ',
          }),
        ).rejects.toMatchObject({
          code:
            'AI_DISPATCH_EXECUTION_INVALID_ID',
        });
      },
    );

    it(
      'rejects an invalid timestamp',
      async () => {
        const {
          service,
        } =
          createService();

        await expect(
          service.execute({
            envelope:
              createEnvelope(),
            startedAt:
              'not-a-date',
          }),
        ).rejects.toMatchObject({
          code:
            'AI_DISPATCH_EXECUTION_INVALID_TIMESTAMP',
        });
      },
    );

    it(
      'rejects an unregistered provider',
      async () => {
        const {
          service,
        } =
          createService(
            null,
          );

        await expect(
          service.execute({
            envelope:
              createEnvelope(),
          }),
        ).rejects.toMatchObject({
          code:
            'AI_DISPATCH_EXECUTION_PROVIDER_NOT_FOUND',
        });
      },
    );

    it(
      'rejects a resolved provider name mismatch',
      async () => {
        const provider = {
          ...createProvider(),
          name:
            'deepseek',
        } as AiProviderPort;

        const {
          service,
        } =
          createService(
            provider,
          );

        await expect(
          service.execute({
            envelope:
              createEnvelope(),
          }),
        ).rejects.toMatchObject({
          code:
            'AI_DISPATCH_EXECUTION_PROVIDER_MISMATCH',
        });
      },
    );

    it(
      'rejects an undeclared model',
      async () => {
        const envelope =
          createEnvelope({
            model:
              'unknown-model',
            request:
              Object.freeze({
                ...createEnvelope()
                  .request,
                model:
                  'unknown-model',
              }),
          });

        const {
          service,
        } =
          createService();

        await expect(
          service.execute({
            envelope,
          }),
        ).rejects.toMatchObject({
          code:
            'AI_DISPATCH_EXECUTION_MODEL_MISMATCH',
        });
      },
    );

    it(
      'normalizes provider failures',
      async () => {
        const provider =
          createProvider(
            jest.fn(
              async () => {
                throw new Error(
                  'provider unavailable',
                );
              },
            ),
          );

        const {
          service,
        } =
          createService(
            provider,
          );

        await expect(
          service.execute({
            envelope:
              createEnvelope(),
          }),
        ).rejects.toMatchObject({
          code:
            'AI_DISPATCH_EXECUTION_PROVIDER_FAILED',
          details:
            expect.objectContaining({
              causeMessage:
                'provider unavailable',
            }),
        });
      },
    );

    it(
      'uses structured execution errors',
      async () => {
        const {
          service,
        } =
          createService(
            null,
          );

        try {
          await service.execute({
            envelope:
              createEnvelope(),
          });

          throw new Error(
            'Expected execution to fail',
          );
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            AiDispatchExecutionError,
          );
        }
      },
    );
  },
);
