import {
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Pool } from 'pg';

import {
  ProductionApprovalGovernanceDecision,
} from './production-approval-governance';
import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';
import { MigrationFile } from './migration-loader';

export interface SoloFounderMigrationInvocationRequest {
  schemaVersion: 1;
  authorizationId: string;
  authorizedAt: string;
  expiresAt: string;
  evaluatedAt: string;
  accountableOwnerId: string;
  targetEnvironmentId: string;
  targetDatabaseName: string;
  targetDatabaseIdentityConfirmed: boolean;
  candidateGitCommit: string;
  candidateReleaseTag: string;
  migrationSetSha256: string;
  backupEvidenceSha256: string;
  backupRestoreVerified: boolean;
  technicalPreflightEvidenceSha256: string;
  expectedPendingMigrations: string[];
  sourceBaseline: {
    schemaMigrationCount: number;
    corePluginCount: number;
    controlledMigrationCount: number;
  };
  maintenanceModeConfirmed: boolean;
  incidentMonitoringConfirmed: boolean;
  rollbackOwnerConfirmed: boolean;
  explicitFinalInvocationConfirmation: boolean;
  governanceDecision:
    ProductionApprovalGovernanceDecision;
}

export interface SoloFounderMigrationInvocationSeal {
  status:
    | 'AUTHORIZED_FOR_SINGLE_INVOCATION'
    | 'BLOCKED';
  scope:
    'PHASE_15C3_SOLO_FOUNDER_MIGRATION_INVOCATION';
  authorizationId: string;
  accountableOwnerId: string;
  targetEnvironmentId: string;
  targetDatabaseName: string;
  candidateGitCommit: string;
  candidateReleaseTag: string;
  migrations: string[];
  migrationSetSha256: string;
  authorizationEvidenceSha256: string | null;
  runnerExposed: false;
  singleInvocationAuthorized: boolean;
  executionStarted: false;
  databaseMutated: false;
  errors: string[];
}

export interface SoloFounderMigrationExecutionResult {
  status: 'APPLIED';
  authorizationId: string;
  targetEnvironmentId: string;
  targetDatabaseName: string;
  candidateGitCommit: string;
  appliedMigrations: string[];
  transactionStrategy:
    'ATOMIC_CONTROLLED_RANGE';
  authorizationEvidenceSha256: string;
}

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const RELEASE_TAG_PATTERN =
  /^v[0-9]+\.[0-9]+\.[0-9]+[a-z0-9._-]*$/;

function validTimestamp(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function sameOrderedValues(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (value, index) => value === right[index],
    )
  );
}

