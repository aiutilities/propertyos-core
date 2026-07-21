import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  AiProviderActivationError,
} from '../errors/ai-provider-activation.error';
import {
  AiProviderRuntimeConfiguration,
} from '../types/ai-provider-runtime-configuration.types';
import {
  AiProviderActivationPolicy,
} from '../types/ai-provider-activation.types';
import {
  AiProviderActivationBoundaryService,
} from './ai-provider-activation-boundary.service';

describe(
  'AI provider activation boundary',
  () => {
    const service =
      new AiProviderActivationBoundaryService();

    const createConfiguration =
      (
        overrides:
          Partial<
            AiProviderRuntimeConfiguration
          > = {},
      ):
        AiProviderRuntimeConfiguration => ({
          providerName:
            'openai',
          enabled:
            false,
          priority:
            100,
          defaultModel:
            'test-model',
          baseUrl:
            'https://example.invalid',
          timeoutMs:
            30_000,
          maxRetries:
            0,
          credential: {
            source:
              'ENVIRONMENT',
            variableName:
              'TEST_API_KEY',
          },
          liveExecutionAuthorized:
            false,
          ...overrides,
        });

    const createPolicy =
      (
        overrides:
          Partial<
            AiProviderActivationPolicy
          > = {},
      ):
        AiProviderActivationPolicy => ({
          globalEnabled:
            false,
          environment:
            'test',
          allowedEnvironments: [
            'test',
          ],
          allowedProviders: [
            'openai',
          ],
          ...overrides,
        });

    it(
      'fails closed when every activation gate is disabled',
      () => {
        const result =
          service.evaluate({
            configuration:
              createConfiguration(),
            policy:
              createPolicy(),
          });

        expect(
          result.authorized,
        ).toBe(
          false,
        );

        expect(
          result.denialCodes,
        ).toEqual([
          'GLOBAL_AI_DISABLED',
          'PROVIDER_RUNTIME_DISABLED',
          'LIVE_EXECUTION_NOT_AUTHORIZED',
        ]);
      },
    );

    it(
      'blocks an environment outside the policy allow-list',
      () => {
        const result =
          service.evaluate({
            configuration:
              createConfiguration({
                enabled:
                  true,
                liveExecutionAuthorized:
                  true,
              }),
            policy:
              createPolicy({
                globalEnabled:
                  true,
                environment:
                  'production',
                allowedEnvironments: [
                  'staging',
                ],
              }),
          });

        expect(
          result.denialCodes,
        ).toEqual([
          'ENVIRONMENT_NOT_ALLOWED',
        ]);
      },
    );

    it(
      'blocks a provider outside the policy allow-list',
      () => {
        const result =
          service.evaluate({
            configuration:
              createConfiguration({
                providerName:
                  'claude',
                enabled:
                  true,
                liveExecutionAuthorized:
                  true,
              }),
            policy:
              createPolicy({
                globalEnabled:
                  true,
                allowedProviders: [
                  'openai',
                ],
              }),
          });

        expect(
          result.denialCodes,
        ).toEqual([
          'PROVIDER_NOT_ALLOWED',
        ]);
      },
    );

    it(
      'requires provider runtime enablement',
      () => {
        const result =
          service.evaluate({
            configuration:
              createConfiguration({
                enabled:
                  false,
                liveExecutionAuthorized:
                  true,
              }),
            policy:
              createPolicy({
                globalEnabled:
                  true,
              }),
          });

        expect(
          result.denialCodes,
        ).toEqual([
          'PROVIDER_RUNTIME_DISABLED',
        ]);
      },
    );

    it(
      'requires explicit live-execution authorization',
      () => {
        const result =
          service.evaluate({
            configuration:
              createConfiguration({
                enabled:
                  true,
                liveExecutionAuthorized:
                  false,
              }),
            policy:
              createPolicy({
                globalEnabled:
                  true,
              }),
          });

        expect(
          result.denialCodes,
        ).toEqual([
          'LIVE_EXECUTION_NOT_AUTHORIZED',
        ]);
      },
    );

    it(
      'authorizes only when every gate is satisfied',
      () => {
        const result =
          service.evaluate({
            configuration:
              createConfiguration({
                enabled:
                  true,
                liveExecutionAuthorized:
                  true,
              }),
            policy:
              createPolicy({
                globalEnabled:
                  true,
              }),
          });

        expect(
          result,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'openai',
            environment:
              'test',
            authorized:
              true,
            denialCodes: [],
          }),
        );

        expect(
          Number.isNaN(
            Date.parse(
              result.evaluatedAt,
            ),
          ),
        ).toBe(
          false,
        );
      },
    );

    it(
      'throws a structured denial error',
      () => {
        expect(
          () =>
            service
              .assertAuthorized({
                configuration:
                  createConfiguration(),
                policy:
                  createPolicy(),
              }),
        ).toThrow(
          AiProviderActivationError,
        );

        try {
          service.assertAuthorized({
            configuration:
              createConfiguration(),
            policy:
              createPolicy(),
          });

          throw new Error(
            'Expected authorization denial',
          );
        } catch (
          error
        ) {
          expect(
            error,
          ).toBeInstanceOf(
            AiProviderActivationError,
          );

          const activationError =
            error as
              AiProviderActivationError;

          expect(
            activationError.code,
          ).toBe(
            'AI_PROVIDER_ACTIVATION_DENIED',
          );

          expect(
            activationError.providerName,
          ).toBe(
            'openai',
          );

          expect(
            activationError.denialCodes,
          ).toEqual([
            'GLOBAL_AI_DISABLED',
            'PROVIDER_RUNTIME_DISABLED',
            'LIVE_EXECUTION_NOT_AUTHORIZED',
          ]);
        }
      },
    );

    it(
      'returns an authorization proof without exposing credentials',
      () => {
        const result =
          service.assertAuthorized({
            configuration:
              createConfiguration({
                enabled:
                  true,
                liveExecutionAuthorized:
                  true,
              }),
            policy:
              createPolicy({
                globalEnabled:
                  true,
              }),
          });

        expect(
          result.authorized,
        ).toBe(
          true,
        );

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          'TEST_API_KEY',
        );

        expect(
          JSON.stringify(
            result,
          ),
        ).not.toContain(
          'credential',
        );
      },
    );

    it.each([
      'openai',
      'deepseek',
      'qwen',
      'claude',
    ])(
      'applies the same boundary to %s',
      (
        providerName,
      ) => {
        const result =
          service.evaluate({
            configuration:
              createConfiguration({
                providerName,
                enabled:
                  true,
                liveExecutionAuthorized:
                  true,
              }),
            policy:
              createPolicy({
                globalEnabled:
                  true,
                allowedProviders: [
                  providerName,
                ],
              }),
          });

        expect(
          result.authorized,
        ).toBe(
          true,
        );

        expect(
          result.providerName,
        ).toBe(
          providerName,
        );
      },
    );

    it(
      'does not mutate configuration or policy input',
      () => {
        const configuration =
          createConfiguration({
            enabled:
              true,
            liveExecutionAuthorized:
              true,
          });

        const policy =
          createPolicy({
            globalEnabled:
              true,
          });

        const configurationBefore =
          JSON.stringify(
            configuration,
          );

        const policyBefore =
          JSON.stringify(
            policy,
          );

        service.evaluate({
          configuration,
          policy,
        });

        expect(
          JSON.stringify(
            configuration,
          ),
        ).toBe(
          configurationBefore,
        );

        expect(
          JSON.stringify(
            policy,
          ),
        ).toBe(
          policyBefore,
        );
      },
    );
  },
);
