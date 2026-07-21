import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  AiProviderFailoverError,
} from '../errors/ai-provider-failover.error';
import {
  AiProviderFailoverFailureCode,
  AiProviderFailoverRequest,
} from '../types/ai-provider-failover.types';
import {
  AiProviderFailoverService,
} from './ai-provider-failover.service';

describe(
  'AI provider failover service',
  () => {
    const service =
      new AiProviderFailoverService();

    const candidates = [
      {
        providerName:
          'openai',
        model:
          'openai-model',
      },
      {
        providerName:
          'deepseek',
        model:
          'deepseek-model',
      },
      {
        providerName:
          'qwen',
        model:
          'qwen-model',
      },
      {
        providerName:
          'claude',
        model:
          'claude-model',
      },
    ] as const;

    const codedError =
      (
        code:
          AiProviderFailoverFailureCode,
      ) =>
        Object.assign(
          new Error(
            code,
          ),
          {
            code,
          },
        );

    const request =
      <TResponse>(
        execute:
          AiProviderFailoverRequest<TResponse>[
            'execute'
          ],
        overrides:
          Partial<
            AiProviderFailoverRequest<TResponse>
          > = {},
      ):
        AiProviderFailoverRequest<TResponse> => ({
          candidates,
          maximumAttemptsPerProvider:
            2,
          retryDelayMs:
            0,
          execute,
          ...overrides,
        });

    it(
      'returns immediately when the first provider succeeds',
      async () => {
        const execute =
          jest.fn(
            async () => ({
              text:
                'success',
            }),
          );

        const result =
          await service.execute(
            request(
              execute,
            ),
          );

        expect(
          result.providerName,
        ).toBe(
          'openai',
        );

        expect(
          result.evidence.totalAttempts,
        ).toBe(
          1,
        );

        expect(
          result.evidence.failoverCount,
        ).toBe(
          0,
        );
      },
    );

    it(
      'retries a retryable timeout on the same provider',
      async () => {
        let calls =
          0;

        const result =
          await service.execute(
            request(
              async candidate => {
                calls +=
                  1;

                if (
                  calls === 1
                ) {
                  throw codedError(
                    'AI_PROVIDER_TIMEOUT',
                  );
                }

                return {
                  provider:
                    candidate.providerName,
                };
              },
            ),
          );

        expect(
          result.providerName,
        ).toBe(
          'openai',
        );

        expect(
          result.evidence.totalAttempts,
        ).toBe(
          2,
        );

        expect(
          result.evidence.attempts[0],
        ).toEqual(
          expect.objectContaining({
            failureCode:
              'AI_PROVIDER_TIMEOUT',
            retryable:
              true,
          }),
        );
      },
    );

    it(
      'retries rate-limit failures',
      async () => {
        let calls =
          0;

        const result =
          await service.execute(
            request(
              async () => {
                calls +=
                  1;

                if (
                  calls === 1
                ) {
                  throw codedError(
                    'AI_PROVIDER_RATE_LIMITED',
                  );
                }

                return 'ok';
              },
            ),
          );

        expect(
          result.response,
        ).toBe(
          'ok',
        );

        expect(
          calls,
        ).toBe(
          2,
        );
      },
    );

    it(
      'retries provider-outage failures',
      async () => {
        let calls =
          0;

        await service.execute(
          request(
            async () => {
              calls +=
                1;

              if (
                calls === 1
              ) {
                throw codedError(
                  'AI_PROVIDER_OUTAGE',
                );
              }

              return 'recovered';
            },
          ),
        );

        expect(
          calls,
        ).toBe(
          2,
        );
      },
    );

    it(
      'fails over after retry attempts are exhausted',
      async () => {
        const result =
          await service.execute(
            request(
              async candidate => {
                if (
                  candidate.providerName ===
                  'openai'
                ) {
                  throw codedError(
                    'AI_PROVIDER_TIMEOUT',
                  );
                }

                return {
                  provider:
                    candidate.providerName,
                };
              },
            ),
          );

        expect(
          result.providerName,
        ).toBe(
          'deepseek',
        );

        expect(
          result.evidence.totalAttempts,
        ).toBe(
          3,
        );

        expect(
          result.evidence.failoverCount,
        ).toBe(
          1,
        );

        expect(
          result.evidence.providersAttempted,
        ).toEqual([
          'openai',
          'deepseek',
        ]);
      },
    );

    it(
      'does not retry a non-retryable provider failure',
      async () => {
        const calls:
          string[] = [];

        const result =
          await service.execute(
            request(
              async candidate => {
                calls.push(
                  candidate.providerName,
                );

                if (
                  candidate.providerName ===
                  'openai'
                ) {
                  throw codedError(
                    'AI_PROVIDER_MALFORMED_RESPONSE',
                  );
                }

                return 'fallback';
              },
            ),
          );

        expect(
          calls,
        ).toEqual([
          'openai',
          'deepseek',
        ]);

        expect(
          result.evidence.attempts[0],
        ).toEqual(
          expect.objectContaining({
            retryable:
              false,
          }),
        );
      },
    );

    it(
      'supports custom retryable failure codes',
      async () => {
        let calls =
          0;

        const result =
          await service.execute(
            request(
              async () => {
                calls +=
                  1;

                if (
                  calls === 1
                ) {
                  throw codedError(
                    'AI_PROVIDER_MALFORMED_RESPONSE',
                  );
                }

                return 'recovered';
              },
              {
                retryableFailureCodes: [
                  'AI_PROVIDER_MALFORMED_RESPONSE',
                ],
              },
            ),
          );

        expect(
          result.response,
        ).toBe(
          'recovered',
        );

        expect(
          calls,
        ).toBe(
          2,
        );
      },
    );

    it(
      'throws structured exhaustion evidence',
      async () => {
        try {
          await service.execute(
            request(
              async () => {
                throw codedError(
                  'AI_PROVIDER_OUTAGE',
                );
              },
            ),
          );

          throw new Error(
            'Expected failover exhaustion',
          );
        } catch (
          error
        ) {
          expect(
            error,
          ).toBeInstanceOf(
            AiProviderFailoverError,
          );

          const failoverError =
            error as
              AiProviderFailoverError;

          expect(
            failoverError.code,
          ).toBe(
            'AI_PROVIDER_FAILOVER_EXHAUSTED',
          );

          expect(
            failoverError.evidence.exhausted,
          ).toBe(
            true,
          );

          expect(
            failoverError.evidence.totalAttempts,
          ).toBe(
            8,
          );

          expect(
            failoverError.evidence.failoverCount,
          ).toBe(
            3,
          );
        }
      },
    );

    it(
      'records ordered global attempt numbers',
      async () => {
        try {
          await service.execute(
            request(
              async () => {
                throw codedError(
                  'AI_PROVIDER_TIMEOUT',
                );
              },
              {
                candidates:
                  candidates.slice(
                    0,
                    2,
                  ),
              },
            ),
          );
        } catch (
          error
        ) {
          const evidence =
            (
              error as
                AiProviderFailoverError
            ).evidence;

          expect(
            evidence.attempts.map(
              attempt =>
                attempt.globalAttemptNumber,
            ),
          ).toEqual([
            1,
            2,
            3,
            4,
          ]);
        }
      },
    );

    it(
      'passes deterministic execution context',
      async () => {
        const contexts:
          unknown[] = [];

        await service.execute(
          request(
            async (
              candidate,
              context,
            ) => {
              contexts.push({
                candidate,
                context,
              });

              if (
                candidate.providerName ===
                'openai'
              ) {
                throw codedError(
                  'AI_PROVIDER_NON_RETRYABLE_FAILURE',
                );
              }

              return 'ok';
            },
          ),
        );

        expect(
          contexts,
        ).toEqual([
          {
            candidate: {
              providerName:
                'openai',
              model:
                'openai-model',
            },
            context: {
              providerIndex:
                0,
              attemptNumber:
                1,
              globalAttemptNumber:
                1,
            },
          },
          {
            candidate: {
              providerName:
                'deepseek',
              model:
                'deepseek-model',
            },
            context: {
              providerIndex:
                1,
              attemptNumber:
                1,
              globalAttemptNumber:
                2,
            },
          },
        ]);
      },
    );

    it(
      'applies configured retry delay',
      async () => {
        let calls =
          0;

        const startedAt =
          Date.now();

        await service.execute(
          request(
            async () => {
              calls +=
                1;

              if (
                calls === 1
              ) {
                throw codedError(
                  'AI_PROVIDER_TIMEOUT',
                );
              }

              return 'ok';
            },
            {
              retryDelayMs:
                10,
            },
          ),
        );

        expect(
          Date.now() -
          startedAt,
        ).toBeGreaterThanOrEqual(
          8,
        );
      },
    );

    it(
      'does not expose thrown error messages in evidence',
      async () => {
        try {
          await service.execute(
            request(
              async () => {
                throw Object.assign(
                  new Error(
                    'sensitive provider response',
                  ),
                  {
                    code:
                      'AI_PROVIDER_OUTAGE',
                  },
                );
              },
              {
                candidates: [
                  candidates[0],
                ],
                maximumAttemptsPerProvider:
                  1,
              },
            ),
          );
        } catch (
          error
        ) {
          const serialized =
            JSON.stringify(
              (
                error as
                  AiProviderFailoverError
              ).evidence,
            );

          expect(
            serialized,
          ).not.toContain(
            'sensitive provider response',
          );
        }
      },
    );

    it(
      'does not mutate the request',
      async () => {
        const input =
          request(
            async () =>
              'ok',
          );

        const before = {
          candidates:
            JSON.stringify(
              input.candidates,
            ),
          maximumAttemptsPerProvider:
            input
              .maximumAttemptsPerProvider,
          retryDelayMs:
            input.retryDelayMs,
        };

        await service.execute(
          input,
        );

        expect({
          candidates:
            JSON.stringify(
              input.candidates,
            ),
          maximumAttemptsPerProvider:
            input
              .maximumAttemptsPerProvider,
          retryDelayMs:
            input.retryDelayMs,
        }).toEqual(
          before,
        );
      },
    );

    it(
      'rejects an empty candidate list',
      async () => {
        await expect(
          service.execute(
            request(
              async () =>
                'ok',
              {
                candidates: [],
              },
            ),
          ),
        ).rejects.toThrow(
          'At least one AI provider failover candidate is required',
        );
      },
    );

    it.each([
      0,
      1.5,
      6,
    ])(
      'rejects invalid maximum attempts %s',
      async value => {
        await expect(
          service.execute(
            request(
              async () =>
                'ok',
              {
                maximumAttemptsPerProvider:
                  value,
              },
            ),
          ),
        ).rejects.toThrow(
          'Maximum attempts per provider must be an integer between 1 and 5',
        );
      },
    );

    it.each([
      -1,
      1.5,
      5001,
    ])(
      'rejects invalid retry delay %s',
      async value => {
        await expect(
          service.execute(
            request(
              async () =>
                'ok',
              {
                retryDelayMs:
                  value,
              },
            ),
          ),
        ).rejects.toThrow(
          'Retry delay must be an integer between 0 and 5000 milliseconds',
        );
      },
    );

    it(
      'rejects an empty provider name',
      async () => {
        await expect(
          service.execute(
            request(
              async () =>
                'ok',
              {
                candidates: [
                  {
                    providerName:
                      ' ',
                    model:
                      'model',
                  },
                ],
              },
            ),
          ),
        ).rejects.toThrow(
          'Failover candidate provider name is required',
        );
      },
    );

    it(
      'rejects an empty model',
      async () => {
        await expect(
          service.execute(
            request(
              async () =>
                'ok',
              {
                candidates: [
                  {
                    providerName:
                      'openai',
                    model:
                      ' ',
                  },
                ],
              },
            ),
          ),
        ).rejects.toThrow(
          'Failover candidate model is required',
        );
      },
    );
  },
);