export function sealSoloFounderMigrationInvocation(
  request: SoloFounderMigrationInvocationRequest,
): SoloFounderMigrationInvocationSeal {
  const errors: string[] = [];
  const migrations =
    CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
      migration => migration.name,
    );

  if (request.schemaVersion !== 1) {
    errors.push(
      'Unsupported solo-founder invocation schema version',
    );
  }

  for (const identifier of [
    request.authorizationId,
    request.accountableOwnerId,
    request.targetEnvironmentId,
    request.targetDatabaseName,
  ]) {
    if (!IDENTIFIER_PATTERN.test(identifier)) {
      errors.push(
        'Solo-founder invocation identifier is invalid',
      );
      break;
    }
  }

  if (!COMMIT_PATTERN.test(request.candidateGitCommit)) {
    errors.push(
      'Solo-founder invocation Git commit is invalid',
    );
  }

  if (!RELEASE_TAG_PATTERN.test(request.candidateReleaseTag)) {
    errors.push(
      'Solo-founder invocation release tag is invalid',
    );
  }

  for (const digest of [
    request.migrationSetSha256,
    request.backupEvidenceSha256,
    request.technicalPreflightEvidenceSha256,
  ]) {
    if (!SHA256_PATTERN.test(digest)) {
      errors.push(
        'Solo-founder invocation evidence digest is invalid',
      );
      break;
    }
  }

  const governance = request.governanceDecision;

  if (
    governance.status !== 'APPROVED' ||
    governance.mode !== 'SOLO_FOUNDER_CONTROLLED' ||
    governance.commercialProductionAllowed ||
    !governance.evidenceSha256
  ) {
    errors.push(
      'Approved solo-founder governance evidence is required',
    );
  }

  if (
    governance.runnerExposureAuthorized ||
    governance.migrationInvocationAuthorized
  ) {
    errors.push(
      'Governance decision must be non-executing',
    );
  }

  if (
    request.accountableOwnerId !==
      governance.accountableOwnerId ||
    request.accountableOwnerId !==
      governance.effectiveOperatorId ||
    request.accountableOwnerId !==
      governance.effectiveApproverId ||
    request.accountableOwnerId !==
      governance.recoveryOwnerId ||
    request.accountableOwnerId !==
      governance.incidentOwnerId
  ) {
    errors.push(
      'Invocation actors do not match the accountable owner',
    );
  }

  if (!request.targetDatabaseIdentityConfirmed) {
    errors.push(
      'Target database identity confirmation is required',
    );
  }

  if (
    request.sourceBaseline.schemaMigrationCount !== 37 ||
    request.sourceBaseline.corePluginCount !== 1 ||
    request.sourceBaseline.controlledMigrationCount !== 0
  ) {
    errors.push(
      'Solo-founder invocation baseline must match 1|37|0',
    );
  }

  if (
    !sameOrderedValues(
      request.expectedPendingMigrations,
      migrations,
    )
  ) {
    errors.push(
      'Solo-founder invocation migration range does not match',
    );
  }

  if (!request.backupRestoreVerified) {
    errors.push(
      'Fresh backup restore verification is required',
    );
  }

  if (
    !request.maintenanceModeConfirmed ||
    !request.incidentMonitoringConfirmed ||
    !request.rollbackOwnerConfirmed
  ) {
    errors.push(
      'Operational invocation confirmations are incomplete',
    );
  }

  if (!request.explicitFinalInvocationConfirmation) {
    errors.push(
      'Explicit final migration invocation confirmation is required',
    );
  }

  if (
    !validTimestamp(request.authorizedAt) ||
    !validTimestamp(request.expiresAt) ||
    !validTimestamp(request.evaluatedAt)
  ) {
    errors.push(
      'Solo-founder invocation timestamps are invalid',
    );
  } else {
    const authorizedAt = Date.parse(request.authorizedAt);
    const expiresAt = Date.parse(request.expiresAt);
    const evaluatedAt = Date.parse(request.evaluatedAt);

    if (
      expiresAt <= authorizedAt ||
      expiresAt - authorizedAt > 30 * 60 * 1000
    ) {
      errors.push(
        'Solo-founder invocation validity must not exceed 30 minutes',
      );
    }

    if (
      evaluatedAt < authorizedAt ||
      evaluatedAt >= expiresAt
    ) {
      errors.push(
        'Solo-founder invocation is outside its validity window',
      );
    }
  }

  const status =
    errors.length === 0
      ? 'AUTHORIZED_FOR_SINGLE_INVOCATION'
      : 'BLOCKED';

  const authorizationEvidenceSha256 =
    status === 'AUTHORIZED_FOR_SINGLE_INVOCATION'
      ? createHash('sha256')
          .update(
            JSON.stringify({
              accountableOwnerId:
                request.accountableOwnerId,
              authorizationId:
                request.authorizationId,
              authorizedAt:
                request.authorizedAt,
              backupEvidenceSha256:
                request.backupEvidenceSha256,
              candidateGitCommit:
                request.candidateGitCommit,
              candidateReleaseTag:
                request.candidateReleaseTag,
              expiresAt:
                request.expiresAt,
              governanceEvidenceSha256:
                governance.evidenceSha256,
              migrationSetSha256:
                request.migrationSetSha256,
              migrations,
              targetDatabaseName:
                request.targetDatabaseName,
              targetEnvironmentId:
                request.targetEnvironmentId,
              technicalPreflightEvidenceSha256:
                request.technicalPreflightEvidenceSha256,
              transactionStrategy:
                'ATOMIC_CONTROLLED_RANGE',
            }),
            'utf8',
          )
          .digest('hex')
      : null;

  return {
    status,
    scope:
      'PHASE_15C3_SOLO_FOUNDER_MIGRATION_INVOCATION',
    authorizationId:
      request.authorizationId,
    accountableOwnerId:
      request.accountableOwnerId,
    targetEnvironmentId:
      request.targetEnvironmentId,
    targetDatabaseName:
      request.targetDatabaseName,
    candidateGitCommit:
      request.candidateGitCommit,
    candidateReleaseTag:
      request.candidateReleaseTag,
    migrations,
    migrationSetSha256:
      request.migrationSetSha256,
    authorizationEvidenceSha256,
    runnerExposed: false,
    singleInvocationAuthorized:
      status === 'AUTHORIZED_FOR_SINGLE_INVOCATION',
    executionStarted: false,
    databaseMutated: false,
    errors,
  };
}

