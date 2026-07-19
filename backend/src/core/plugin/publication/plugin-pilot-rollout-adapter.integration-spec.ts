import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  Pool,
} from 'pg';
import {
  PluginMarketplaceService,
} from '../marketplace/services/plugin-marketplace.service';
import {
  PluginPilotRolloutAdapter,
  PilotOfflineSignatureEvidenceReader,
} from './plugin-pilot-rollout-adapter';
import {
  PluginPublicationAdmissionService,
} from './plugin-publication-admission.service';
import {
  PluginPublicationGovernanceService,
} from './plugin-publication-governance.service';
import {
  PluginPublicationInstallationService,
} from './plugin-publication-installation.service';
import {
  PluginPilotRolloutInput,
} from './plugin-pilot-rollout-plan';

const DIGEST_A = 'a'.repeat(64);
const DIGEST_B = 'b'.repeat(64);
const DIGEST_C = 'c'.repeat(64);
const STORAGE_OBJECT_ID =
  '11111111-1111-4111-8111-111111111111';
const PUBLICATION_ID =
  '22222222-2222-4222-8222-222222222222';

function desired():
  PluginPilotRolloutInput {
  return {
    environmentClass: 'ISOLATED',
    environmentId:
      'phase-13d4-isolated',
    pluginId:
      'propertyos.phase13d4-pilot',
    pluginName:
      'PropertyOS Phase 13D4 Pilot',
    version: '1.0.0',
    publisherId: 'propertyos',
    keyId: 'pilot-key-2026',
    keyFingerprintSha256:
      DIGEST_A,
    artifactSha256: DIGEST_B,
    integritySha256: DIGEST_C,
    submitterId: 'pilot-submitter',
    approverId: 'pilot-approver',
    installerId: 'pilot-installer',
    securityOperatorId:
      'pilot-security-operator',
    evidenceTimestamp:
      '2026-07-19T18:30:00.000Z',
    expectedUnrelatedPluginCount: 1,
    runtimeContainmentEnabled: false,
  };
}

interface HarnessOptions {
  databaseName?: string;
  databaseInRecovery?: boolean;
  signatureArtifactSha256?: string;
  marketplaceVerified?: boolean;
  installationSuccess?: boolean;
  pilotRow?: boolean;
  pilotStatus?: string;
  provenanceArtifactSha256?: string;
}

