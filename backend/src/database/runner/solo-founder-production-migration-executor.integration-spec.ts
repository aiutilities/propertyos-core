import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { Pool } from 'pg';

import {
  ProductionApprovalGovernanceDecision,
} from './production-approval-governance';
import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';
import {
  sealSoloFounderMigrationInvocation,
  SoloFounderMigrationInvocationRequest,
  SoloFounderProductionMigrationExecutor,
} from './solo-founder-production-migration-executor';

describe('Phase 15C3B solo-founder migration invocation', () => {
  const migrations =
    CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
      migration => migration.name,
    );

  const governanceDecision:
    ProductionApprovalGovernanceDecision = {
      status: 'APPROVED',
      scope: 'PHASE_15C3_APPROVAL_GOVERNANCE',
      policyId: 'propertyos-production-approval',
      policyVersion: 1,
      mode: 'SOLO_FOUNDER_CONTROLLED',
      accountableOwnerId: 'anand-nataraj',
      effectiveOperatorId: 'anand-nataraj',
      effectiveApproverId: 'anand-nataraj',
      recoveryOwnerId: 'anand-nataraj',
      incidentOwnerId: 'anand-nataraj',
      coolingOffMinutesObserved: 15,
      commercialProductionAllowed: false,
      runnerExposureAuthorized: false,
      migrationInvocationAuthorized: false,
      evidenceSha256: 'a'.repeat(64),
      errors: [],
    };

  function request(
    overrides:
      Partial<SoloFounderMigrationInvocationRequest> = {},
  ): SoloFounderMigrationInvocationRequest {
    return {
      schemaVersion: 1,
      authorizationId: 'phase-15c3-founder-invocation',
      authorizedAt: '2026-07-20T11:00:00.000Z',
      expiresAt: '2026-07-20T11:30:00.000Z',
      evaluatedAt: '2026-07-20T11:01:00.000Z',
      accountableOwnerId: 'anand-nataraj',
      targetEnvironmentId: 'advaiths-nest-source',
      targetDatabaseName: 'propertyos',
      targetDatabaseIdentityConfirmed: true,
      candidateGitCommit:
        'a92aae4145177c1ddcc5c87c38ff70c51377f54b',
      candidateReleaseTag:
        'v2.9.97-phase-15c3a-editable-solo-governance',
      migrationSetSha256: 'b'.repeat(64),
      backupEvidenceSha256: 'c'.repeat(64),
      backupRestoreVerified: true,
      technicalPreflightEvidenceSha256:
        'd'.repeat(64),
      expectedPendingMigrations: migrations,
      sourceBaseline: {
        schemaMigrationCount: 37,
        corePluginCount: 1,
        controlledMigrationCount: 0,
      },
      maintenanceModeConfirmed: true,
      incidentMonitoringConfirmed: true,
      rollbackOwnerConfirmed: true,
      explicitFinalInvocationConfirmation: true,
      governanceDecision,
      ...overrides,
    };
  }

  it('seals an exact single invocation', () => {
    const seal =
      sealSoloFounderMigrationInvocation(request());

    expect(seal.status)
      .toBe('AUTHORIZED_FOR_SINGLE_INVOCATION');
    expect(seal.singleInvocationAuthorized).toBe(true);
    expect(seal.migrations).toHaveLength(13);
    expect(seal.authorizationEvidenceSha256)
      .toMatch(/^[a-f0-9]{64}$/);
  });

  it('keeps the runner unexposed before execution', () => {
    const seal =
      sealSoloFounderMigrationInvocation(request());

    expect(seal.runnerExposed).toBe(false);
    expect(seal.executionStarted).toBe(false);
    expect(seal.databaseMutated).toBe(false);
  });

  it('blocks without final invocation confirmation', () => {
    const seal =
      sealSoloFounderMigrationInvocation(
        request({
          explicitFinalInvocationConfirmation: false,
        }),
      );

    expect(seal.status).toBe('BLOCKED');
  });

  it('blocks an incorrect source baseline', () => {
    const seal =
      sealSoloFounderMigrationInvocation(
        request({
          sourceBaseline: {
            schemaMigrationCount: 38,
            corePluginCount: 1,
            controlledMigrationCount: 0,
          },
        }),
      );

    expect(seal.status).toBe('BLOCKED');
  });

  it('blocks a changed migration range', () => {
    const seal =
      sealSoloFounderMigrationInvocation(
        request({
          expectedPendingMigrations:
            migrations.slice(0, 12),
        }),
      );

    expect(seal.status).toBe('BLOCKED');
  });

  it('blocks an unverified backup restore', () => {
    const seal =
      sealSoloFounderMigrationInvocation(
        request({
          backupRestoreVerified: false,
        }),
      );

    expect(seal.status).toBe('BLOCKED');
  });

  it('blocks outside the invocation window', () => {
    const seal =
      sealSoloFounderMigrationInvocation(
        request({
          evaluatedAt: '2026-07-20T11:30:00.000Z',
        }),
      );

    expect(seal.status).toBe('BLOCKED');
  });

  it('blocks commercial or non-solo governance', () => {
    const seal =
      sealSoloFounderMigrationInvocation(
        request({
          governanceDecision: {
            ...governanceDecision,
            mode: 'SEPARATION_OF_DUTIES',
            commercialProductionAllowed: true,
          },
        }),
      );

    expect(seal.status).toBe('BLOCKED');
  });

  it('executes all migrations in one transaction', async () => {
    const seal =
      sealSoloFounderMigrationInvocation(request());

    const query = jest.fn(
      async (
        text: string,
        _values?: unknown[],
      ): Promise<{ rows: unknown[] }> => {
        if (text.includes('current_database')) {
          return {
            rows: [{
              database_name: 'propertyos',
            }],
          };
        }

        if (
          text.includes('schema_migration_count')
        ) {
          return {
            rows: [{
              schema_migration_count: '37',
              core_plugin_count: '1',
            }],
          };
        }

        if (
          text.includes(
            'WHERE name = ANY',
          )
        ) {
          return { rows: [] };
        }

        return { rows: [] };
      },
    );

    const release = jest.fn();

    const pool = {
      connect: jest.fn(async () => ({
        query,
        release,
      })),
    } as unknown as Pool;

    const repositoryMigrations =
      migrations.map(name => ({
        name,
        path: `/migrations/${name}`,
        sql: `SELECT '${name}'`,
      }));

    const executor =
      new SoloFounderProductionMigrationExecutor(
        pool,
      );

    const result = await executor.execute(
      seal,
      repositoryMigrations,
    );

    expect(result.status).toBe('APPLIED');
    expect(result.appliedMigrations)
      .toEqual(migrations);
    expect(query).toHaveBeenCalledWith('BEGIN');
    expect(query).toHaveBeenCalledWith('COMMIT');
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('rolls back the atomic range on failure', async () => {
    const seal =
      sealSoloFounderMigrationInvocation(request());

    const query = jest.fn(
      async (
        text: string,
        _values?: unknown[],
      ): Promise<{ rows: unknown[] }> => {
        if (text.includes('current_database')) {
          return {
            rows: [{
              database_name: 'wrong-database',
            }],
          };
        }

        return { rows: [] };
      },
    );

    const release = jest.fn();

    const pool = {
      connect: jest.fn(async () => ({
        query,
        release,
      })),
    } as unknown as Pool;

    const repositoryMigrations =
      migrations.map(name => ({
        name,
        path: `/migrations/${name}`,
        sql: `SELECT '${name}'`,
      }));

    const executor =
      new SoloFounderProductionMigrationExecutor(
        pool,
      );

    await expect(
      executor.execute(
        seal,
        repositoryMigrations,
      ),
    ).rejects.toThrow(
      'SOLO_FOUNDER_MIGRATION_TARGET_MISMATCH',
    );

    expect(query).toHaveBeenCalledWith('ROLLBACK');
    expect(release).toHaveBeenCalledTimes(1);
  });
});