@Injectable()
export class SoloFounderProductionMigrationExecutor {
  constructor(private readonly pool: Pool) {}

  async execute(
    seal: SoloFounderMigrationInvocationSeal,
    repositoryMigrations: readonly MigrationFile[],
  ): Promise<SoloFounderMigrationExecutionResult> {
    this.assertAuthorized(seal);

    const expectedNames =
      CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
        migration => migration.name,
      );

    if (!sameOrderedValues(seal.migrations, expectedNames)) {
      throw new ConflictException(
        'SOLO_FOUNDER_MIGRATION_RANGE_CHANGED',
      );
    }

    const migrationsByName = new Map(
      repositoryMigrations.map(migration => [
        migration.name,
        migration,
      ]),
    );

    const migrations = seal.migrations.map(name => {
      const migration = migrationsByName.get(name);

      if (!migration) {
        throw new ConflictException(
          `SOLO_FOUNDER_MIGRATION_MISSING: ${name}`,
        );
      }

      return migration;
    });

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(`
        SELECT pg_advisory_xact_lock(
          hashtext(
            'propertyos.solo-founder-production-migration'
          )
        )
      `);

      const identityResult = await client.query<{
        database_name: string;
      }>(`
        SELECT current_database() AS database_name
      `);

      if (
        identityResult.rows[0]?.database_name !==
        seal.targetDatabaseName
      ) {
        throw new ConflictException(
          'SOLO_FOUNDER_MIGRATION_TARGET_MISMATCH',
        );
      }

      const baselineResult = await client.query<{
        schema_migration_count: string;
        core_plugin_count: string;
      }>(`
        SELECT
          (
            SELECT COUNT(*)::text
            FROM schema_migrations
          ) AS schema_migration_count,
          (
            SELECT COUNT(*)::text
            FROM core_plugins
          ) AS core_plugin_count
      `);

      const baseline = baselineResult.rows[0];

      if (
        baseline?.schema_migration_count !== '37' ||
        baseline?.core_plugin_count !== '1'
      ) {
        throw new ConflictException(
          'SOLO_FOUNDER_MIGRATION_BASELINE_CHANGED',
        );
      }

      const appliedResult = await client.query<{
        name: string;
      }>(
        `
        SELECT name
        FROM schema_migrations
        WHERE name = ANY($1::text[])
        ORDER BY name
        FOR UPDATE
        `,
        [seal.migrations],
      );

      if (appliedResult.rows.length > 0) {
        throw new ConflictException(
          'SOLO_FOUNDER_MIGRATION_ALREADY_APPLIED: ' +
            appliedResult.rows
              .map(row => row.name)
              .join(', '),
        );
      }

      for (const migration of migrations) {
        await client.query(migration.sql);

        await client.query(
          `
          INSERT INTO schema_migrations (name)
          VALUES ($1)
          `,
          [migration.name],
        );
      }

      await client.query('COMMIT');

      return {
        status: 'APPLIED',
        authorizationId:
          seal.authorizationId,
        targetEnvironmentId:
          seal.targetEnvironmentId,
        targetDatabaseName:
          seal.targetDatabaseName,
        candidateGitCommit:
          seal.candidateGitCommit,
        appliedMigrations:
          migrations.map(migration => migration.name),
        transactionStrategy:
          'ATOMIC_CONTROLLED_RANGE',
        authorizationEvidenceSha256:
          seal.authorizationEvidenceSha256!,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private assertAuthorized(
    seal: SoloFounderMigrationInvocationSeal,
  ): void {
    if (
      seal.status !==
        'AUTHORIZED_FOR_SINGLE_INVOCATION' ||
      !seal.singleInvocationAuthorized ||
      seal.runnerExposed ||
      seal.executionStarted ||
      seal.databaseMutated ||
      !seal.authorizationEvidenceSha256 ||
      !SHA256_PATTERN.test(
        seal.authorizationEvidenceSha256,
      )
    ) {
      throw new ConflictException(
        'SOLO_FOUNDER_MIGRATION_INVOCATION_NOT_AUTHORIZED',
      );
    }
  }
}
