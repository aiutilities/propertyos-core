import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  DiscoveryService,
} from '@nestjs/core';
import {
  AiProviderPort,
} from '../contracts/ai-provider.contract';
import {
  AI_PROVIDER_CONTRACT_VERSION,
  AI_PROVIDER_MANIFEST_VERSION,
  AiProviderManifest,
} from '../manifest/ai-provider-manifest';
import {
  MockAiProvider,
} from '../providers/mock-ai.provider';
import {
  AiProviderDiscoveryService,
} from './ai-provider-discovery.service';

function createManifest(
  options: {
    id?: string;
    name?: string;
    displayName?: string;
    defaultModel?: string;
  } = {},
): AiProviderManifest {
  const name =
    options.name ??
    'alpha';

  const displayName =
    options.displayName ??
    'Alpha Provider';

  const model =
    options.defaultModel ??
    'alpha-model';

  return {
    manifestVersion:
      AI_PROVIDER_MANIFEST_VERSION,
    provider: {
      id:
        options.id ??
        `vendor.${name}`,
      name,
      displayName,
      version: '1.0.0',
      vendor: 'Test Vendor',
    },
    compatibility: {
      propertyOsVersion: '^0.1.0',
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
        id: model,
        displayName:
          `${displayName} Model`,
        contextWindow: 4_096,
        maxInputTokens: 3_072,
        maxOutputTokens: 1_024,
        supportsStreaming: false,
        supportsVision: false,
        supportsToolCalling: false,
      },
    ],
    limits: {
      maxInputTokens: 3_072,
      maxOutputTokens: 1_024,
      maxTotalTokens: 4_096,
    },
  };
}

function createProvider(
  options: {
    id?: string;
    name?: string;
    displayName?: string;
    manifestName?: string;
    capabilities?: AiProviderPort[
      'capabilities'
    ];
    manifestCapabilities?:
      AiProviderPort[
        'capabilities'
      ];
    defaultModel?: string;
  } = {},
): AiProviderPort {
  const name =
    options.name ??
    'alpha';

  const displayName =
    options.displayName ??
    'Alpha Provider';

  const capabilities =
    options.capabilities ??
    [
      'CHAT',
    ];

  const manifest = createManifest({
    id: options.id,
    name:
      options.manifestName ??
      name,
    displayName,
    defaultModel:
      options.defaultModel,
  });

  manifest.capabilities = [
    ...(
      options
        .manifestCapabilities ??
      capabilities
    ),
  ];

  return {
    name,
    displayName,
    capabilities,
    manifest,
    getProvider: () => ({
      id: name,
      name,
      displayName,
      status: 'ACTIVE',
      capabilities,
      defaultModel:
        options.defaultModel ??
        'alpha-model',
    }),
    generate: jest.fn(
      async () => ({
        providerName: name,
        model:
          options.defaultModel ??
          'alpha-model',
        content: 'response',
      }),
    ),
  };
}

function createService(
  instances: unknown[],
): AiProviderDiscoveryService {
  const discovery = {
    getProviders: jest.fn(
      () =>
        instances.map(
          (instance) => ({
            instance,
          }),
        ),
    ),
  } as unknown as DiscoveryService;

  return new AiProviderDiscoveryService(
    discovery,
  );
}

