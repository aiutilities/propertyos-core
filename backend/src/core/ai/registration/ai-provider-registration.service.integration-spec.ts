import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  AiProviderPort,
} from '../contracts/ai-provider.contract';
import {
  AiProviderDiscoveryReport,
  AiProviderDiscoveryService,
} from '../discovery/ai-provider-discovery.service';
import {
  AI_PROVIDER_CONTRACT_VERSION,
  AI_PROVIDER_MANIFEST_VERSION,
  AiProviderManifest,
} from '../manifest/ai-provider-manifest';
import {
  AiProviderRegistry,
} from '../registry/ai-provider.registry';
import {
  AiProvider,
  AiRequest,
  AiResponse,
} from '../types/ai.types';
import {
  AiProviderRegistrationError,
  AiProviderRegistrationService,
} from './ai-provider-registration.service';

function createProvider(
  name: string,
  id =
    `test.${name}`,
): AiProviderPort {
  const displayName =
    `${name} provider`;

  const manifest:
    AiProviderManifest = {
      manifestVersion:
        AI_PROVIDER_MANIFEST_VERSION,
      provider: {
        id,
        name,
        displayName,
        version: '1.0.0',
        vendor:
          'PropertyOS Test Suite',
      },
      compatibility: {
        propertyOsVersion:
          '^0.1.0',
        aiContractVersion:
          `^${AI_PROVIDER_CONTRACT_VERSION}`,
      },
      execution: {
        supportedModes: [
          'SIMULATED',
        ],
      },
      capabilities: [
        'CHAT',
      ],
      models: [
        {
          id:
            `${name}-model`,
          displayName:
            `${displayName} model`,
          contextWindow:
            4_096,
          maxInputTokens:
            3_072,
          maxOutputTokens:
            1_024,
          supportsStreaming:
            false,
          supportsVision:
            false,
          supportsToolCalling:
            false,
        },
      ],
      limits: {
        maxInputTokens:
          3_072,
        maxOutputTokens:
          1_024,
        maxTotalTokens:
          4_096,
      },
    };

  return {
    name,
    displayName,
    capabilities: [
      'CHAT',
    ],
    manifest,
    getProvider():
      AiProvider {
      return {
        id: name,
        name,
        displayName,
        status: 'ACTIVE',
        capabilities: [
          'CHAT',
        ],
        defaultModel:
          `${name}-model`,
      };
    },
    async generate(
      request: AiRequest,
    ): Promise<AiResponse> {
      return {
        providerName: name,
        model:
          request.model ??
          `${name}-model`,
        content:
          `${name} response`,
      };
    },
  };
}

function discoveredReport(
  providers:
    readonly AiProviderPort[],
): AiProviderDiscoveryReport {
  const ordered = [
    ...providers,
  ].sort(
    (left, right) =>
      left.name.localeCompare(
        right.name,
      ),
  );

  return {
    discoveredProviderNames:
      ordered.map(
        (provider) =>
          provider.name,
      ),
    rejectedProviderNames:
      [],
    candidates:
      ordered.map(
        (provider) => ({
          providerName:
            provider.name,
          providerId:
            provider.manifest
              .provider.id,
          status:
            'DISCOVERED' as const,
          provider,
          manifest:
            provider.manifest,
          reasons: [],
        }),
      ),
  };
}

function createService(
  report:
    AiProviderDiscoveryReport,
  registry =
    new AiProviderRegistry(),
) {
  const discovery = {
    discover:
      jest.fn(
        () => report,
      ),
  } as unknown as
    AiProviderDiscoveryService;

  return {
    discovery,
    registry,
    service:
      new AiProviderRegistrationService(
        discovery,
        registry,
      ),
  };
}