function harness(
  options: HarnessOptions = {},
) {
  const input = desired();
  const databaseName =
    options.databaseName ??
    'propertyos_phase_13d4_pilot';

  const pilotManifest = {
    name:
      'propertyos-phase13d4-pilot',
    version: input.version,
    installationProvenance: {
      publicationId:
        PUBLICATION_ID,
      pluginId:
        input.pluginId,
      version:
        input.version,
      publisherId:
        input.publisherId,
      keyId:
        input.keyId,
      artifactStorageObjectId:
        STORAGE_OBJECT_ID,
      artifactSha256:
        options
          .provenanceArtifactSha256 ??
        input.artifactSha256,
      integritySha256:
        input.integritySha256,
      verifiedAt:
        '2026-07-19T18:35:00.000Z',
    },
  };

  const unrelatedRow = {
    name: 'visitor',
    version: '1.0.0',
    status: 'ACTIVE',
    manifest: {
      id: 'visitor',
      name: 'visitor',
      version: '1.0.0',
    },
    activated_at:
      '2026-07-19T10:00:00.000Z',
    deactivated_at: null,
  };

  const pilotRow = {
    name:
      'propertyos-phase13d4-pilot',
    version: input.version,
    status:
      options.pilotStatus ??
      'ACTIVE',
    manifest: pilotManifest,
    activated_at:
      '2026-07-19T18:35:00.000Z',
    deactivated_at: null,
  };

  const query = jest.fn(
    async (text: string) => {
      if (
        text.includes(
          'current_database()',
        )
      ) {
        return {
          rows: [
            {
              database_name:
                databaseName,
              in_recovery:
                options
                  .databaseInRecovery ??
                false,
            },
          ],
          rowCount: 1,
        };
      }

      if (
        text.includes(
          'FROM plugin_publishers',
        )
      ) {
        return {
          rows: [
            {
              publisher_id:
                input.publisherId,
              publisher_status:
                'ACTIVE',
              key_id:
                input.keyId,
              key_status:
                'ACTIVE',
              fingerprint_sha256:
                input
                  .keyFingerprintSha256,
            },
          ],
          rowCount: 1,
        };
      }

      if (
        text.includes(
          "->'installationProvenance'",
        ) &&
        text.includes(
          'LIMIT 1',
        )
      ) {
        return {
          rows:
            options.pilotRow === false
              ? []
              : [pilotRow],
          rowCount:
            options.pilotRow === false
              ? 0
              : 1,
        };
      }

      if (
        text.includes(
          'FROM core_plugins',
        )
      ) {
        return {
          rows:
            options.pilotRow
              ? [
                  unrelatedRow,
                  pilotRow,
                ]
              : [
                  unrelatedRow,
                ],
          rowCount:
            options.pilotRow
              ? 2
              : 1,
        };
      }

      throw new Error(
        `Unexpected query: ${text}`,
      );
    },
  );

  const pool = {
    query,
  } as unknown as Pool;

  const admit = jest.fn(
    async () => ({
      id: PUBLICATION_ID,
    }),
  );

  const transition = jest.fn(
    async () => ({
      id: PUBLICATION_ID,
    }),
  );

  const list = jest.fn(
    async () => [
      {
        id: input.pluginId,
        name: input.pluginName,
        provider:
          input.publisherId,
        tags: [],
        latestVersion:
          input.version,
        status:
          'AVAILABLE' as const,
        verified:
          options
            .marketplaceVerified ??
          true,
        versions: [
          {
            publicationId:
              PUBLICATION_ID,
            version:
              input.version,
            releasedAt:
              new Date(
                '2026-07-19T18:32:00.000Z',
              ),
            minimumPlatformVersion:
              '2.9.0',
            checksum:
              input.artifactSha256,
            integrityChecksum:
              input.integritySha256,
            publisherKeyId:
              input.keyId,
            artifactStorageObjectId:
              STORAGE_OBJECT_ID,
          },
        ],
      },
    ],
  );

  const install = jest.fn(
    async () =>
      options.installationSuccess ===
        false
        ? {
            success: false,
            stage:
              'FAILED' as const,
            messages: [
              'install failed',
            ],
            error:
              'PLUGIN_INSTALLATION_FAILED',
          }
        : {
            success: true,
            stage:
              'COMPLETE' as const,
            installedPluginId:
              '33333333-3333-4333-8333-333333333333',
            messages: [
              'installed',
            ],
          },
  );

  const read = jest.fn(
    async () => ({
      environmentId:
        input.environmentId,
      pluginId:
        input.pluginId,
      version:
        input.version,
      publisherId:
        input.publisherId,
      keyId:
        input.keyId,
      keyFingerprintSha256:
        input.keyFingerprintSha256,
      artifactSha256:
        options
          .signatureArtifactSha256 ??
        input.artifactSha256,
      integritySha256:
        input.integritySha256,
      verifiedAt:
        '2026-07-19T18:29:00.000Z',
      verifierId:
        'offline-verifier-01',
      valid: true as const,
    }),
  );

  const adapter =
    new PluginPilotRolloutAdapter(
      pool,
      {
        admit,
      } as unknown as
        PluginPublicationAdmissionService,
      {
        transition,
      } as unknown as
        PluginPublicationGovernanceService,
      {
        list,
      } as unknown as
        PluginMarketplaceService,
      {
        install,
      } as unknown as
        PluginPublicationInstallationService,
      {
        read,
      } as
        PilotOfflineSignatureEvidenceReader,
      {
        environmentClass:
          'ISOLATED',
        environmentId:
          input.environmentId,
        expectedDatabaseName:
          'propertyos_phase_13d4_pilot',
        forbiddenDatabaseNames: [
          'propertyos',
        ],
      },
    );

  return {
    adapter,
    input,
    query,
    admit,
    transition,
    list,
    install,
    read,
  };
}