describe(
  'AI provider discovery adapter',
  () => {
    it(
      'discovers a valid loaded AI provider',
      () => {
        const provider =
          createProvider();

        const result =
          createService([
            provider,
          ]).discover();

        expect(
          result
            .discoveredProviderNames,
        ).toEqual([
          'alpha',
        ]);

        expect(
          result.rejectedProviderNames,
        ).toEqual([]);

        expect(
          result.candidates,
        ).toHaveLength(1);

        expect(
          result.candidates[0],
        ).toMatchObject({
          providerName: 'alpha',
          providerId:
            'vendor.alpha',
          status: 'DISCOVERED',
          provider,
          manifest:
            provider.manifest,
          reasons: [],
        });
      },
    );

    it(
      'discovers the built-in mock provider',
      () => {
        const provider =
          new MockAiProvider();

        const result =
          createService([
            provider,
          ]).discover();

        expect(
          result
            .discoveredProviderNames,
        ).toEqual([
          'mock',
        ]);

        expect(
          result.candidates[0]
            .manifest
            ?.provider.id,
        ).toBe(
          'propertyos.mock-ai',
        );
      },
    );

    it(
      'ignores unrelated Nest providers',
      () => {
        const result =
          createService([
            {},
            {
              name:
                'ordinary-service',
            },
            null,
            undefined,
          ]).discover();

        expect(result).toEqual({
          discoveredProviderNames:
            [],
          rejectedProviderNames:
            [],
          candidates: [],
        });
      },
    );

    it(
      'rejects incompatible manifests',
      () => {
        const provider =
          createProvider();

        provider.manifest
          .compatibility
          .propertyOsVersion =
          '>=9.0.0';

        const result =
          createService([
            provider,
          ]).discover();

        expect(
          result
            .discoveredProviderNames,
        ).toEqual([]);

        expect(
          result.rejectedProviderNames,
        ).toEqual([
          'alpha',
        ]);

        expect(
          result.candidates[0]
            .reasons,
        ).toContain(
          'Provider requires PropertyOS >=9.0.0; current platform is 0.1.0',
        );
      },
    );

    it(
      'rejects provider and manifest name mismatches',
      () => {
        const provider =
          createProvider({
            manifestName:
              'different',
          });

        const result =
          createService([
            provider,
          ]).discover();

        expect(
          result.candidates[0],
        ).toMatchObject({
          providerName: 'alpha',
          status: 'REJECTED',
        });

        expect(
          result.candidates[0]
            .reasons,
        ).toContain(
          'AI provider name does not match manifest: alpha != different',
        );
      },
    );

    it(
      'rejects capability mismatches',
      () => {
        const provider =
          createProvider({
            capabilities: [
              'CHAT',
            ],
            manifestCapabilities: [
              'SUMMARIZATION',
            ],
          });

        const result =
          createService([
            provider,
          ]).discover();

        expect(
          result.candidates[0]
            .status,
        ).toBe('REJECTED');

        expect(
          result.candidates[0]
            .reasons,
        ).toContain(
          'AI provider capabilities do not match manifest',
        );
      },
    );

    it(
      'rejects undeclared default models',
      () => {
        const provider =
          createProvider();

        provider.getProvider =
          () => ({
            id: 'alpha',
            name: 'alpha',
            displayName:
              'Alpha Provider',
            status: 'ACTIVE',
            capabilities: [
              'CHAT',
            ],
            defaultModel:
              'undeclared-model',
          });

        const result =
          createService([
            provider,
          ]).discover();

        expect(
          result.candidates[0]
            .status,
        ).toBe('REJECTED');

        expect(
          result.candidates[0]
            .reasons,
        ).toContain(
          'AI provider default model is not declared in manifest: undeclared-model',
        );
      },
    );

    it(
      'rejects duplicate provider names deterministically',
      () => {
        const first =
          createProvider({
            id:
              'vendor.alpha-one',
          });

        const second =
          createProvider({
            id:
              'vendor.alpha-two',
          });

        const result =
          createService([
            second,
            first,
          ]).discover();

        expect(
          result
            .discoveredProviderNames,
        ).toEqual([]);

        expect(
          result.rejectedProviderNames,
        ).toEqual([
          'alpha',
        ]);

        expect(
          result.candidates,
        ).toHaveLength(2);

        expect(
          result.candidates.every(
            (candidate) =>
              candidate.status ===
              'REJECTED',
          ),
        ).toBe(true);

        expect(
          result.candidates.every(
            (candidate) =>
              candidate.reasons
                .includes(
                  'Duplicate AI provider name discovered: alpha',
                ),
          ),
        ).toBe(true);
      },
    );

    it(
      'returns providers in deterministic name order',
      () => {
        const result =
          createService([
            createProvider({
              name: 'zeta',
              displayName:
                'Zeta Provider',
            }),
            createProvider({
              name: 'alpha',
              displayName:
                'Alpha Provider',
            }),
          ]).discover();

        expect(
          result
            .discoveredProviderNames,
        ).toEqual([
          'alpha',
          'zeta',
        ]);

        expect(
          result.candidates.map(
            (candidate) =>
              candidate.providerName,
          ),
        ).toEqual([
          'alpha',
          'zeta',
        ]);
      },
    );

    it(
      'does not register or execute discovered providers',
      () => {
        const provider =
          createProvider();

        const result =
          createService([
            provider,
          ]).discover();

        expect(
          result
            .discoveredProviderNames,
        ).toEqual([
          'alpha',
        ]);

        expect(
          provider.generate,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
