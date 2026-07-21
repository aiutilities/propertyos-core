import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  AiProviderSelectionError,
} from '../errors/ai-provider-selection.error';
import {
  AiProviderSelectionCandidate,
  AiProviderSelectionRequest,
} from '../types/ai-provider-selection.types';
import {
  AiProviderSelectionService,
} from './ai-provider-selection.service';

describe(
  'AI provider selection service',
  () => {
    const service =
      new AiProviderSelectionService();

    const candidates:
      AiProviderSelectionCandidate[] = [
        {
          providerName:
            'openai',
          model:
            'openai-model',
          enabled:
            true,
          availability:
            'AVAILABLE',
          capabilities: [
            'TEXT',
            'REASONING',
            'CODING',
            'TOOL_CALLING',
          ],
          estimatedLatencyMs:
            800,
          estimatedCostPerMillionTokensUsd:
            8,
          priority:
            90,
        },
        {
          providerName:
            'deepseek',
          model:
            'deepseek-model',
          enabled:
            true,
          availability:
            'AVAILABLE',
          capabilities: [
            'TEXT',
            'REASONING',
            'CODING',
          ],
          estimatedLatencyMs:
            600,
          estimatedCostPerMillionTokensUsd:
            2,
          priority:
            80,
        },
        {
          providerName:
            'qwen',
          model:
            'qwen-model',
          enabled:
            true,
          availability:
            'DEGRADED',
          capabilities: [
            'TEXT',
            'CODING',
          ],
          estimatedLatencyMs:
            500,
          estimatedCostPerMillionTokensUsd:
            1,
          priority:
            70,
        },
        {
          providerName:
            'claude',
          model:
            'claude-model',
          enabled:
            true,
          availability:
            'AVAILABLE',
          capabilities: [
            'TEXT',
            'REASONING',
            'CODING',
            'VISION',
          ],
          estimatedLatencyMs:
            900,
          estimatedCostPerMillionTokensUsd:
            10,
          priority:
            85,
        },
      ];

    const request =
      (
        overrides:
          Partial<
            AiProviderSelectionRequest
          > = {},
      ):
        AiProviderSelectionRequest => ({
          requiredCapabilities: [
            'TEXT',
            'CODING',
          ],
          candidates,
          ...overrides,
        });

    it(
      'selects the highest-scoring eligible provider',
      () => {
        const result =
          service.select(
            request(),
          );

        expect(
          result.selectedProviderName,
        ).toBe(
          'deepseek',
        );

        expect(
          result.selectedModel,
        ).toBe(
          'deepseek-model',
        );
      },
    );

    it(
      'honours preferred-provider weighting',
      () => {
        const result =
          service.select(
            request({
              preferredProviders: [
                'openai',
              ],
            }),
          );

        expect(
          result.selectedProviderName,
        ).toBe(
          'openai',
        );
      },
    );

    it(
      'excludes a disabled provider',
      () => {
        const result =
          service.select(
            request({
              candidates:
                candidates.map(
                  candidate =>
                    candidate.providerName ===
                    'deepseek'
                      ? {
                          ...candidate,
                          enabled:
                            false,
                        }
                      : candidate,
                ),
            }),
          );

        const evaluation =
          result.evaluations.find(
            item =>
              item.providerName ===
              'deepseek',
          );

        expect(
          evaluation,
        ).toEqual(
          expect.objectContaining({
            eligible:
              false,
            exclusionCodes:
              expect.arrayContaining([
                'PROVIDER_DISABLED',
              ]),
          }),
        );
      },
    );

    it(
      'excludes an unavailable provider',
      () => {
        const evaluations =
          service.evaluate(
            request({
              candidates:
                candidates.map(
                  candidate =>
                    candidate.providerName ===
                    'openai'
                      ? {
                          ...candidate,
                          availability:
                            'UNAVAILABLE',
                        }
                      : candidate,
                ),
            }),
          );

        expect(
          evaluations.find(
            item =>
              item.providerName ===
              'openai',
          ),
        ).toEqual(
          expect.objectContaining({
            eligible:
              false,
            exclusionCodes:
              expect.arrayContaining([
                'PROVIDER_UNAVAILABLE',
              ]),
          }),
        );
      },
    );

    it(
      'excludes candidates missing required capabilities',
      () => {
        const evaluations =
          service.evaluate(
            request({
              requiredCapabilities: [
                'VISION',
              ],
            }),
          );

        expect(
          evaluations.find(
            item =>
              item.providerName ===
              'deepseek',
          )?.exclusionCodes,
        ).toContain(
          'REQUIRED_CAPABILITY_MISSING',
        );

        expect(
          evaluations.find(
            item =>
              item.providerName ===
              'claude',
          )?.eligible,
        ).toBe(
          true,
        );
      },
    );

    it(
      'enforces maximum latency',
      () => {
        const evaluations =
          service.evaluate(
            request({
              maximumLatencyMs:
                700,
            }),
          );

        expect(
          evaluations.find(
            item =>
              item.providerName ===
              'openai',
          )?.exclusionCodes,
        ).toContain(
          'LATENCY_LIMIT_EXCEEDED',
        );
      },
    );

    it(
      'enforces maximum cost',
      () => {
        const evaluations =
          service.evaluate(
            request({
              maximumCostPerMillionTokensUsd:
                3,
            }),
          );

        expect(
          evaluations.find(
            item =>
              item.providerName ===
              'claude',
          )?.exclusionCodes,
        ).toContain(
          'COST_LIMIT_EXCEEDED',
        );
      },
    );

    it(
      'throws structured evidence when no candidate is eligible',
      () => {
        expect(
          () =>
            service.select(
              request({
                requiredCapabilities: [
                  'STRUCTURED_OUTPUT',
                ],
              }),
            ),
        ).toThrow(
          AiProviderSelectionError,
        );

        try {
          service.select(
            request({
              requiredCapabilities: [
                'STRUCTURED_OUTPUT',
              ],
            }),
          );
        } catch (
          error
        ) {
          const selectionError =
            error as
              AiProviderSelectionError;

          expect(
            selectionError.code,
          ).toBe(
            'AI_PROVIDER_SELECTION_FAILED',
          );

          expect(
            selectionError.evaluations,
          ).toHaveLength(
            4,
          );
        }
      },
    );

    it(
      'uses deterministic provider-name tie-breaking',
      () => {
        const equalCandidates:
          AiProviderSelectionCandidate[] = [
            {
              ...candidates[0],
              providerName:
                'beta',
              model:
                'same-model',
              estimatedLatencyMs:
                500,
              estimatedCostPerMillionTokensUsd:
                5,
              priority:
                50,
            },
            {
              ...candidates[0],
              providerName:
                'alpha',
              model:
                'same-model',
              estimatedLatencyMs:
                500,
              estimatedCostPerMillionTokensUsd:
                5,
              priority:
                50,
            },
          ];

        const result =
          service.select(
            request({
              candidates:
                equalCandidates,
            }),
          );

        expect(
          result.selectedProviderName,
        ).toBe(
          'alpha',
        );
      },
    );

    it(
      'returns a complete scoring breakdown',
      () => {
        const result =
          service.select(
            request(),
          );

        const selected =
          result.evaluations.find(
            evaluation =>
              evaluation.providerName ===
              result.selectedProviderName,
          );

        expect(
          selected?.score,
        ).toEqual(
          expect.objectContaining({
            capabilityScore:
              expect.any(Number),
            availabilityScore:
              expect.any(Number),
            latencyScore:
              expect.any(Number),
            costScore:
              expect.any(Number),
            preferenceScore:
              expect.any(Number),
            priorityScore:
              expect.any(Number),
            totalScore:
              expect.any(Number),
          }),
        );
      },
    );

    it(
      'does not mutate the selection request',
      () => {
        const input =
          request();

        const before =
          JSON.stringify(
            input,
          );

        service.select(
          input,
        );

        expect(
          JSON.stringify(
            input,
          ),
        ).toBe(
          before,
        );
      },
    );

    it(
      'rejects an empty candidate list',
      () => {
        expect(
          () =>
            service.select(
              request({
                candidates: [],
              }),
            ),
        ).toThrow(
          'At least one AI provider candidate is required',
        );
      },
    );

    it.each([
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])(
      'rejects invalid latency ceiling %s',
      value => {
        expect(
          () =>
            service.select(
              request({
                maximumLatencyMs:
                  value,
              }),
            ),
        ).toThrow(
          'Maximum latency must be a non-negative finite number',
        );
      },
    );

    it.each([
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
    ])(
      'rejects invalid cost ceiling %s',
      value => {
        expect(
          () =>
            service.select(
              request({
                maximumCostPerMillionTokensUsd:
                  value,
              }),
            ),
        ).toThrow(
          'Maximum cost must be a non-negative finite number',
        );
      },
    );
  },
);