describe(
  'AI provider validated registration',
  () => {
    it(
      'registers discovered providers',
      () => {
        const alpha =
          createProvider(
            'alpha',
          );

        const {
          service,
          registry,
        } = createService(
          discoveredReport([
            alpha,
          ]),
        );

        expect(
          service
            .registerDiscoveredProviders(),
        ).toEqual({
          discoveredProviderNames: [
            'alpha',
          ],
          registeredProviderNames: [
            'alpha',
          ],
          alreadyRegisteredProviderNames:
            [],
          entries: [
            {
              providerName:
                'alpha',
              providerId:
                'test.alpha',
              status:
                'REGISTERED',
            },
          ],
        });

        expect(
          registry.get(
            'alpha',
          ),
        ).toBe(alpha);
      },
    );

    it(
      'registers providers in deterministic name order',
      () => {
        const zeta =
          createProvider(
            'zeta',
          );

        const alpha =
          createProvider(
            'alpha',
          );

        const report =
          discoveredReport([
            zeta,
            alpha,
          ]);

        report.candidates.reverse();

        const {
          service,
          registry,
        } = createService(
          report,
        );

        const register =
          jest.spyOn(
            registry,
            'register',
          );

        const result =
          service
            .registerDiscoveredProviders();

        expect(
          register.mock.calls.map(
            ([provider]) =>
              provider.name,
          ),
        ).toEqual([
          'alpha',
          'zeta',
        ]);

        expect(
          result
            .registeredProviderNames,
        ).toEqual([
          'alpha',
          'zeta',
        ]);
      },
    );

    it(
      'is idempotent for the same provider instances',
      () => {
        const alpha =
          createProvider(
            'alpha',
          );

        const {
          service,
          registry,
        } = createService(
          discoveredReport([
            alpha,
          ]),
        );

        expect(
          service
            .registerDiscoveredProviders()
            .registeredProviderNames,
        ).toEqual([
          'alpha',
        ]);

        const register =
          jest.spyOn(
            registry,
            'register',
          );

        expect(
          service
            .registerDiscoveredProviders(),
        ).toEqual({
          discoveredProviderNames: [
            'alpha',
          ],
          registeredProviderNames:
            [],
          alreadyRegisteredProviderNames:
            [
              'alpha',
            ],
          entries: [
            {
              providerName:
                'alpha',
              providerId:
                'test.alpha',
              status:
                'ALREADY_REGISTERED',
            },
          ],
        });

        expect(
          register,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'fails closed before mutation when discovery contains rejected candidates',
      () => {
        const alpha =
          createProvider(
            'alpha',
          );

        const report =
          discoveredReport([
            alpha,
          ]);

        report
          .rejectedProviderNames = [
            'invalid',
          ];

        report.candidates.push({
          providerName:
            'invalid',
          providerId:
            'test.invalid',
          status:
            'REJECTED',
          reasons: [
            'Manifest incompatible',
          ],
        });

        const {
          service,
          registry,
        } = createService(
          report,
        );

        expect(
          () =>
            service
              .registerDiscoveredProviders(),
        ).toThrow(
          AiProviderRegistrationError,
        );

        expect(
          registry.list(),
        ).toEqual([]);
      },
    );

    it(
      'fails closed when a discovered candidate lacks a provider instance',
      () => {
        const report:
          AiProviderDiscoveryReport = {
            discoveredProviderNames: [
              'missing',
            ],
            rejectedProviderNames:
              [],
            candidates: [
              {
                providerName:
                  'missing',
                providerId:
                  'test.missing',
                status:
                  'DISCOVERED',
                manifest:
                  createProvider(
                    'missing',
                  ).manifest,
                reasons: [],
              },
            ],
          };

        const {
          service,
          registry,
        } = createService(
          report,
        );

        expect(
          () =>
            service
              .registerDiscoveredProviders(),
        ).toThrow(
          'AI provider registration candidate is missing its provider instance',
        );

        expect(
          registry.list(),
        ).toEqual([]);
      },
    );

    it(
      'fails closed when a candidate lacks a provider identifier',
      () => {
        const provider =
          createProvider(
            'missing-id',
          );

        const report =
          discoveredReport([
            provider,
          ]);

        report.candidates[0]
          .providerId =
          undefined;

        const {
          service,
          registry,
        } = createService(
          report,
        );

        expect(
          () =>
            service
              .registerDiscoveredProviders(),
        ).toThrow(
          'AI provider registration candidate is missing its provider identifier',
        );

        expect(
          registry.list(),
        ).toEqual([]);
      },
    );

    it(
      'fails closed on an existing different provider instance',
      () => {
        const existing =
          createProvider(
            'alpha',
          );

        const discovered =
          createProvider(
            'alpha',
          );

        const registry =
          new AiProviderRegistry();

        registry.register(
          existing,
        );

        const {
          service,
        } = createService(
          discoveredReport([
            discovered,
          ]),
          registry,
        );

        expect(
          () =>
            service
              .registerDiscoveredProviders(),
        ).toThrow(
          'AI provider registration conflicts with an existing registry entry',
        );

        expect(
          registry.get(
            'alpha',
          ),
        ).toBe(existing);
      },
    );

    it(
      'performs no partial registration when a later candidate conflicts',
      () => {
        const alpha =
          createProvider(
            'alpha',
          );

        const existingZeta =
          createProvider(
            'zeta',
          );

        const discoveredZeta =
          createProvider(
            'zeta',
          );

        const registry =
          new AiProviderRegistry();

        registry.register(
          existingZeta,
        );

        const {
          service,
        } = createService(
          discoveredReport([
            alpha,
            discoveredZeta,
          ]),
          registry,
        );

        expect(
          () =>
            service
              .registerDiscoveredProviders(),
        ).toThrow(
          AiProviderRegistrationError,
        );

        expect(
          registry.get(
            'alpha',
          ),
        ).toBeUndefined();

        expect(
          registry.get(
            'zeta',
          ),
        ).toBe(
          existingZeta,
        );
      },
    );

    it(
      'does not execute providers during registration',
      () => {
        const alpha =
          createProvider(
            'alpha',
          );

        const generate =
          jest.spyOn(
            alpha,
            'generate',
          );

        const {
          service,
        } = createService(
          discoveredReport([
            alpha,
          ]),
        );

        service
          .registerDiscoveredProviders();

        expect(
          generate,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'returns an empty report when no providers are discovered',
      () => {
        const {
          service,
        } = createService({
          discoveredProviderNames:
            [],
          rejectedProviderNames:
            [],
          candidates: [],
        });

        expect(
          service
            .registerDiscoveredProviders(),
        ).toEqual({
          discoveredProviderNames:
            [],
          registeredProviderNames:
            [],
          alreadyRegisteredProviderNames:
            [],
          entries: [],
        });
      },
    );
  },
);
