import {
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  EnvironmentAiProviderCredentialResolverService,
} from './environment-ai-provider-credential-resolver.service';

describe(
  'Environment AI provider credential resolver',
  () => {
    const variableName =
      'PROPERTYOS_TEST_AI_API_KEY';

    const originalValue =
      process.env[
        variableName
      ];

    afterEach(
      () => {
        if (
          originalValue ===
          undefined
        ) {
          delete process.env[
            variableName
          ];
        } else {
          process.env[
            variableName
          ] =
            originalValue;
        }
      },
    );

    const createOptions =
      () => ({
        providerName:
          ' OpenAI ',
        reference: {
          source:
            'ENVIRONMENT' as const,
          variableName:
            ` ${variableName} `,
        },
      });

    it(
      'resolves a credential from the named environment variable',
      () => {
        process.env[
          variableName
        ] =
          'secret-value-1234';

        const service =
          new EnvironmentAiProviderCredentialResolverService();

        const result =
          service.resolve(
            createOptions(),
          );

        expect(
          result
            .credential,
        ).toEqual({
          providerName:
            'openai',
          value:
            'secret-value-1234',
          source:
            'ENVIRONMENT',
          variableName,
        });

        expect(
          result
            .report,
        ).toEqual({
          providerName:
            'openai',
          source:
            'ENVIRONMENT',
          variableName,
          status:
            'RESOLVED',
          present:
            true,
          maskedValue:
            '*************1234',
        });
      },
    );

    it(
      'does not expose the raw credential in the report',
      () => {
        process.env[
          variableName
        ] =
          'private-secret-value';

        const service =
          new EnvironmentAiProviderCredentialResolverService();

        const result =
          service.resolve(
            createOptions(),
          );

        expect(
          JSON.stringify(
            result.report,
          ),
        ).not.toContain(
          'private-secret-value',
        );

        expect(
          result
            .report
            .maskedValue,
        ).toMatch(
          /^\*+alue$/,
        );
      },
    );

    it(
      'returns a missing report when the variable is absent',
      () => {
        delete process.env[
          variableName
        ];

        const service =
          new EnvironmentAiProviderCredentialResolverService();

        const result =
          service.resolve(
            createOptions(),
          );

        expect(
          result
            .credential,
        ).toBeUndefined();

        expect(
          result
            .report,
        ).toEqual({
          providerName:
            'openai',
          source:
            'ENVIRONMENT',
          variableName,
          status:
            'MISSING',
          present:
            false,
        });
      },
    );

    it(
      'returns a blank report when the variable contains whitespace',
      () => {
        process.env[
          variableName
        ] =
          '   ';

        const service =
          new EnvironmentAiProviderCredentialResolverService();

        const result =
          service.resolve(
            createOptions(),
          );

        expect(
          result
            .credential,
        ).toBeUndefined();

        expect(
          result
            .report
            .status,
        ).toBe(
          'BLANK',
        );
      },
    );

    it(
      'trims the credential before returning it',
      () => {
        process.env[
          variableName
        ] =
          '  credential-value  ';

        const service =
          new EnvironmentAiProviderCredentialResolverService();

        const result =
          service.resolve(
            createOptions(),
          );

        expect(
          result
            .credential
            ?.value,
        ).toBe(
          'credential-value',
        );
      },
    );

    it(
      'masks short credential values completely',
      () => {
        process.env[
          variableName
        ] =
          'abc';

        const service =
          new EnvironmentAiProviderCredentialResolverService();

        const result =
          service.resolve(
            createOptions(),
          );

        expect(
          result
            .report
            .maskedValue,
        ).toBe(
          '***',
        );
      },
    );

    it(
      'assertResolved returns a resolved credential',
      () => {
        process.env[
          variableName
        ] =
          'resolved-value';

        const service =
          new EnvironmentAiProviderCredentialResolverService();

        const result =
          service.assertResolved(
            createOptions(),
          );

        expect(
          result
            .credential
            ?.value,
        ).toBe(
          'resolved-value',
        );
      },
    );

    it(
      'assertResolved fails closed for a missing credential',
      () => {
        delete process.env[
          variableName
        ];

        const service =
          new EnvironmentAiProviderCredentialResolverService();

        expect(
          () =>
            service
              .assertResolved(
                createOptions(),
              ),
        ).toThrow(
          /MISSING/,
        );
      },
    );

    it(
      'assertResolved fails closed for a blank credential',
      () => {
        process.env[
          variableName
        ] =
          '';

        const service =
          new EnvironmentAiProviderCredentialResolverService();

        expect(
          () =>
            service
              .assertResolved(
                createOptions(),
              ),
        ).toThrow(
          /BLANK/,
        );
      },
    );

    it(
      'does not mutate the credential reference',
      () => {
        process.env[
          variableName
        ] =
          'credential-value';

        const options =
          createOptions();

        const service =
          new EnvironmentAiProviderCredentialResolverService();

        service.resolve(
          options,
        );

        expect(
          options,
        ).toEqual({
          providerName:
            ' OpenAI ',
          reference: {
            source:
              'ENVIRONMENT',
            variableName:
              ` ${variableName} `,
          },
        });
      },
    );
  },
);
