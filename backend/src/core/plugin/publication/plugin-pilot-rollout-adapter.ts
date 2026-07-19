import {
  createHash,
} from 'crypto';
import {
  Pool,
} from 'pg';
import {
  PluginMarketplaceService,
} from '../marketplace/services/plugin-marketplace.service';
import {
  PluginPilotRolloutInput,
} from './plugin-pilot-rollout-plan';
import {
  PilotInstallationObservation,
  PilotMarketplacePublication,
  PilotRuntimeSnapshot,
  PilotSignatureObservation,
  PilotTrustObservation,
  PluginPilotRolloutPorts,
} from './plugin-pilot-rollout-executor';
import {
  PluginPublicationAdmissionService,
} from './plugin-publication-admission.service';
import {
  PluginPublicationGovernanceService,
} from './plugin-publication-governance.service';
import {
  PluginPublicationInstallationService,
} from './plugin-publication-installation.service';

const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

export interface PilotOfflineSignatureEvidence {
  environmentId: string;
  pluginId: string;
  version: string;
  publisherId: 'propertyos';
  keyId: string;
  keyFingerprintSha256: string;
  artifactSha256: string;
  integritySha256: string;
  verifiedAt: string;
  verifierId: string;
  valid: true;
}

export interface PilotOfflineSignatureEvidenceReader {
  read(
    input: PluginPilotRolloutInput,
  ): Promise<
    PilotOfflineSignatureEvidence
  >;
}

export interface PluginPilotRolloutAdapterConfig {
  environmentClass:
    'ISOLATED' | 'STAGING';
  environmentId: string;
  expectedDatabaseName: string;
  forbiddenDatabaseNames:
    readonly string[];
}

interface InstalledPluginRow {
  name: string;
  version: string;
  status: string;
  manifest:
    Record<string, unknown>;
  activated_at:
    Date | string | null;
  deactivated_at:
    Date | string | null;
}

