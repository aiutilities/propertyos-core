import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  AiContextBudgetError,
} from '../errors/ai-context-budget.error';
import {
  AiTokenBudgetService,
} from '../tokenization/ai-token-budget.service';
import {
  AiContextAssemblyService,
} from './ai-context-assembly.service';

describe(
  'AI token budget service',
  () => {
    it(
      'estimates empty text as zero tokens',
      () => {
        const service =
          new AiTokenBudgetService();

        expect(
          service.estimateTextTokens(
            '',
          ),
        ).toBe(
          0,
        );
      },
    );

    it(
      'estimates text deterministically',
      () => {
        const service =
          new AiTokenBudgetService();

        expect(
          service.estimateTextTokens(
            'abcdefgh',
          ),
        ).toBe(
          2,
        );

        expect(
          service.estimateTextTokens(
            'abcdefgh',
          ),
        ).toBe(
          2,
        );
      },
    );

    it(
      'normalizes repeated whitespace',
      () => {
        const service =
          new AiTokenBudgetService();

        expect(
          service.estimateTextTokens(
            'a    b',
          ),
        ).toBe(
          service.estimateTextTokens(
            'a b',
          ),
        );
      },
    );

    it(
      'includes role content metadata and overhead in message estimates',
      () => {
        const service =
          new AiTokenBudgetService();

        expect(
          service.estimateMessageTokens({
            role:
              'USER',
            content:
              'Hello',
            metadata: {
              source:
                'test',
            },
          }),
        ).toBeGreaterThan(
          service.estimateTextTokens(
            'Hello',
          ),
        );
      },
    );

    it(
      'calculates prompt capacity',
      () => {
        const service =
          new AiTokenBudgetService();

        expect(
          service.calculateBudget({
            modelProfile: {
              provider:
                'openai',
              model:
                'example',
              contextWindowTokens:
                1000,
            },
            reservedCompletionTokens:
              200,
            safetyBufferTokens:
              100,
          }),
        ).toEqual({
          provider:
            'openai',
          model:
            'example',
          contextWindowTokens:
            1000,
          reservedCompletionTokens:
            200,
          safetyBufferTokens:
            100,
          maximumPromptTokens:
            700,
        });
      },
    );

    it(
      'uses the default safety buffer',
      () => {
        const service =
          new AiTokenBudgetService();

        const budget =
          service.calculateBudget({
            modelProfile: {
              provider:
                'openai',
              model:
                'example',
              contextWindowTokens:
                1000,
            },
            reservedCompletionTokens:
              200,
          });

        expect(
          budget.safetyBufferTokens,
        ).toBe(
          256,
        );

        expect(
          budget.maximumPromptTokens,
        ).toBe(
          544,
        );
      },
    );

    it.each([
      0,
      127,
      1.5,
      10_000_001,
    ])(
      'rejects invalid context-window size %s',
      value => {
        const service =
          new AiTokenBudgetService();

        expect(
          () =>
            service.calculateBudget({
              modelProfile: {
                provider:
                  'openai',
                model:
                  'example',
                contextWindowTokens:
                  value,
              },
              reservedCompletionTokens:
                1,
              safetyBufferTokens:
                0,
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONTEXT_INVALID_MODEL_PROFILE',
          }),
        );
      },
    );

    it.each([
      0,
      -1,
      1.5,
    ])(
      'rejects invalid reserved completion %s',
      value => {
        const service =
          new AiTokenBudgetService();

        expect(
          () =>
            service.calculateBudget({
              modelProfile: {
                provider:
                  'openai',
                model:
                  'example',
                contextWindowTokens:
                  1000,
              },
              reservedCompletionTokens:
                value,
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONTEXT_INVALID_BUDGET',
          }),
        );
      },
    );

    it.each([
      -1,
      1.5,
    ])(
      'rejects invalid safety buffer %s',
      value => {
        const service =
          new AiTokenBudgetService();

        expect(
          () =>
            service.calculateBudget({
              modelProfile: {
                provider:
                  'openai',
                model:
                  'example',
                contextWindowTokens:
                  1000,
              },
              reservedCompletionTokens:
                1,
              safetyBufferTokens:
                value,
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONTEXT_INVALID_BUDGET',
          }),
        );
      },
    );

    it(
      'rejects a fully exhausted context window',
      () => {
        const service =
          new AiTokenBudgetService();

        expect(
          () =>
            service.calculateBudget({
              modelProfile: {
                provider:
                  'openai',
                model:
                  'example',
                contextWindowTokens:
                  128,
              },
              reservedCompletionTokens:
                64,
              safetyBufferTokens:
                64,
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONTEXT_INVALID_BUDGET',
          }),
        );
      },
    );
  },
);