describe(
  'Phase 13D pilot rollout adapter',
  () => {
    it(
      'inspects active publisher and key trust',
      async () => {
        const {
          adapter,
          input,
        } = harness();

        await expect(
          adapter.inspectTrust(input),
        ).resolves.toEqual({
          publisherId:
            input.publisherId,
          publisherStatus:
            'ACTIVE',
          keyId: input.keyId,
          keyStatus: 'ACTIVE',
          keyFingerprintSha256:
            input
              .keyFingerprintSha256,
        });
      },
    );

    it(
      'rejects the source database before admission',
      async () => {
        const {
          adapter,
          admit,
        } = harness({
          databaseName: 'propertyos',
        });

        await expect(
          adapter.admitStoredArtifact({
            storageObjectId:
              STORAGE_OBJECT_ID,
            actorId:
              'pilot-submitter',
            metadata: {},
          }),
        ).rejects.toThrow(
          'PILOT_TARGET_DATABASE_FORBIDDEN',
        );

        expect(admit)
          .not.toHaveBeenCalled();
      },
    );

    it(
      'rejects altered offline signature evidence',
      async () => {
        const {
          adapter,
          input,
        } = harness({
          signatureArtifactSha256:
            DIGEST_A,
        });

        await expect(
          adapter
            .verifyOfflineSignature(
              input,
            ),
        ).rejects.toThrow(
          'PILOT_OFFLINE_SIGNATURE_EVIDENCE_MISMATCH',
        );
      },
    );

    it(
      'projects verified marketplace versions',
      async () => {
        const {
          adapter,
        } = harness();

        await expect(
          adapter
            .listMarketplacePublications(),
        ).resolves.toEqual([
          {
            publicationId:
              PUBLICATION_ID,
            pluginId:
              'propertyos.phase13d4-pilot',
            version: '1.0.0',
            publisherId:
              'propertyos',
            artifactSha256:
              DIGEST_B,
            integritySha256:
              DIGEST_C,
            verified: true,
          },
        ]);
      },
    );

    it(
      'rejects an unverified marketplace entry',
      async () => {
        const {
          adapter,
        } = harness({
          marketplaceVerified: false,
        });

        await expect(
          adapter
            .listMarketplacePublications(),
        ).rejects.toThrow(
          'PILOT_MARKETPLACE_ENTRY_UNVERIFIED',
        );
      },
    );

    it(
      'reads persisted approved-installation provenance',
      async () => {
        const {
          adapter,
          input,
        } = harness({
          pilotRow: true,
        });

        await expect(
          adapter
            .inspectInstallationProvenance(
              input.pluginId,
            ),
        ).resolves.toEqual({
          pluginId:
            input.pluginId,
          version:
            input.version,
          publicationId:
            PUBLICATION_ID,
          publisherId:
            input.publisherId,
          keyId:
            input.keyId,
          artifactStorageObjectId:
            STORAGE_OBJECT_ID,
          artifactSha256:
            input.artifactSha256,
          integritySha256:
            input.integritySha256,
        });
      },
    );

    it(
      'creates deterministic unrelated runtime evidence',
      async () => {
        const {
          adapter,
          input,
        } = harness({
          pilotRow: true,
          pilotStatus: 'ACTIVE',
        });

        const first =
          await adapter.inspectRuntime(
            input.pluginId,
          );
        const second =
          await adapter.inspectRuntime(
            input.pluginId,
          );

        expect(first).toEqual(second);
        expect(first).toMatchObject({
          pilotInstalled: true,
          pilotActive: true,
          unrelatedPluginCount: 1,
        });
        expect(
          first.unrelatedStateSha256,
        ).toMatch(/^[a-f0-9]{64}$/);
      },
    );

    it(
      'fails closed when approved installation fails',
      async () => {
        const {
          adapter,
        } = harness({
          installationSuccess: false,
        });

        await expect(
          adapter
            .installApprovedPublication({
              publicationId:
                PUBLICATION_ID,
              actorId:
                'pilot-installer',
              autoEnable: true,
              overwrite: false,
              metadata: {},
            }),
        ).rejects.toThrow(
          'PILOT_APPROVED_INSTALLATION_FAILED',
        );
      },
    );
  },
);
