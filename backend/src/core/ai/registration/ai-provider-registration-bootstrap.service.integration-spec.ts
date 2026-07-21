import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  AiProviderRegistrationBootstrapService,
} from './ai-provider-registration-bootstrap.service';
import {
  AiProviderRegistrationError,
  AiProviderRegistrationReport,
  AiProviderRegistrationService,
} from './ai-provider-registration.service';

describe(
  'AI provider registration bootstrap',
  () => {
    it(
      'invokes validated registration during application bootstrap',
      () => {
        const report:
          AiProviderRegistrationReport = {
            discoveredProviderNames: [
              'mock',
            ],
            registeredProviderNames: [
              'mock',
            ],
            alreadyRegisteredProviderNames:
              [],
            entries: [
              {
                providerName:
                  'mock',
                providerId:
                  'propertyos.mock-ai',
                status:
                  'REGISTERED',
              },
            ],
          };

        const registerDiscoveredProviders =
          jest.fn(
            () => report,
          );

        const service =
          new AiProviderRegistrationBootstrapService(
            {
              registerDiscoveredProviders,
            } as unknown as
              AiProviderRegistrationService,
          );

        service
          .onApplicationBootstrap();

        expect(
          registerDiscoveredProviders,
        ).toHaveBeenCalledTimes(1);

        expect(
          service
            .getRegistrationReport(),
        ).toEqual(report);
      },
    );

    it(
      'propagates fail-closed registration errors',
      () => {
        const error =
          new AiProviderRegistrationError(
            'Registration blocked',
            [
              'invalid: incompatible manifest',
            ],
          );

        const registerDiscoveredProviders =
          jest.fn(
            () => {
              throw error;
            },
          );

        const service =
          new AiProviderRegistrationBootstrapService(
            {
              registerDiscoveredProviders,
            } as unknown as
              AiProviderRegistrationService,
          );

        expect(
          () =>
            service
              .onApplicationBootstrap(),
        ).toThrow(error);

        expect(
          service
            .getRegistrationReport(),
        ).toBeUndefined();
      },
    );

    it(
      'does not rerun registration when reading the report',
      () => {
        const report:
          AiProviderRegistrationReport = {
            discoveredProviderNames:
              [],
            registeredProviderNames:
              [],
            alreadyRegisteredProviderNames:
              [],
            entries: [],
          };

        const registerDiscoveredProviders =
          jest.fn(
            () => report,
          );

        const service =
          new AiProviderRegistrationBootstrapService(
            {
              registerDiscoveredProviders,
            } as unknown as
              AiProviderRegistrationService,
          );

        service
          .onApplicationBootstrap();

        service
          .getRegistrationReport();

        service
          .getRegistrationReport();

        expect(
          registerDiscoveredProviders,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'returns a defensive copy of the registration report',
      () => {
        const report:
          AiProviderRegistrationReport = {
            discoveredProviderNames: [
              'mock',
            ],
            registeredProviderNames: [
              'mock',
            ],
            alreadyRegisteredProviderNames:
              [],
            entries: [
              {
                providerName:
                  'mock',
                providerId:
                  'propertyos.mock-ai',
                status:
                  'REGISTERED',
              },
            ],
          };

        const service =
          new AiProviderRegistrationBootstrapService(
            {
              registerDiscoveredProviders:
                () => report,
            } as unknown as
              AiProviderRegistrationService,
          );

        service
          .onApplicationBootstrap();

        const first =
          service
            .getRegistrationReport();

        first!
          .registeredProviderNames
          .push(
            'mutated',
          );

        first!
          .entries[0]
          .providerName =
          'mutated';

        expect(
          service
            .getRegistrationReport(),
        ).toEqual(report);
      },
    );
  },
);
