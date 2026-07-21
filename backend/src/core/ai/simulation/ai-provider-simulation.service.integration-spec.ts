import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  AiProviderSimulationError,
} from '../errors/ai-provider-simulation.error';
import {
  AiProviderSimulationScenario,
} from '../types/ai-provider-simulation.types';
import {
  AiProviderSimulationService,
} from './ai-provider-simulation.service';

describe(
  'AI provider simulation service',
  () => {
    const service =
      new AiProviderSimulationService();

    const createRequest =
      (
        scenario:
          AiProviderSimulationScenario =
            'SUCCESS',
      ) => ({
        providerName:
          'openai',
        model:
          'simulation-model',
        prompt:
          'Summarize the maintenance request',
        scenario,
        responseText:
          'The maintenance request was summarized.',
      });

    it(
      'returns a deterministic simulated success response',
      async () => {
        const first =
          await service.simulate(
            createRequest(),
          );

        const second =
          await service.simulate(
            createRequest(),
          );

        expect(
          first.simulationId,
        ).toBe(
          second.simulationId,
        );

        expect(
          first,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'openai',
            model:
              'simulation-model',
            text:
              'The maintenance request was summarized.',
            simulated:
              true,
          }),
        );

        expect(
          first.evidence,
        ).toEqual(
          expect.objectContaining({
            simulationId:
              first.simulationId,
            scenario:
              'SUCCESS',
            outcome:
              'SUCCEEDED',
            promptLength:
              33,
            latencyMs:
              0,
          }),
        );
      },
    );

    it.each([
      [
        'TIMEOUT',
        'AI_PROVIDER_SIMULATED_TIMEOUT',
      ],
      [
        'RATE_LIMIT',
        'AI_PROVIDER_SIMULATED_RATE_LIMIT',
      ],
      [
        'MALFORMED_RESPONSE',
        'AI_PROVIDER_SIMULATED_MALFORMED_RESPONSE',
      ],
      [
        'PROVIDER_OUTAGE',
        'AI_PROVIDER_SIMULATED_OUTAGE',
      ],
    ] as const)(
      'simulates %s as %s',
      async (
        scenario,
        expectedCode,
      ) => {
        await expect(
          service.simulate(
            createRequest(
              scenario,
            ),
          ),
        ).rejects.toEqual(
          expect.objectContaining({
            name:
              'AiProviderSimulationError',
            code:
              expectedCode,
            providerName:
              'openai',
          }),
        );
      },
    );

    it(
      'returns structured failure evidence',
      async () => {
        try {
          await service.simulate(
            createRequest(
              'RATE_LIMIT',
            ),
          );

          throw new Error(
            'Expected simulated failure',
          );
        } catch (
          error
        ) {
          expect(
            error,
          ).toBeInstanceOf(
            AiProviderSimulationError,
          );

          const simulationError =
            error as
              AiProviderSimulationError;

          expect(
            simulationError.evidence,
          ).toEqual(
            expect.objectContaining({
              scenario:
                'RATE_LIMIT',
              outcome:
                'FAILED',
              failureCode:
                'AI_PROVIDER_SIMULATED_RATE_LIMIT',
            }),
          );
        }
      },
    );

    it.each([
      'openai',
      'deepseek',
      'qwen',
      'claude',
    ])(
      'simulates provider-neutral execution for %s',
      async (
        providerName,
      ) => {
        const response =
          await service.simulate({
            ...createRequest(),
            providerName,
          });

        expect(
          response.providerName,
        ).toBe(
          providerName,
        );

        expect(
          response.simulated,
        ).toBe(
          true,
        );
      },
    );

    it(
      'supports deterministic artificial latency',
      async () => {
        const before =
          Date.now();

        const response =
          await service.simulate({
            ...createRequest(),
            latencyMs:
              10,
          });

        const elapsed =
          Date.now() -
          before;

        expect(
          elapsed,
        ).toBeGreaterThanOrEqual(
          8,
        );

        expect(
          response.evidence
            .latencyMs,
        ).toBe(
          10,
        );
      },
    );

    it(
      'does not expose prompts inside evidence',
      async () => {
        const response =
          await service.simulate(
            createRequest(),
          );

        expect(
          JSON.stringify(
            response.evidence,
          ),
        ).not.toContain(
          'Summarize the maintenance request',
        );

        expect(
          response.evidence
            .promptLength,
        ).toBe(
          33,
        );
      },
    );

    it(
      'rejects an empty provider name',
      async () => {
        await expect(
          service.simulate({
            ...createRequest(),
            providerName:
              ' ',
          }),
        ).rejects.toThrow(
          'Simulation provider name is required',
        );
      },
    );

    it(
      'rejects an empty model',
      async () => {
        await expect(
          service.simulate({
            ...createRequest(),
            model:
              ' ',
          }),
        ).rejects.toThrow(
          'Simulation model is required',
        );
      },
    );

    it(
      'rejects an empty prompt',
      async () => {
        await expect(
          service.simulate({
            ...createRequest(),
            prompt:
              ' ',
          }),
        ).rejects.toThrow(
          'Simulation prompt is required',
        );
      },
    );

    it.each([
      -1,
      1.5,
      5_001,
    ])(
      'rejects invalid latency %s',
      async (
        latencyMs,
      ) => {
        await expect(
          service.simulate({
            ...createRequest(),
            latencyMs,
          }),
        ).rejects.toThrow(
          'Simulation latency must be an integer between 0 and 5000 milliseconds',
        );
      },
    );

    it(
      'does not mutate the input request',
      async () => {
        const request =
          createRequest();

        const before =
          JSON.stringify(
            request,
          );

        await service.simulate(
          request,
        );

        expect(
          JSON.stringify(
            request,
          ),
        ).toBe(
          before,
        );
      },
    );
  },
);
