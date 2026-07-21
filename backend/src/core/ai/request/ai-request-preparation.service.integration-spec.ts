import {
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  AiRequestPreparationError,
} from '../errors/ai-request-preparation.error';

import {
  AiRequestPreparationService,
} from './ai-request-preparation.service';

describe(
  'AI request preparation service',
  () => {
    let service:
      AiRequestPreparationService;

    const baseInput = () => ({
      provider:
        'openai',
      model:
        'gpt-test',
      preparedAt:
        '2026-07-21T00:00:00.000Z',
      messages: [
        {
          role:
            'USER',
          content:
            'Hello',
        },
      ],
    });

    beforeEach(() => {
      service =
        new AiRequestPreparationService();
    });

    it(
      'prepares a provider request',
      () => {
        const result =
          service.prepare(
            baseInput(),
          );

        expect(result).toEqual(
          expect.objectContaining({
            provider:
              'openai',
            model:
              'gpt-test',
            temperature:
              0.2,
            topP:
              1,
            maxOutputTokens:
              1024,
          }),
        );
      },
    );

    it(
      'uses built-in generation defaults',
      () => {
        const result =
          service.prepare(
            baseInput(),
          );

        expect(
          result.temperature,
        ).toBe(0.2);

        expect(
          result.topP,
        ).toBe(1);

        expect(
          result.maxOutputTokens,
        ).toBe(1024);
      },
    );

    it(
      'uses supplied generation defaults',
      () => {
        const result =
          service.prepare({
            ...baseInput(),
            defaults: {
              temperature:
                0.4,
              topP:
                0.8,
              maxOutputTokens:
                500,
            },
          });

        expect(
          result.temperature,
        ).toBe(0.4);

        expect(
          result.topP,
        ).toBe(0.8);

        expect(
          result.maxOutputTokens,
        ).toBe(500);
      },
    );

    it(
      'gives explicit generation values precedence',
      () => {
        const result =
          service.prepare({
            ...baseInput(),
            defaults: {
              temperature:
                0.4,
              topP:
                0.8,
              maxOutputTokens:
                500,
            },
            generation: {
              temperature:
                0.7,
              topP:
                0.6,
              maxOutputTokens:
                700,
            },
          });

        expect(
          result.temperature,
        ).toBe(0.7);

        expect(
          result.topP,
        ).toBe(0.6);

        expect(
          result.maxOutputTokens,
        ).toBe(700);
      },
    );

    it(
      'trims provider and model identifiers',
      () => {
        const result =
          service.prepare({
            ...baseInput(),
            provider:
              ' openai ',
            model:
              ' gpt-test ',
          });

        expect(
          result.provider,
        ).toBe('openai');

        expect(
          result.model,
        ).toBe('gpt-test');

        expect(
          result.evidence.normalizations,
        ).toEqual(
          expect.arrayContaining([
            'provider:trimmed',
            'model:trimmed',
          ]),
        );
      },
    );

    it(
      'normalizes message roles',
      () => {
        const result =
          service.prepare({
            ...baseInput(),
            messages: [
              {
                role:
                  ' user ',
                content:
                  'Hello',
              },
            ],
          });

        expect(
          result.messages[0]
            .role,
        ).toBe('USER');
      },
    );

    it(
      'preserves message content exactly',
      () => {
        const result =
          service.prepare({
            ...baseInput(),
            messages: [
              {
                role:
                  'USER',
                content:
                  '  retain spacing  ',
              },
            ],
          });

        expect(
          result.messages[0]
            .content,
        ).toBe(
          '  retain spacing  ',
        );
      },
    );

    it(
      'preserves message order',
      () => {
        const result =
          service.prepare({
            ...baseInput(),
            messages: [
              {
                role:
                  'SYSTEM',
                content:
                  'System',
              },
              {
                role:
                  'USER',
                content:
                  'Question',
              },
              {
                role:
                  'ASSISTANT',
                content:
                  'Answer',
              },
            ],
          });

        expect(
          result.messages.map(
            (message) =>
              message.role,
          ),
        ).toEqual([
          'SYSTEM',
          'USER',
          'ASSISTANT',
        ]);
      },
    );

    it(
      'preserves and trims a system prompt',
      () => {
        const result =
          service.prepare({
            ...baseInput(),
            systemPrompt:
              ' Be useful ',
          });

        expect(
          result.systemPrompt,
        ).toBe('Be useful');

        expect(
          result.evidence
            .systemPromptPresent,
        ).toBe(true);
      },
    );

    it(
      'reports an absent system prompt',
      () => {
        const result =
          service.prepare(
            baseInput(),
          );

        expect(
          result.evidence
            .systemPromptPresent,
        ).toBe(false);

        expect(
          'systemPrompt' in
            result,
        ).toBe(false);
      },
    );

    it(
      'normalizes stop sequences',
      () => {
        const result =
          service.prepare({
            ...baseInput(),
            generation: {
              stopSequences: [
                ' END ',
                '',
                'END',
                'STOP',
              ],
            },
          });

        expect(
          result.stopSequences,
        ).toEqual([
          'END',
          'STOP',
        ]);
      },
    );

    it(
      'returns an empty stop sequence list by default',
      () => {
        const result =
          service.prepare(
            baseInput(),
          );

        expect(
          result.stopSequences,
        ).toEqual([]);
      },
    );

    it(
      'preserves a supplied request id',
      () => {
        const result =
          service.prepare({
            ...baseInput(),
            requestId:
              'request-123',
          });

        expect(
          result.requestId,
        ).toBe(
          'request-123',
        );
      },
    );

    it(
      'generates deterministic request ids',
      () => {
        const first =
          service.prepare(
            baseInput(),
          );

        const second =
          service.prepare(
            baseInput(),
          );

        expect(
          first.requestId,
        ).toBe(
          second.requestId,
        );
      },
    );

    it(
      'changes generated ids when material changes',
      () => {
        const first =
          service.prepare(
            baseInput(),
          );

        const second =
          service.prepare({
            ...baseInput(),
            model:
              'different-model',
          });

        expect(
          first.requestId,
        ).not.toBe(
          second.requestId,
        );
      },
    );

    it(
      'creates preparation evidence',
      () => {
        const result =
          service.prepare({
            ...baseInput(),
            generation: {
              temperature:
                0.5,
              topP:
                0.9,
              maxOutputTokens:
                600,
              stopSequences: [
                'END',
              ],
            },
          });

        expect(
          result.evidence,
        ).toEqual(
          expect.objectContaining({
            requestId:
              result.requestId,
            provider:
              'openai',
            model:
              'gpt-test',
            messageCount:
              1,
            temperature:
              0.5,
            topP:
              0.9,
            maxOutputTokens:
              600,
            stopSequenceCount:
              1,
            preparedAt:
              '2026-07-21T00:00:00.000Z',
          }),
        );
      },
    );

    it(
      'normalizes preparedAt timestamps',
      () => {
        const result =
          service.prepare({
            ...baseInput(),
            preparedAt:
              '2026-07-21T05:30:00+05:30',
          });

        expect(
          result.evidence
            .preparedAt,
        ).toBe(
          '2026-07-21T00:00:00.000Z',
        );
      },
    );

    it(
      'clones request metadata',
      () => {
        const metadata = {
          nested: {
            value:
              'original',
          },
        };

        const result =
          service.prepare({
            ...baseInput(),
            metadata,
          });

        metadata.nested.value =
          'changed';

        expect(
          result.metadata,
        ).toEqual({
          nested: {
            value:
              'original',
          },
        });
      },
    );

    it(
      'clones message metadata',
      () => {
        const metadata = {
          source:
            'conversation',
        };

        const result =
          service.prepare({
            ...baseInput(),
            messages: [
              {
                role:
                  'USER',
                content:
                  'Hello',
                metadata,
              },
            ],
          });

        metadata.source =
          'changed';

        expect(
          result.messages[0]
            .metadata,
        ).toEqual({
          source:
            'conversation',
        });
      },
    );

    it(
      'does not mutate its input',
      () => {
        const input = {
          ...baseInput(),
          provider:
            ' openai ',
          generation: {
            stopSequences: [
              ' END ',
            ],
          },
        };

        service.prepare(input);

        expect(
          input.provider,
        ).toBe(' openai ');

        expect(
          input.generation
            .stopSequences,
        ).toEqual([
          ' END ',
        ]);
      },
    );

    it(
      'returns a frozen top-level request',
      () => {
        const result =
          service.prepare(
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
      'returns frozen messages',
      () => {
        const result =
          service.prepare(
            baseInput(),
          );

        expect(
          Object.isFrozen(
            result.messages,
          ),
        ).toBe(true);

        expect(
          Object.isFrozen(
            result.messages[0],
          ),
        ).toBe(true);
      },
    );

    it(
      'returns frozen evidence',
      () => {
        const result =
          service.prepare(
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
              .normalizations,
          ),
        ).toBe(true);
      },
    );

    it(
      'rejects a missing provider',
      () => {
        expect(() =>
          service.prepare({
            ...baseInput(),
            provider:
              ' ',
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_REQUEST_PROVIDER_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects a missing model',
      () => {
        expect(() =>
          service.prepare({
            ...baseInput(),
            model:
              '',
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_REQUEST_MODEL_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects empty messages',
      () => {
        expect(() =>
          service.prepare({
            ...baseInput(),
            messages: [],
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_REQUEST_MESSAGES_REQUIRED',
          }),
        );
      },
    );

    it(
      'rejects empty message content',
      () => {
        expect(() =>
          service.prepare({
            ...baseInput(),
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
          expect.objectContaining({
            code:
              'AI_REQUEST_INVALID_MESSAGE',
          }),
        );
      },
    );

    it(
      'rejects unsupported message roles',
      () => {
        expect(() =>
          service.prepare({
            ...baseInput(),
            messages: [
              {
                role:
                  'DEVELOPER',
                content:
                  'Hello',
              },
            ],
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_REQUEST_INVALID_MESSAGE',
          }),
        );
      },
    );

    it.each([
      -0.1,
      2.1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])(
      'rejects invalid temperature %p',
      (
        temperature,
      ) => {
        expect(() =>
          service.prepare({
            ...baseInput(),
            generation: {
              temperature,
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_REQUEST_INVALID_TEMPERATURE',
          }),
        );
      },
    );

    it.each([
      0,
      -0.1,
      1.1,
      Number.NaN,
    ])(
      'rejects invalid topP %p',
      (topP) => {
        expect(() =>
          service.prepare({
            ...baseInput(),
            generation: {
              topP,
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_REQUEST_INVALID_TOP_P',
          }),
        );
      },
    );

    it.each([
      0,
      -1,
      1.5,
      1_000_001,
    ])(
      'rejects invalid maxOutputTokens %p',
      (
        maxOutputTokens,
      ) => {
        expect(() =>
          service.prepare({
            ...baseInput(),
            generation: {
              maxOutputTokens,
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_REQUEST_INVALID_MAX_OUTPUT_TOKENS',
          }),
        );
      },
    );

    it(
      'rejects invalid stop sequences',
      () => {
        expect(() =>
          service.prepare({
            ...baseInput(),
            generation: {
              stopSequences: [
                'END',
                7 as unknown as string,
              ],
            },
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_REQUEST_INVALID_STOP_SEQUENCE',
          }),
        );
      },
    );

    it(
      'rejects invalid preparedAt timestamps',
      () => {
        expect(() =>
          service.prepare({
            ...baseInput(),
            preparedAt:
              'not-a-date',
          }),
        ).toThrow(
          expect.objectContaining({
            code:
              'AI_REQUEST_INVALID_PREPARED_AT',
          }),
        );
      },
    );

    it(
      'uses structured preparation errors',
      () => {
        try {
          service.prepare({
            ...baseInput(),
            provider:
              '',
          });

          throw new Error(
            'Expected preparation to fail',
          );
        } catch (error) {
          expect(
            error,
          ).toBeInstanceOf(
            AiRequestPreparationError,
          );
        }
      },
    );
  },
);