describe(
  'AI context assembly service',
  () => {
    const profile = {
      provider:
        'openai',
      model:
        'test-model',
      contextWindowTokens:
        512,
    };

    it(
      'assembles a system prompt and conversation messages',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              64,
            safetyBufferTokens:
              0,
            systemPrompt:
              'You are helpful.',
            messages: [
              {
                role:
                  'USER',
                content:
                  'Hello',
              },
            ],
          });

        expect(
          result.messages.map(
            message =>
              message.role,
          ),
        ).toEqual([
          'SYSTEM',
          'USER',
        ]);

        expect(
          result.evidence
            .latestMessagePreserved,
        ).toBe(
          true,
        );
      },
    );

    it(
      'preserves supplied system messages',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              64,
            safetyBufferTokens:
              0,
            messages: [
              {
                role:
                  'SYSTEM',
                content:
                  'Policy',
              },
              {
                role:
                  'USER',
                content:
                  'Question',
              },
            ],
          });

        expect(
          result.messages[0]
            .preservedReason,
        ).toBe(
          'SYSTEM',
        );
      },
    );

    it(
      'preserves multiple system messages',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              64,
            safetyBufferTokens:
              0,
            messages: [
              {
                role:
                  'SYSTEM',
                content:
                  'Policy one',
              },
              {
                role:
                  'SYSTEM',
                content:
                  'Policy two',
              },
              {
                role:
                  'USER',
                content:
                  'Question',
              },
            ],
          });

        expect(
          result.evidence
            .systemMessageCount,
        ).toBe(
          2,
        );
      },
    );

    it(
      'retains all messages when they fit',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              64,
            safetyBufferTokens:
              0,
            messages: [
              {
                role:
                  'USER',
                content:
                  'one',
              },
              {
                role:
                  'ASSISTANT',
                content:
                  'two',
              },
              {
                role:
                  'USER',
                content:
                  'three',
              },
            ],
          });

        expect(
          result.evidence
            .truncationOccurred,
        ).toBe(
          false,
        );

        expect(
          result.evidence
            .retainedMessageCount,
        ).toBe(
          3,
        );
      },
    );

    it(
      'drops oldest non-system messages first',
      () => {
        const service =
          new AiContextAssemblyService();

        const longText =
          'x'.repeat(
            220,
          );

        const result =
          service.assemble({
            modelProfile: {
              ...profile,
              contextWindowTokens:
                160,
            },
            reservedCompletionTokens:
              32,
            safetyBufferTokens:
              0,
            messages: [
              {
                role:
                  'USER',
                content:
                  longText,
              },
              {
                role:
                  'ASSISTANT',
                content:
                  longText,
              },
              {
                role:
                  'USER',
                content:
                  'latest',
              },
            ],
          });

        expect(
          result.evidence
            .truncationOccurred,
        ).toBe(
          true,
        );

        expect(
          result.messages[
            result.messages.length -
            1
          ].content,
        ).toBe(
          'latest',
        );
      },
    );

    it(
      'preserves the latest message under truncation',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile: {
              ...profile,
              contextWindowTokens:
                160,
            },
            reservedCompletionTokens:
              32,
            safetyBufferTokens:
              0,
            messages: [
              {
                role:
                  'USER',
                content:
                  'x'.repeat(
                    250,
                  ),
              },
              {
                role:
                  'USER',
                content:
                  'latest request',
              },
            ],
          });

        expect(
          result.evidence
            .latestMessagePreserved,
        ).toBe(
          true,
        );

        expect(
          result.messages.some(
            message =>
              message.content ===
              'latest request',
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'preserves chronological ordering',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              64,
            safetyBufferTokens:
              0,
            messages: [
              {
                role:
                  'USER',
                content:
                  'one',
              },
              {
                role:
                  'ASSISTANT',
                content:
                  'two',
              },
              {
                role:
                  'USER',
                content:
                  'three',
              },
            ],
          });

        expect(
          result.messages.map(
            message =>
              message.content,
          ),
        ).toEqual([
          'one',
          'two',
          'three',
        ]);
      },
    );

    it(
      'reports deterministic assembly evidence',
      () => {
        const service =
          new AiContextAssemblyService();

        const request = {
          modelProfile:
            profile,
          reservedCompletionTokens:
            64,
          safetyBufferTokens:
            0,
          messages: [
            {
              role:
                'USER' as const,
              content:
                'Hello',
            },
          ],
        };

        expect(
          service.assemble(
            request,
          ),
        ).toEqual(
          service.assemble(
            request,
          ),
        );
      },
    );

    it(
      'reports remaining prompt capacity',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              64,
            safetyBufferTokens:
              0,
            messages: [
              {
                role:
                  'USER',
                content:
                  'Hello',
              },
            ],
          });

        expect(
          result.evidence
            .estimatedRemainingPromptTokens,
        ).toBe(
          result.evidence
            .maximumPromptTokens -
          result.evidence
            .estimatedPromptTokens,
        );
      },
    );

    it(
      'respects reserved completion tokens',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              128,
            safetyBufferTokens:
              0,
            messages: [
              {
                role:
                  'USER',
                content:
                  'Hello',
              },
            ],
          });

        expect(
          result.evidence
            .maximumPromptTokens,
        ).toBe(
          384,
        );
      },
    );

    it(
      'respects safety-buffer tokens',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              64,
            safetyBufferTokens:
              32,
            messages: [
              {
                role:
                  'USER',
                content:
                  'Hello',
              },
            ],
          });

        expect(
          result.evidence
            .maximumPromptTokens,
        ).toBe(
          416,
        );
      },
    );

    it(
      'preserves message metadata',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              64,
            safetyBufferTokens:
              0,
            messages: [
              {
                role:
                  'TOOL',
                content:
                  'Tool result',
                metadata: {
                  toolName:
                    'search',
                },
              },
            ],
          });

        expect(
          result.messages[0]
            .metadata,
        ).toEqual({
          toolName:
            'search',
        });
      },
    );

    it(
      'does not mutate input messages',
      () => {
        const service =
          new AiContextAssemblyService();

        const messages = [
          {
            role:
              'USER' as const,
            content:
              'Original',
            metadata: {
              source:
                'test',
            },
          },
        ];

        const snapshot =
          JSON.stringify(
            messages,
          );

        service.assemble({
          modelProfile:
            profile,
          reservedCompletionTokens:
            64,
          safetyBufferTokens:
            0,
          messages,
        });

        expect(
          JSON.stringify(
            messages,
          ),
        ).toBe(
          snapshot,
        );
      },
    );

    it(
      'returns detached metadata copies',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              64,
            safetyBufferTokens:
              0,
            messages: [
              {
                role:
                  'USER',
                content:
                  'Hello',
                metadata: {
                  source:
                    'original',
                },
              },
            ],
          });

        (
          result.messages[0]
            .metadata as
            Record<
              string,
              string
            >
        ).source =
          'changed';

        const next =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              64,
            safetyBufferTokens:
              0,
            messages: [
              {
                role:
                  'USER',
                content:
                  'Hello',
                metadata: {
                  source:
                    'original',
                },
              },
            ],
          });

        expect(
          next.messages[0]
            .metadata,
        ).toEqual({
          source:
            'original',
        });
      },
    );

    it(
      'rejects empty context input',
      () => {
        const service =
          new AiContextAssemblyService();

        expect(
          () =>
            service.assemble({
              modelProfile:
                profile,
              reservedCompletionTokens:
                64,
              safetyBufferTokens:
                0,
              messages: [],
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONTEXT_EMPTY_MESSAGES',
          }),
        );
      },
    );

    it(
      'allows system-prompt-only context',
      () => {
        const service =
          new AiContextAssemblyService();

        const result =
          service.assemble({
            modelProfile:
              profile,
            reservedCompletionTokens:
              64,
            safetyBufferTokens:
              0,
            systemPrompt:
              'System only',
            messages: [],
          });

        expect(
          result.messages,
        ).toHaveLength(
          1,
        );

        expect(
          result.messages[0]
            .role,
        ).toBe(
          'SYSTEM',
        );
      },
    );

    it(
      'rejects mandatory context that cannot fit',
      () => {
        const service =
          new AiContextAssemblyService();

        expect(
          () =>
            service.assemble({
              modelProfile: {
                ...profile,
                contextWindowTokens:
                  128,
              },
              reservedCompletionTokens:
                32,
              safetyBufferTokens:
                0,
              systemPrompt:
                'x'.repeat(
                  400,
                ),
              messages: [
                {
                  role:
                    'USER',
                  content:
                    'latest',
                },
              ],
            }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_CONTEXT_MANDATORY_CONTENT_EXCEEDS_BUDGET',
          }),
        );
      },
    );

    it(
      'rejects empty message content',
      () => {
        const service =
          new AiContextAssemblyService();

        expect(
          () =>
            service.assemble({
              modelProfile:
                profile,
              reservedCompletionTokens:
                64,
              safetyBufferTokens:
                0,
              messages: [
                {
                  role:
                    'USER',
                  content:
                    ' ',
                },
              ],
            }),
        ).toThrow(
          'Message content is required',
        );
      },
    );

    it(
      'uses structured context-budget errors',
      () => {
        const error =
          new AiContextBudgetError(
            'AI_CONTEXT_INVALID_BUDGET',
            'Invalid budget',
          );

        expect(
          error.name,
        ).toBe(
          'AiContextBudgetError',
        );

        expect(
          error.code,
        ).toBe(
          'AI_CONTEXT_INVALID_BUDGET',
        );
      },
    );
  },
);
