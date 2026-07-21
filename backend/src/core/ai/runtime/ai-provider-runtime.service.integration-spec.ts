import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  AiProviderRuntimeConfigurationService,
} from '../configuration/ai-provider-runtime-configuration.service';
import {
  AiProviderCredentialResolver,
} from '../contracts/ai-provider-credential-resolver.contract';
import {
  AiProviderHttpTransport,
} from '../contracts/ai-provider-http-transport.contract';
import {
  AiProviderRuntimeError,
} from '../errors/ai-provider-runtime.error';
import {
  AiProviderRuntimeConfiguration,
} from '../types/ai-provider-runtime-configuration.types';
import {
  AiProviderRuntimeService,
} from './ai-provider-runtime.service';

describe(
  'AI provider runtime base',
  () => {
    const createConfiguration =
      (
        overrides:
          Partial<AiProviderRuntimeConfiguration> =
            {},
      ):
        AiProviderRuntimeConfiguration => ({
          providerName:
            ' OpenAI ',
          enabled:
            true,
          priority:
            10,
          defaultModel:
            ' model-a ',
          baseUrl:
            ' https://api.example.test/v1/ ',
          timeoutMs:
            30_000,
          maxRetries:
            2,
          credential: {
            source:
              'ENVIRONMENT',
            variableName:
              'PROPERTYOS_TEST_PROVIDER_KEY',
          },
          liveExecutionAuthorized:
            false,
          metadata: {
            vendor:
              'Example',
          },
          ...overrides,
        });

    const createCredentialResolver =
      (
        value =
          'private-credential',
      ):
        AiProviderCredentialResolver => ({
          resolve: () => ({
            credential: {
              providerName:
                'openai',
              value,
              source:
                'ENVIRONMENT',
              variableName:
                'PROPERTYOS_TEST_PROVIDER_KEY',
            },
            report: {
              providerName:
                'openai',
              source:
                'ENVIRONMENT',
              variableName:
                'PROPERTYOS_TEST_PROVIDER_KEY',
              status:
                'RESOLVED',
              present:
                true,
              maskedValue:
                '**************tial',
            },
          }),

          assertResolved() {
            return this.resolve({
              providerName:
                'openai',
              reference: {
                source:
                  'ENVIRONMENT',
                variableName:
                  'PROPERTYOS_TEST_PROVIDER_KEY',
              },
            });
          },
        });

    const createTransport =
      (): {
        transport:
          AiProviderHttpTransport;
        requests:
          Array<{
            providerName: string;
            url: string;
            method: string;
            headers?:
              Record<string, string>;
            body?: unknown;
            timeoutMs: number;
          }>;
      } => {
        const requests:
          Array<{
            providerName: string;
            url: string;
            method: string;
            headers?:
              Record<string, string>;
            body?: unknown;
            timeoutMs: number;
          }> =
            [];

        return {
          requests,
          transport: {
            async execute<T>(
              request,
            ) {
              requests.push(
                request,
              );

              return {
                providerName:
                  request
                    .providerName,
                status:
                  200,
                ok:
                  true,
                headers: {
                  'content-type':
                    'application/json',
                },
                data: {
                  result:
                    'success',
                } as T,
                durationMs:
                  4,
              };
            },
          },
        };
      };

    const createService =
      (options?: {
        credentialResolver?:
          AiProviderCredentialResolver;
        transport?:
          AiProviderHttpTransport;
      }): AiProviderRuntimeService =>
        new AiProviderRuntimeService(
          new AiProviderRuntimeConfigurationService(),
          options
            ?.credentialResolver ??
            createCredentialResolver(),
          options
            ?.transport ??
            createTransport()
              .transport,
        );

    it(
      'prepares a normalized provider runtime',
      () => {
        const runtime =
          createService()
            .prepare(
              createConfiguration(),
            );

        expect(
          runtime,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'openai',
            configuration:
              expect.objectContaining({
                providerName:
                  'openai',
                defaultModel:
                  'model-a',
                baseUrl:
                  'https://api.example.test/v1/',
                timeoutMs:
                  30_000,
              }),
            credential:
              expect.objectContaining({
                value:
                  'private-credential',
                variableName:
                  'PROPERTYOS_TEST_PROVIDER_KEY',
              }),
          }),
        );
      },
    );

    it(
      'returns defensive configuration copies',
      () => {
        const configuration =
          createConfiguration();

        const runtime =
          createService()
            .prepare(
              configuration,
            );

        runtime
          .configuration
          .credential
          .variableName =
          'CHANGED';

        expect(
          configuration
            .credential
            .variableName,
        ).toBe(
          'PROPERTYOS_TEST_PROVIDER_KEY',
        );
      },
    );

    it(
      'rejects a disabled provider',
      () => {
        expect(
          () =>
            createService()
              .prepare(
                createConfiguration({
                  enabled:
                    false,
                }),
              ),
        ).toThrow(
          expect.objectContaining({
            code:
              'PROVIDER_DISABLED',
          }),
        );
      },
    );

    it(
      'rejects an invalid configuration',
      () => {
        expect(
          () =>
            createService()
              .prepare(
                createConfiguration({
                  timeoutMs:
                    0,
                }),
              ),
        ).toThrow(
          expect.objectContaining({
            code:
              'CONFIGURATION_INVALID',
          }),
        );
      },
    );

    it(
      'rejects a missing base URL',
      () => {
        expect(
          () =>
            createService()
              .prepare(
                createConfiguration({
                  baseUrl:
                    undefined,
                }),
              ),
        ).toThrow(
          expect.objectContaining({
            code:
              'BASE_URL_MISSING',
          }),
        );
      },
    );

    it(
      'normalizes credential resolution failures',
      () => {
        const resolver:
          AiProviderCredentialResolver = {
            resolve: () => ({
              report: {
                providerName:
                  'openai',
                source:
                  'ENVIRONMENT',
                variableName:
                  'PROPERTYOS_TEST_PROVIDER_KEY',
                status:
                  'MISSING',
                present:
                  false,
              },
            }),
            assertResolved: () => {
              throw new Error(
                'credential missing',
              );
            },
          };

        expect(
          () =>
            createService({
              credentialResolver:
                resolver,
            }).prepare(
              createConfiguration(),
            ),
        ).toThrow(
          expect.objectContaining({
            code:
              'CREDENTIAL_UNAVAILABLE',
          }),
        );
      },
    );

    it(
      'executes through the provider-neutral transport',
      async () => {
        const {
          transport,
          requests,
        } =
          createTransport();

        const result =
          await createService({
            transport,
          }).execute<{
            result: string;
          }>({
            configuration:
              createConfiguration(),
            path:
              '/chat/completions',
            method:
              'POST',
            headers: {
              'x-provider-version':
                '1',
            },
            body: {
              messages: [],
            },
            createCredentialHeaders:
              (credential) => ({
                authorization:
                  `Bearer ${credential}`,
              }),
          });

        expect(
          requests,
        ).toEqual([
          {
            providerName:
              'openai',
            url:
              'https://api.example.test/v1/chat/completions',
            method:
              'POST',
            headers: {
              'x-provider-version':
                '1',
              authorization:
                'Bearer private-credential',
            },
            body: {
              messages: [],
            },
            timeoutMs:
              30_000,
          },
        ]);

        expect(
          result,
        ).toEqual(
          expect.objectContaining({
            providerName:
              'openai',
            model:
              'model-a',
            attempt:
              1,
            response:
              expect.objectContaining({
                status:
                  200,
                data: {
                  result:
                    'success',
                },
              }),
          }),
        );
      },
    );

    it(
      'rejects absolute request URLs',
      async () => {
        await expect(
          createService()
            .execute({
              configuration:
                createConfiguration(),
              path:
                'https://other.example.test/request',
              method:
                'POST',
              createCredentialHeaders:
                () => ({
                  authorization:
                    'Bearer value',
                }),
            }),
        ).rejects.toMatchObject({
          code:
            'INVALID_PATH',
        });
      },
    );

    it(
      'does not expose credentials in runtime errors',
      async () => {
        const secret =
          'highly-private-secret';

        const service =
          createService({
            credentialResolver:
              createCredentialResolver(
                secret,
              ),
          });

        let captured:
          unknown;

        try {
          await service.execute({
            configuration:
              createConfiguration(),
            path:
              '/chat',
            method:
              'POST',
            createCredentialHeaders:
              () => {
                throw new Error(
                  secret,
                );
              },
          });
        } catch (error) {
          captured =
            error;
        }

        expect(
          captured,
        ).toBeInstanceOf(
          AiProviderRuntimeError,
        );

        expect(
          String(
            captured,
          ),
        ).not.toContain(
          secret,
        );
      },
    );

    it(
      'does not retry inside the runtime base',
      async () => {
        let executions =
          0;

        const transport:
          AiProviderHttpTransport = {
            async execute() {
              executions +=
                1;

              throw new Error(
                'transport failure',
              );
            },
          };

        await expect(
          createService({
            transport,
          }).execute({
            configuration:
              createConfiguration({
                maxRetries:
                  5,
              }),
            path:
              '/chat',
            method:
              'POST',
            createCredentialHeaders:
              () => ({
                authorization:
                  'Bearer value',
              }),
          }),
        ).rejects.toThrow(
          'transport failure',
        );

        expect(
          executions,
        ).toBe(
          1,
        );
      },
    );
  },
);
