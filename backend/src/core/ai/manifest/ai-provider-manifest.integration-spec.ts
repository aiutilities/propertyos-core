import { describe, expect, it } from '@jest/globals';
import {
  AI_PROVIDER_CONTRACT_VERSION,
  AI_PROVIDER_MANIFEST_VERSION,
  AiProviderManifest,
  PROPERTYOS_PLATFORM_VERSION,
} from './ai-provider-manifest';
import {
  assertValidAiProviderManifest,
  validateAiProviderManifest,
} from './ai-provider-manifest.validator';

function createManifest(): AiProviderManifest {
  return {
    manifestVersion:
      AI_PROVIDER_MANIFEST_VERSION,
    provider: {
      id: 'mock-ai',
      name: 'mock',
      displayName: 'Mock AI Provider',
      version: '1.0.0',
      vendor: 'PropertyOS',
      description:
        'Local deterministic provider',
    },
    compatibility: {
      propertyOsVersion: '^0.1.0',
      aiContractVersion:
        `^${AI_PROVIDER_CONTRACT_VERSION}`,
    },
    execution: {
      supportedModes: [
        'SIMULATED',
        'ISOLATED',
      ],
    },
    capabilities: [
      'CHAT',
      'TEXT_GENERATION',
      'SUMMARIZATION',
    ],
    models: [
      {
        id: 'mock-model',
        displayName: 'Mock Model',
        contextWindow: 8_192,
        maxInputTokens: 6_144,
        maxOutputTokens: 2_048,
        supportsStreaming: false,
        supportsVision: false,
        supportsToolCalling: false,
      },
    ],
    limits: {
      maxInputTokens: 6_144,
      maxOutputTokens: 2_048,
      maxTotalTokens: 8_192,
    },
    metadata: {
      runtime: 'local',
    },
  };
}

describe(
  'AI provider manifest validation',
  () => {
    it(
      'accepts a valid compatible manifest',
      () => {
        const manifest =
          createManifest();

        const result =
          validateAiProviderManifest(
            manifest,
          );

        expect(result).toEqual({
          valid: true,
          compatible: true,
          errors: [],
          manifest,
        });
      },
    );

    it(
      'returns the validated manifest through the assertion boundary',
      () => {
        const manifest =
          createManifest();

        expect(
          assertValidAiProviderManifest(
            manifest,
          ),
        ).toBe(manifest);
      },
    );

    it(
      'rejects unsupported manifest versions',
      () => {
        const manifest = {
          ...createManifest(),
          manifestVersion: '2.0.0',
        };

        const result =
          validateAiProviderManifest(
            manifest,
          );

        expect(result.valid).toBe(true);
        expect(result.compatible).toBe(false);
        expect(result.errors).toContain(
          'Unsupported manifestVersion: 2.0.0; supported version is 1.0.0',
        );
      },
    );

    it(
      'rejects malformed provider semantic versions',
      () => {
        const manifest =
          createManifest();

        manifest.provider.version =
          'version-one';

        const result =
          validateAiProviderManifest(
            manifest,
          );

        expect(result.valid).toBe(false);
        expect(result.compatible).toBe(false);
        expect(result.errors).toContain(
          'Invalid provider.version: version-one',
        );
      },
    );

    it(
      'rejects incompatible PropertyOS versions',
      () => {
        const manifest =
          createManifest();

        manifest.compatibility
          .propertyOsVersion =
          '>=9.0.0';

        const result =
          validateAiProviderManifest(
            manifest,
            {
              platformVersion:
                PROPERTYOS_PLATFORM_VERSION,
            },
          );

        expect(result.valid).toBe(true);
        expect(result.compatible).toBe(false);
        expect(result.errors).toContain(
          'Provider requires PropertyOS >=9.0.0; current platform is 0.1.0',
        );
      },
    );

    it(
      'rejects incompatible AI contract versions',
      () => {
        const manifest =
          createManifest();

        manifest.compatibility
          .aiContractVersion =
          '>=9.0.0';

        const result =
          validateAiProviderManifest(
            manifest,
          );

        expect(result.valid).toBe(true);
        expect(result.compatible).toBe(false);
        expect(result.errors).toContain(
          'Provider requires AI contract >=9.0.0; current contract is 1.0.0',
        );
      },
    );

    it(
      'rejects duplicate capabilities',
      () => {
        const manifest =
          createManifest();

        manifest.capabilities = [
          'CHAT',
          'CHAT',
        ];

        const result =
          validateAiProviderManifest(
            manifest,
          );

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'capabilities must not contain duplicates',
        );
      },
    );

    it(
      'rejects unsupported capabilities',
      () => {
        const manifest =
          createManifest() as unknown as {
            capabilities: string[];
          };

        manifest.capabilities = [
          'UNSUPPORTED',
        ];

        const result =
          validateAiProviderManifest(
            manifest,
          );

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'Unsupported AI capability: UNSUPPORTED',
        );
      },
    );

    it(
      'rejects duplicate model IDs',
      () => {
        const manifest =
          createManifest();

        manifest.models.push({
          ...manifest.models[0],
        });

        const result =
          validateAiProviderManifest(
            manifest,
          );

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'models must not contain duplicate model IDs',
        );
      },
    );

    it(
      'rejects invalid model limits',
      () => {
        const manifest =
          createManifest();

        manifest.models[0]
          .maxInputTokens =
          9_000;

        const result =
          validateAiProviderManifest(
            manifest,
          );

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'models[0].maxInputTokens cannot exceed contextWindow',
        );
      },
    );

    it(
      'rejects duplicate execution modes',
      () => {
        const manifest =
          createManifest();

        manifest.execution
          .supportedModes = [
          'SIMULATED',
          'SIMULATED',
        ];

        const result =
          validateAiProviderManifest(
            manifest,
          );

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'execution.supportedModes must not contain duplicates',
        );
      },
    );

    it(
      'rejects inconsistent aggregate token limits',
      () => {
        const manifest =
          createManifest();

        manifest.limits
          .maxTotalTokens =
          1_000;

        const result =
          validateAiProviderManifest(
            manifest,
          );

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
          'limits.maxTotalTokens cannot be lower than maxInputTokens plus maxOutputTokens',
        );
      },
    );

    it(
      'rejects non-object manifests',
      () => {
        expect(
          validateAiProviderManifest(
            null,
          ),
        ).toEqual({
          valid: false,
          compatible: false,
          errors: [
            'AI provider manifest must be an object',
          ],
        });
      },
    );

    it(
      'throws at the assertion boundary for invalid manifests',
      () => {
        expect(
          () =>
            assertValidAiProviderManifest(
              {},
            ),
        ).toThrow(
          'Invalid AI provider manifest:',
        );
      },
    );
  },
);
