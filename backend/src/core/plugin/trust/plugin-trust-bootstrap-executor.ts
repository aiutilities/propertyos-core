import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  randomUUID,
} from 'crypto';
import {
  Pool,
} from 'pg';
import {
  POSTGRES_POOL,
} from '../../../database/postgres';
import {
  buildTrustBootstrapPlan,
  ExistingTrustBootstrapState,
  TrustBootstrapInput,
  TrustBootstrapPlan,
} from './plugin-trust-bootstrap-plan';

export interface TrustBootstrapAuthorization {
  approvalId: string;
  approvedBy: string;
  approvedAt: string;
  expectedEvidenceSha256: string;
  environmentClass: 'ISOLATED' | 'STAGING';
  backupEvidenceId: string;
  schemaAcceptanceEvidenceId: string;
  fingerprintConfirmed: boolean;
  privateKeyOfflineAttested: boolean;
}

export interface TrustBootstrapExecutionResult {
  status: 'EXECUTED' | 'NOOP';
  approvalId: string;
  evidenceSha256: string;
  actions: string[];
  publisherId: 'propertyos';
  keyId: string;
  fingerprintSha256: string;
}

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;

@Injectable()
export class PluginTrustBootstrapExecutor {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async execute(
    input: TrustBootstrapInput,
    authorization: TrustBootstrapAuthorization,
  ): Promise<TrustBootstrapExecutionResult> {
    const desiredPlan =
      buildTrustBootstrapPlan(input);

    this.assertPlanReady(desiredPlan);
    this.assertAuthorization(
      input,
      desiredPlan,
      authorization,
    );

    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(`
        SELECT pg_advisory_xact_lock(
          hashtext(
            'propertyos.plugin-trust-bootstrap'
          )
        )
      `);

      const existing =
        await this.loadExistingState(
          client,
          input.keyId,
        );

      const plan =
        buildTrustBootstrapPlan(
          input,
          existing,
        );

      this.assertPlanReady(plan);

      if (
        plan.evidenceSha256 !==
        authorization.expectedEvidenceSha256
      ) {
        throw new ConflictException(
          'PLUGIN_TRUST_BOOTSTRAP_STATE_CHANGED',
        );
      }

      if (!plan.key || !plan.evidenceSha256) {
        throw new ConflictException(
          'PLUGIN_TRUST_BOOTSTRAP_PLAN_INVALID',
        );
      }

      const auditMetadata = {
        approvalId:
          authorization.approvalId,
        approvedBy:
          authorization.approvedBy,
        approvedAt:
          authorization.approvedAt,
        environmentClass:
          authorization.environmentClass,
        backupEvidenceId:
          authorization.backupEvidenceId,
        schemaAcceptanceEvidenceId:
          authorization.schemaAcceptanceEvidenceId,
        fingerprintConfirmed:
          authorization.fingerprintConfirmed,
        privateKeyOfflineAttested:
          authorization.privateKeyOfflineAttested,
        environmentId:
          input.environmentId,
        evidenceSha256:
          plan.evidenceSha256,
        fingerprintSha256:
          plan.key.fingerprintSha256,
        modulusLength:
          plan.key.modulusLength,
      };

      if (
        plan.actions.includes(
          'REGISTER_PUBLISHER',
        )
      ) {
        await client.query(
          `
          INSERT INTO plugin_publishers (
            id,
            display_name,
            status,
            metadata
          )
          VALUES (
            'propertyos',
            'PropertyOS',
            'ACTIVE',
            $1::jsonb
          )
          `,
          [
            JSON.stringify({
              bootstrap:
                auditMetadata,
            }),
          ],
        );

        await client.query(
          `
          INSERT INTO
            plugin_publisher_trust_security_events (
              id,
              publisher_id,
              event_type,
              actor_id,
              metadata
            )
          VALUES (
            $1,
            'propertyos',
            'PUBLISHER_REGISTERED',
            $2,
            $3::jsonb
          )
          `,
          [
            randomUUID(),
            input.actorId,
            JSON.stringify(
              auditMetadata,
            ),
          ],
        );
      }

      if (
        plan.actions.includes(
          'REGISTER_KEY',
        )
      ) {
        await client.query(
          `
          INSERT INTO plugin_publisher_keys (
            key_id,
            publisher_id,
            algorithm,
            public_key_pem,
            fingerprint_sha256,
            status,
            valid_from,
            valid_until
          )
          VALUES (
            $1,
            'propertyos',
            'RSA-SHA256',
            $2,
            $3,
            'ACTIVE',
            $4::timestamptz,
            $5::timestamptz
          )
          `,
          [
            plan.key.keyId,
            plan.key.publicKeyPem,
            plan.key.fingerprintSha256,
            plan.key.validFrom,
            plan.key.validUntil ?? null,
          ],
        );

        await client.query(
          `
          INSERT INTO
            plugin_publisher_trust_security_events (
              id,
              publisher_id,
              key_id,
              event_type,
              actor_id,
              metadata
            )
          VALUES (
            $1,
            'propertyos',
            $2,
            'KEY_REGISTERED',
            $3,
            $4::jsonb
          )
          `,
          [
            randomUUID(),
            plan.key.keyId,
            input.actorId,
            JSON.stringify({
              ...auditMetadata,
              keyId:
                plan.key.keyId,
              algorithm:
                plan.key.algorithm,
            }),
          ],
        );
      }

      await client.query('COMMIT');

      const changed =
        plan.actions.includes(
          'REGISTER_PUBLISHER',
        ) ||
        plan.actions.includes(
          'REGISTER_KEY',
        );

      return {
        status:
          changed ? 'EXECUTED' : 'NOOP',
        approvalId:
          authorization.approvalId,
        evidenceSha256:
          plan.evidenceSha256,
        actions:
          [...plan.actions],
        publisherId:
          'propertyos',
        keyId:
          plan.key.keyId,
        fingerprintSha256:
          plan.key.fingerprintSha256,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async loadExistingState(
    client: {
      query(
        text: string,
        values?: unknown[],
      ): Promise<{
        rows: Record<string, unknown>[];
      }>;
    },
    keyId: string,
  ): Promise<ExistingTrustBootstrapState> {
    const publisherResult =
      await client.query(`
        SELECT
          id,
          display_name,
          status
        FROM plugin_publishers
        WHERE id = 'propertyos'
        FOR UPDATE
      `);

    const keyResult =
      await client.query(
        `
        SELECT
          key_id,
          publisher_id,
          status,
          algorithm,
          public_key_pem,
          fingerprint_sha256,
          valid_from,
          valid_until
        FROM plugin_publisher_keys
        WHERE key_id = $1
        FOR UPDATE
        `,
        [keyId],
      );

    const publisher =
      publisherResult.rows[0];
    const key =
      keyResult.rows[0];

    return {
      publisher: publisher
        ? {
            publisherId:
              String(publisher.id),
            displayName:
              String(
                publisher.display_name,
              ),
            status:
              String(
                publisher.status,
              ) as
                | 'ACTIVE'
                | 'SUSPENDED'
                | 'REVOKED',
          }
        : undefined,
      key: key
        ? {
            keyId:
              String(key.key_id),
            publisherId:
              String(key.publisher_id),
            status:
              String(
                key.status,
              ) as
                | 'ACTIVE'
                | 'REVOKED',
            algorithm:
              String(key.algorithm),
            publicKeyPem:
              String(key.public_key_pem),
            fingerprintSha256:
              String(
                key.fingerprint_sha256,
              ),
            validFrom:
              new Date(
                String(key.valid_from),
              ).toISOString(),
            validUntil:
              key.valid_until
                ? new Date(
                    String(
                      key.valid_until,
                    ),
                  ).toISOString()
                : undefined,
          }
        : undefined,
    };
  }

  private assertPlanReady(
    plan: TrustBootstrapPlan,
  ): void {
    if (
      plan.status !== 'READY' ||
      !plan.key ||
      !plan.evidenceSha256
    ) {
      throw new ConflictException(
        plan.errors.join('; ') ||
          'PLUGIN_TRUST_BOOTSTRAP_BLOCKED',
      );
    }
  }

  private assertAuthorization(
    input: TrustBootstrapInput,
    plan: TrustBootstrapPlan,
    authorization: TrustBootstrapAuthorization,
  ): void {
    if (
      !IDENTIFIER_PATTERN.test(
        authorization.approvalId,
      ) ||
      !IDENTIFIER_PATTERN.test(
        authorization.approvedBy,
      )
    ) {
      throw new ForbiddenException(
        'PLUGIN_TRUST_BOOTSTRAP_APPROVAL_INVALID',
      );
    }

    if (
      authorization.environmentClass !==
        'ISOLATED' &&
      authorization.environmentClass !==
        'STAGING'
    ) {
      throw new ForbiddenException(
        'PLUGIN_TRUST_BOOTSTRAP_ENVIRONMENT_FORBIDDEN',
      );
    }

    if (
      !authorization.backupEvidenceId.trim() ||
      !authorization.schemaAcceptanceEvidenceId.trim()
    ) {
      throw new ForbiddenException(
        'PLUGIN_TRUST_BOOTSTRAP_DEPLOYMENT_EVIDENCE_REQUIRED',
      );
    }

    if (!authorization.fingerprintConfirmed) {
      throw new ForbiddenException(
        'PLUGIN_TRUST_BOOTSTRAP_FINGERPRINT_CONFIRMATION_REQUIRED',
      );
    }

    if (!authorization.privateKeyOfflineAttested) {
      throw new ForbiddenException(
        'PLUGIN_TRUST_BOOTSTRAP_OFFLINE_KEY_ATTESTATION_REQUIRED',
      );
    }

    if (
      authorization.approvedBy ===
      input.actorId
    ) {
      throw new ForbiddenException(
        'PLUGIN_TRUST_BOOTSTRAP_APPROVER_SEPARATION_REQUIRED',
      );
    }

    if (
      !Number.isFinite(
        Date.parse(
          authorization.approvedAt,
        ),
      )
    ) {
      throw new ForbiddenException(
        'PLUGIN_TRUST_BOOTSTRAP_APPROVAL_INVALID',
      );
    }

    if (
      authorization.expectedEvidenceSha256 !==
      plan.evidenceSha256
    ) {
      throw new ForbiddenException(
        'PLUGIN_TRUST_BOOTSTRAP_EVIDENCE_MISMATCH',
      );
    }
  }
}