export class PluginPilotRolloutAdapter
  implements PluginPilotRolloutPorts {
  constructor(
    private readonly pool: Pool,
    private readonly admission:
      PluginPublicationAdmissionService,
    private readonly governance:
      PluginPublicationGovernanceService,
    private readonly marketplace:
      PluginMarketplaceService,
    private readonly installation:
      PluginPublicationInstallationService,
    private readonly signatureEvidence:
      PilotOfflineSignatureEvidenceReader,
    private readonly config:
      PluginPilotRolloutAdapterConfig,
  ) {
    this.assertConfig();
  }

  async inspectTrust(
    input: PluginPilotRolloutInput,
  ): Promise<PilotTrustObservation> {
    await this.assertTargetDatabase();

    const result =
      await this.pool.query(
        `
        SELECT
          publisher.id
            AS publisher_id,
          publisher.status
            AS publisher_status,
          signing_key.key_id,
          signing_key.status
            AS key_status,
          signing_key.fingerprint_sha256
        FROM plugin_publishers
          AS publisher
        INNER JOIN
          plugin_publisher_keys
            AS signing_key
          ON signing_key.publisher_id =
            publisher.id
        WHERE publisher.id = $1
          AND signing_key.key_id = $2
          AND publisher.revoked_at
            IS NULL
          AND signing_key.revoked_at
            IS NULL
          AND signing_key.valid_from
            <= NOW()
          AND (
            signing_key.valid_until
              IS NULL
            OR signing_key.valid_until
              > NOW()
          )
        `,
        [
          input.publisherId,
          input.keyId,
        ],
      );

    const row =
      result.rows[0];

    if (
      !row ||
      row.publisher_status !==
        'ACTIVE' ||
      row.key_status !== 'ACTIVE'
    ) {
      throw new Error(
        'PILOT_TRUST_NOT_ACTIVE',
      );
    }

    return {
      publisherId:
        String(row.publisher_id),
      publisherStatus: 'ACTIVE',
      keyId:
        String(row.key_id),
      keyStatus: 'ACTIVE',
      keyFingerprintSha256:
        String(
          row.fingerprint_sha256,
        ),
    };
  }

  async verifyOfflineSignature(
    input: PluginPilotRolloutInput,
  ): Promise<PilotSignatureObservation> {
    const evidence =
      await this.signatureEvidence.read(
        input,
      );

    if (
      evidence.environmentId !==
        this.config.environmentId ||
      evidence.pluginId !==
        input.pluginId ||
      evidence.version !==
        input.version ||
      evidence.publisherId !==
        input.publisherId ||
      evidence.keyId !==
        input.keyId ||
      evidence
        .keyFingerprintSha256 !==
          input.keyFingerprintSha256 ||
      evidence.artifactSha256 !==
        input.artifactSha256 ||
      evidence.integritySha256 !==
        input.integritySha256 ||
      evidence.valid !== true ||
      !evidence.verifierId.trim() ||
      !Number.isFinite(
        Date.parse(
          evidence.verifiedAt,
        ),
      )
    ) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_EVIDENCE_MISMATCH',
      );
    }

    for (
      const digest of [
        evidence
          .keyFingerprintSha256,
        evidence.artifactSha256,
        evidence.integritySha256,
      ]
    ) {
      if (!SHA256_PATTERN.test(digest)) {
        throw new Error(
          'PILOT_OFFLINE_SIGNATURE_EVIDENCE_INVALID',
        );
      }
    }

    return {
      valid: true,
      publisherId:
        evidence.publisherId,
      keyId: evidence.keyId,
      artifactSha256:
        evidence.artifactSha256,
      integritySha256:
        evidence.integritySha256,
    };
  }

  async admitStoredArtifact(
    input: {
      storageObjectId: string;
      actorId: string;
      metadata:
        Record<string, unknown>;
    },
  ) {
    await this.assertTargetDatabase();

    return await this.admission.admit(
      input,
    );
  }

  async transitionPublication(
    input: {
      publicationId: string;
      targetStatus:
        | 'APPROVED'
        | 'QUARANTINED'
        | 'REVOKED';
      actorId: string;
      reason: string;
      metadata:
        Record<string, unknown>;
    },
  ) {
    await this.assertTargetDatabase();

    return await this.governance
      .transition(input);
  }

  async listMarketplacePublications():
    Promise<
      PilotMarketplacePublication[]
    > {
    await this.assertTargetDatabase();

    const plugins =
      await this.marketplace.list();

    return plugins.flatMap(
      (plugin) =>
        plugin.versions.map(
          (version) => ({
            publicationId:
              version.publicationId,
            pluginId:
              plugin.id,
            version:
              version.version,
            publisherId:
              plugin.provider,
            artifactSha256:
              version.checksum,
            integritySha256:
              version
                .integrityChecksum,
            verified:
              plugin.verified === true
                ? true as const
                : this.unverifiedMarketplaceEntry(),
          }),
        ),
    );
  }

  async installApprovedPublication(
    input: {
      publicationId: string;
      actorId: string;
      autoEnable: true;
      overwrite: false;
      metadata:
        Record<string, unknown>;
    },
  ): Promise<unknown> {
    await this.assertTargetDatabase();

    const result =
      await this.installation.install(
        input,
      );

    if (
      !result.success ||
      result.stage !== 'COMPLETE' ||
      !result.installedPluginId
    ) {
      throw new Error(
        [
          'PILOT_APPROVED_INSTALLATION_FAILED',
          result.error ??
            result.messages.join('; '),
        ].join(':'),
      );
    }

    return result;
  }

  async inspectInstallationProvenance(
    pluginId: string,
  ): Promise<
    PilotInstallationObservation
  > {
    await this.assertTargetDatabase();

    const row =
      await this.loadPilotPlugin(
        pluginId,
      );
    const provenance =
      this.record(
        row.manifest
          .installationProvenance,
      );

    const observation = {
      pluginId:
        this.string(
          provenance.pluginId,
        ),
      version:
        this.string(
          provenance.version,
        ),
      publicationId:
        this.string(
          provenance.publicationId,
        ),
      publisherId:
        this.string(
          provenance.publisherId,
        ),
      keyId:
        this.string(
          provenance.keyId,
        ),
      artifactStorageObjectId:
        this.string(
          provenance
            .artifactStorageObjectId,
        ),
      artifactSha256:
        this.string(
          provenance.artifactSha256,
        ),
      integritySha256:
        this.string(
          provenance.integritySha256,
        ),
    };

    if (
      !observation.pluginId ||
      !observation.version ||
      !observation.publicationId ||
      !observation.publisherId ||
      !observation.keyId ||
      !observation
        .artifactStorageObjectId ||
      !SHA256_PATTERN.test(
        observation.artifactSha256,
      ) ||
      !SHA256_PATTERN.test(
        observation.integritySha256,
      )
    ) {
      throw new Error(
        'PILOT_INSTALLATION_PROVENANCE_ABSENT',
      );
    }

    return observation;
  }

  async inspectRuntime(
    pluginId: string,
  ): Promise<PilotRuntimeSnapshot> {
    await this.assertTargetDatabase();

    const result =
      await this.pool.query(
        `
        SELECT
          name,
          version,
          status,
          manifest,
          activated_at,
          deactivated_at
        FROM core_plugins
        ORDER BY name ASC
        `,
      );

    const rows =
      result.rows as
        InstalledPluginRow[];

    const pilot =
      rows.find(
        (row) =>
          this.manifestPluginId(
            row.manifest,
          ) === pluginId ||
          row.name === pluginId,
      );

    const unrelated =
      rows
        .filter(
          (row) =>
            row !== pilot,
        )
        .map(
          (row) => ({
            name: row.name,
            version: row.version,
            status: row.status,
            activatedAt:
              this.timestamp(
                row.activated_at,
              ),
            deactivatedAt:
              this.timestamp(
                row.deactivated_at,
              ),
            manifestSha256:
              createHash('sha256')
                .update(
                  this.stableJson(
                    row.manifest,
                  ),
                  'utf8',
                )
                .digest('hex'),
          }),
        );

    return {
      pilotInstalled:
        pilot !== undefined,
      pilotActive:
        pilot?.status === 'ACTIVE',
      unrelatedPluginCount:
        unrelated.length,
      unrelatedStateSha256:
        createHash('sha256')
          .update(
            JSON.stringify(
              unrelated,
            ),
            'utf8',
          )
          .digest('hex'),
    };
  }

  private async assertTargetDatabase():
    Promise<void> {
    const result =
      await this.pool.query(
        `
        SELECT
          current_database()
            AS database_name,
          pg_is_in_recovery()
            AS in_recovery
        `,
      );

    const row =
      result.rows[0];
    const databaseName =
      String(
        row?.database_name ?? '',
      );

    if (
      databaseName !==
        this.config
          .expectedDatabaseName ||
      this.config
        .forbiddenDatabaseNames
        .includes(databaseName) ||
      row?.in_recovery === true
    ) {
      throw new Error(
        'PILOT_TARGET_DATABASE_FORBIDDEN',
      );
    }
  }

  private async loadPilotPlugin(
    pluginId: string,
  ): Promise<InstalledPluginRow> {
    const result =
      await this.pool.query(
        `
        SELECT
          name,
          version,
          status,
          manifest,
          activated_at,
          deactivated_at
        FROM core_plugins
        WHERE manifest->>'id' = $1
          OR name = $1
        ORDER BY
          CASE
            WHEN manifest->>'id' = $1
            THEN 0
            ELSE 1
          END
        LIMIT 1
        `,
        [
          pluginId,
        ],
      );

    if (!result.rows[0]) {
      throw new Error(
        'PILOT_INSTALLATION_NOT_FOUND',
      );
    }

    return result
      .rows[0] as
        InstalledPluginRow;
  }

  private assertConfig(): void {
    if (
      this.config.environmentClass !==
        'ISOLATED' &&
      this.config.environmentClass !==
        'STAGING'
    ) {
      throw new Error(
        'PILOT_ADAPTER_PRODUCTION_FORBIDDEN',
      );
    }

    if (
      !this.config.environmentId.trim() ||
      !this.config
        .expectedDatabaseName
        .trim() ||
      this.config
        .forbiddenDatabaseNames
        .includes(
          this.config
            .expectedDatabaseName,
        )
    ) {
      throw new Error(
        'PILOT_ADAPTER_CONFIG_INVALID',
      );
    }
  }

  private unverifiedMarketplaceEntry():
    never {
    throw new Error(
      'PILOT_MARKETPLACE_ENTRY_UNVERIFIED',
    );
  }

  private record(
    value: unknown,
  ): Record<string, unknown> {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      return {};
    }

    return value as
      Record<string, unknown>;
  }

  private string(
    value: unknown,
  ): string {
    return typeof value === 'string'
      ? value
      : '';
  }

  private manifestPluginId(
    manifest:
      Record<string, unknown>,
  ): string {
    return this.string(
      manifest.id,
    );
  }

  private timestamp(
    value:
      Date | string | null,
  ): string | null {
    if (!value) {
      return null;
    }

    return new Date(value)
      .toISOString();
  }

  private stableJson(
    value: unknown,
  ): string {
    if (
      value === null ||
      typeof value !== 'object'
    ) {
      return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
      return [
        '[',
        value
          .map(
            (item) =>
              this.stableJson(item),
          )
          .join(','),
        ']',
      ].join('');
    }

    const record =
      value as
        Record<string, unknown>;

    return [
      '{',
      Object.keys(record)
        .sort()
        .map(
          (key) =>
            [
              JSON.stringify(key),
              ':',
              this.stableJson(
                record[key],
              ),
            ].join(''),
        )
        .join(','),
      '}',
    ].join('');
  }
}
