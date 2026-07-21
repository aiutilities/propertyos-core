import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  AiProviderRuntimeConfiguration,
} from '../types/ai-provider-runtime-configuration.types';
import {
  AiProviderRuntimeConfigurationService,
} from './ai-provider-runtime-configuration.service';

describe(
  'AI provider runtime configuration',
  () => {
    const createConfiguration =
      (
        overrides:
          Partial<AiProviderRuntimeConfiguration> =
            {},
      ):
        AiProviderRuntimeConfiguration => ({
          providerName:
            'openai',
          enabled:
            false,
          priority:
            10,
          defaultModel:
            'gpt-model',
          baseUrl:
            'https://api.example.test/v1',
          timeoutMs:
            30_000,
          maxRetries:
            2,
          credential: {
            source:
              'ENVIRONMENT',
            variableName:
              'OPENAI_API_KEY',
          },
          liveExecutionAuthorized:
            false,
          metadata: {
            vendor:
              'Example',
          },
          ...overrides,
        });

    it(
      'accepts a valid disabled provider configuration',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const report =
          service.validate([
            createConfiguration(),
          ]);

        expect(
          report.valid,
        ).toBe(true);

        expect(
          report.errors,
        ).toEqual([]);
      },
    );

    it(
      'normalizes provider names and optional strings',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const report =
          service.validate([
            createConfiguration({
              providerName:
                '  OpenAI  ',
              defaultModel:
                '  model-a  ',
              baseUrl:
                '  https://api.example.test/v1  ',
              credential: {
                source:
                  'ENVIRONMENT',
                variableName:
                  '  OPENAI_API_KEY  ',
              },
            }),
          ]);

        expect(
          report.configurations[0],
        ).toEqual(
          expect.objectContaining({
            providerName:
              'openai',
            defaultModel:
              'model-a',
            baseUrl:
              'https://api.example.test/v1',
            credential: {
              source:
                'ENVIRONMENT',
              variableName:
                'OPENAI_API_KEY',
            },
          }),
        );
      },
    );

    it(
      'sorts providers deterministically by priority and name',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const report =
          service.validate([
            createConfiguration({
              providerName:
                'qwen',
              priority:
                20,
              credential: {
                source:
                  'ENVIRONMENT',
                variableName:
                  'QWEN_API_KEY',
              },
            }),
            createConfiguration({
              providerName:
                'deepseek',
              priority:
                10,
              credential: {
                source:
                  'ENVIRONMENT',
                variableName:
                  'DEEPSEEK_API_KEY',
              },
            }),
            createConfiguration({
              providerName:
                'claude',
              priority:
                10,
              credential: {
                source:
                  'ENVIRONMENT',
                variableName:
                  'ANTHROPIC_API_KEY',
              },
            }),
          ]);

        expect(
          report.configurations
            .map(
              (configuration) =>
                configuration
                  .providerName,
            ),
        ).toEqual([
          'claude',
          'deepseek',
          'qwen',
        ]);
      },
    );

    it(
      'rejects duplicate provider names after normalization',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const report =
          service.validate([
            createConfiguration({
              providerName:
                'OpenAI',
            }),
            createConfiguration({
              providerName:
                ' openai ',
            }),
          ]);

        expect(
          report.errors,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code:
                'DUPLICATE_PROVIDER_NAME',
              providerName:
                'openai',
            }),
          ]),
        );
      },
    );

    it(
      'rejects an empty provider name',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const report =
          service.validate([
            createConfiguration({
              providerName:
                '   ',
            }),
          ]);

        expect(
          report.errors,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code:
                'EMPTY_PROVIDER_NAME',
            }),
          ]),
        );
      },
    );

    it(
      'rejects invalid priority timeout and retry values',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const report =
          service.validate([
            createConfiguration({
              priority:
                -1,
              timeoutMs:
                0,
              maxRetries:
                -1,
            }),
          ]);

        expect(
          report.errors
            .map(
              (error) =>
                error.code,
            ),
        ).toEqual(
          expect.arrayContaining([
            'INVALID_PRIORITY',
            'INVALID_TIMEOUT',
            'INVALID_MAX_RETRIES',
          ]),
        );
      },
    );

    it(
      'rejects invalid credential variable names',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const report =
          service.validate([
            createConfiguration({
              credential: {
                source:
                  'ENVIRONMENT',
                variableName:
                  'openai-api-key',
              },
            }),
          ]);

        expect(
          report.errors,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code:
                'INVALID_CREDENTIAL_VARIABLE',
            }),
          ]),
        );
      },
    );

    it(
      'rejects an empty credential variable name',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const report =
          service.validate([
            createConfiguration({
              credential: {
                source:
                  'ENVIRONMENT',
                variableName:
                  '  ',
              },
            }),
          ]);

        expect(
          report.errors,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code:
                'EMPTY_CREDENTIAL_VARIABLE',
            }),
          ]),
        );
      },
    );

    it(
      'rejects invalid and non-http base URLs',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const invalid =
          service.validate([
            createConfiguration({
              baseUrl:
                'not-a-url',
            }),
          ]);

        const unsupported =
          service.validate([
            createConfiguration({
              baseUrl:
                'file:///tmp/provider',
            }),
          ]);

        expect(
          invalid.errors,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code:
                'INVALID_BASE_URL',
            }),
          ]),
        );

        expect(
          unsupported.errors,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code:
                'INVALID_BASE_URL',
            }),
          ]),
        );
      },
    );

    it(
      'fails closed when live execution is marked authorized',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const report =
          service.validate([
            createConfiguration({
              liveExecutionAuthorized:
                true,
            }),
          ]);

        expect(
          report.errors,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              code:
                'LIVE_EXECUTION_NOT_AUTHORIZED',
            }),
          ]),
        );
      },
    );

    it(
      'assertValid throws a consolidated validation error',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        expect(
          () =>
            service.assertValid([
              createConfiguration({
                timeoutMs:
                  0,
              }),
            ]),
        ).toThrow(
          /INVALID_TIMEOUT/,
        );
      },
    );

    it(
      'returns defensive configuration copies',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const source =
          createConfiguration();

        const report =
          service.validate([
            source,
          ]);

        report
          .configurations[0]
          .credential
          .variableName =
            'CHANGED_API_KEY';

        report
          .configurations[0]
          .metadata!.vendor =
            'Changed';

        expect(
          source
            .credential
            .variableName,
        ).toBe(
          'OPENAI_API_KEY',
        );

        expect(
          source
            .metadata!
            .vendor,
        ).toBe(
          'Example',
        );
      },
    );

    it(
      'does not read credential values from the environment',
      () => {
        const service =
          new AiProviderRuntimeConfigurationService();

        const original =
          process.env
            .OPENAI_API_KEY;

        process.env
          .OPENAI_API_KEY =
            'must-not-be-read';

        try {
          const report =
            service.validate([
              createConfiguration(),
            ]);

          expect(
            report
              .configurations[0]
              .credential,
          ).toEqual({
            source:
              'ENVIRONMENT',
            variableName:
              'OPENAI_API_KEY',
          });

          expect(
            JSON.stringify(
              report,
            ),
          ).not.toContain(
            'must-not-be-read',
          );
        } finally {
          if (
            original ===
            undefined
          ) {
            delete process.env
              .OPENAI_API_KEY;
          } else {
            process.env
              .OPENAI_API_KEY =
                original;
          }
        }
      },
    );
  },
);
