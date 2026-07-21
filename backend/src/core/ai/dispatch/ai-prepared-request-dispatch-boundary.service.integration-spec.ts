import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  AiPreparedRequestDispatchError,
} from '../errors/ai-prepared-request-dispatch.error';

import {
  AiPreparedProviderRequest,
} from '../types/ai-request-preparation.types';

import {
  AiPreparedRequestDispatchBoundaryService,
} from './ai-prepared-request-dispatch-boundary.service';

describe(
  'AI prepared request dispatch boundary service',
  () => {
    const service =
      new AiPreparedRequestDispatchBoundaryService();

    const preparedRequest =
      (): AiPreparedProviderRequest =>
        Object.freeze({
          requestId:
            'airq_12345678',
          provider:
            'openai',
          model:
            'gpt-test',
          messages:
            Object.freeze([
              Object.freeze({
                role:
                  'USER' as const,
                content:
                  'Hello',
              }),
            ]),
          temperature:
            0.2,
          topP:
            1,
          maxOutputTokens:
            1024,
          stopSequences:
            Object.freeze([]),
          evidence:
            Object.freeze({
              requestId:
                'airq_12345678',
              provider:
                'openai',
              model:
                'gpt-test',
              messageCount:
                1,
              systemPromptPresent:
                false,
              temperature:
                0.2,
              topP:
                1,
              maxOutputTokens:
                1024,
              stopSequenceCount:
                0,
              preparedAt:
                '2026-07-21T00:00:00.000Z',
              normalizations:
                Object.freeze([]),
            }),
        });

    const baseInput = () => ({
      request:
        preparedRequest(),
      target: {
        provider:
          'openai',
        runtimeProvider:
          'openai-runtime',
        protocol:
          'OPENAI_COMPATIBLE',
        enabled:
          true,
      },
      dispatchedAt:
        '2026-07-21T00:00:00.000Z',
    });

    it(
      'creates a dispatch envelope',
      () => {
        const result =
          service.createEnvelope(
            baseInput(),
          );

        expect(result).toEqual(
          expect.objectContaining({
            provider:
              'openai',
            runtimeProvider:
              'openai-runtime',
            protocol:
              'OPENAI_COMPATIBLE',
            model:
              'gpt-test',
            requestId:
              'airq_12345678',
          }),
        );
      },
    );

    it(
      'preserves the prepared request reference',
      () => {
        const input =
          baseInput();

        const result =
          service.createEnvelope(
            input,
          );

        expect(
          result.request,
        ).toBe(
          input.request,
        );
      },
    );

    it(
      'normalizes target identifiers',
      () => {
        const result =
          service.createEnvelope({
            ...baseInput(),
            target: {
              provider:
                ' openai ',
              runtimeProvider:
                ' openai-runtime ',
              protocol:
                ' openai-compatible ',
            },
          });

        expect(
          result.provider,
        ).toBe('openai');

        expect(
          result.runtimeProvider,
        ).toBe(
          'openai-runtime',
        );

        expect(
          result.protocol,
        ).toBe(
          'OPENAI_COMPATIBLE',
        );
      },
    );

    it(
      'supports the Anthropic messages protocol',
      () => {
        const request =
          Object.freeze({
            ...preparedRequest(),
            provider:
              'claude',
            model:
              'claude-test',
            evidence:
              Object.freeze({
                ...preparedRequest()
                  .evidence,
                provider:
                  'claude',
                model:
                  'claude-test',
              }),
          });

        const result =
          service.createEnvelope({
            request,
            target: {
              provider:
                'claude',
              runtimeProvider:
                'claude-runtime',
              protocol:
                'ANTHROPIC_MESSAGES',
            },
            dispatchedAt:
              '2026-07-21T00:00:00.000Z',
          });

        expect(
          result.protocol,
        ).toBe(
          'ANTHROPIC_MESSAGES',
        );
      },
    );

    it(
      'uses the prepared request model when the target omits one',
      () => {
        const result =
          service.createEnvelope(
            baseInput(),
          );

        expect(
          result.model,
        ).toBe('gpt-test');
      },
    );

    it(
      'accepts an explicitly matching target model',
      () => {
        const result =
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              model:
                'gpt-test',
            },
          });

        expect(
          result.model,
        ).toBe('gpt-test');
      },
    );

    it(
      'creates deterministic dispatch ids',
      () => {
        const first =
          service.createEnvelope(
            baseInput(),
          );

        const second =
          service.createEnvelope(
            baseInput(),
          );

        expect(
          first.dispatchId,
        ).toBe(
          second.dispatchId,
        );
      },
    );

    it(
      'changes dispatch ids when the target changes',
      () => {
        const first =
          service.createEnvelope(
            baseInput(),
          );

        const second =
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              runtimeProvider:
                'different-runtime',
            },
          });

        expect(
          first.dispatchId,
        ).not.toBe(
          second.dispatchId,
        );
      },
    );

    it(
      'preserves a supplied dispatch id',
      () => {
        const result =
          service.createEnvelope({
            ...baseInput(),
            dispatchId:
              'dispatch-123',
          });

        expect(
          result.dispatchId,
        ).toBe(
          'dispatch-123',
        );
      },
    );

    it(
      'trims a supplied dispatch id',
      () => {
        const result =
          service.createEnvelope({
            ...baseInput(),
            dispatchId:
              ' dispatch-123 ',
          });

        expect(
          result.dispatchId,
        ).toBe(
          'dispatch-123',
        );

        expect(
          result.evidence
            .normalizations,
        ).toContain(
          'dispatchId:trimmed',
        );
      },
    );

    it(
      'normalizes dispatchedAt timestamps',
      () => {
        const result =
          service.createEnvelope({
            ...baseInput(),
            dispatchedAt:
              '2026-07-21T05:30:00+05:30',
          });

        expect(
          result.evidence
            .dispatchedAt,
        ).toBe(
          '2026-07-21T00:00:00.000Z',
        );
      },
    );

    it(
      'creates dispatch evidence',
      () => {
        const result =
          service.createEnvelope(
            baseInput(),
          );

        expect(
          result.evidence,
        ).toEqual(
          expect.objectContaining({
            dispatchId:
              result.dispatchId,
            requestId:
              'airq_12345678',
            provider:
              'openai',
            runtimeProvider:
              'openai-runtime',
            protocol:
              'OPENAI_COMPATIBLE',
            model:
              'gpt-test',
            messageCount:
              1,
            maxOutputTokens:
              1024,
            dispatchedAt:
              '2026-07-21T00:00:00.000Z',
          }),
        );
      },
    );

    it(
      'reports completed validations',
      () => {
        const result =
          service.createEnvelope(
            baseInput(),
          );

        expect(
          result.evidence
            .validations,
        ).toEqual([
          'target:enabled',
          'provider:matched',
          'model:matched',
          'protocol:supported',
          'request:prepared',
        ]);
      },
    );

    it(
      'clones target metadata',
      () => {
        const metadata = {
          region:
            'global',
        };

        const result =
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              metadata,
            },
          });

        metadata.region =
          'changed';

        expect(
          result.targetMetadata,
        ).toEqual({
          region:
            'global',
        });
      },
    );

    it(
      'clones envelope metadata',
      () => {
        const metadata = {
          source:
            'orchestrator',
        };

        const result =
          service.createEnvelope({
            ...baseInput(),
            metadata,
          });

        metadata.source =
          'changed';

        expect(
          result.metadata,
        ).toEqual({
          source:
            'orchestrator',
        });
      },
    );

    it(
      'returns a frozen envelope',
      () => {
        const result =
          service.createEnvelope(
            baseInput(),
          );

        expect(
          Object.isFrozen(
            result,
          ),
        ).toBe(true);
      },
    );

    it(
      'returns frozen evidence',
      () => {
        const result =
          service.createEnvelope(
            baseInput(),
          );

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

        expect(
          Object.isFrozen(
            result.evidence
              .normalizations,
          ),
        ).toBe(true);
      },
    );

    it(
      'does not mutate the target',
      () => {
        const input =
          baseInput();

        service.createEnvelope(
          input,
        );

        expect(
          input.target,
        ).toEqual({
          provider:
            'openai',
          runtimeProvider:
            'openai-runtime',
          protocol:
            'OPENAI_COMPATIBLE',
          enabled:
            true,
        });
      },
    );

    it(
      'rejects a missing prepared request',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            request:
              undefined as unknown as AiPreparedProviderRequest,
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_REQUEST_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects a malformed prepared request',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            request: {
              ...preparedRequest(),
              messages: [],
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_REQUEST_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects a missing target',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            target:
              undefined as unknown as ReturnType<
                typeof baseInput
              >['target'],
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_TARGET_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects a missing target provider',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              provider:
                '',
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_PROVIDER_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects a missing runtime provider',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              runtimeProvider:
                '',
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_RUNTIME_PROVIDER_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects a missing protocol',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              protocol:
                '',
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_PROTOCOL_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects an unsupported protocol',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              protocol:
                'UNSUPPORTED',
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_UNSUPPORTED_PROTOCOL',
          }),
        );
      },
    );

    it(
      'rejects a disabled target',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              enabled:
                false,
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_TARGET_DISABLED',
          }),
        );
      },
    );

    it(
      'rejects a provider mismatch',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              provider:
                'deepseek',
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_PROVIDER_MISMATCH',
          }),
        );
      },
    );

    it(
      'rejects a model mismatch',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              model:
                'different-model',
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_MODEL_MISMATCH',
          }),
        );
      },
    );

    it(
      'rejects an empty explicit model',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              model:
                ' ',
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_MODEL_MISMATCH',
          }),
        );
      },
    );

    it(
      'rejects an invalid dispatchedAt timestamp',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            dispatchedAt:
              'not-a-date',
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_INVALID_TIMESTAMP',
          }),
        );
      },
    );

    it(
      'rejects an empty supplied dispatch id',
      () => {
        expect(() =>
          service.createEnvelope({
            ...baseInput(),
            dispatchId:
              ' ',
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_DISPATCH_INVALID_ID',
          }),
        );
      },
    );

    it(
      'uses structured dispatch errors',
      () => {
        try {
          service.createEnvelope({
            ...baseInput(),
            target: {
              ...baseInput()
                .target,
              provider:
                '',
            },
          });

          throw new Error(
            'Expected dispatch to fail',
          );
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            AiPreparedRequestDispatchError,
          );
        }
      },
    );
  },
);
