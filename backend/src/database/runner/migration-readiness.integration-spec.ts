import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  buildMigrationReadinessReport,
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
  migrationSha256,
} from './migration-readiness';
import {
  loadMigrationFiles,
  MigrationFile,
} from './migration-loader';

describe('Phase 13D migration readiness', () => {
  const controlledNames =
    CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
      (migration) => migration.name,
    );

  function controlledMigrations(): MigrationFile[] {
    return loadMigrationFiles().filter((migration) =>
      controlledNames.includes(migration.name),
    );
  }

  it('accepts immutable migrations 044 through 048', () => {
    const report = buildMigrationReadinessReport(
      controlledMigrations(),
      '2026-07-19T00:00:00.000Z',
    );

    expect(report.status).toBe('READY');
    expect(report.databaseTouched).toBe(false);
    expect(report.applyAuthorized).toBe(false);
    expect(report.errors).toEqual([]);
    expect(report.migrations).toHaveLength(12);
    expect(
      report.migrations.every(
        (migration) => migration.ready,
      ),
    ).toBe(true);
  });

  it('pins the required rollout order', () => {
    expect(controlledNames).toEqual([
      'core/037-create-core-inventory-material-issue.sql',
      'core/038-create-core-inventory-material-return.sql',
      'core/039-create-core-inventory-batch-foundation.sql',
      'core/040-add-procurement-batch-receipt-integration.sql',
      'core/041-add-inventory-material-issue-batch.sql',
      'core/042-add-inventory-material-return-batch.sql',
      'core/043-add-inventory-stock-reservation-batch.sql',
      'core/044-create-plugin-installation-attempts.sql',
      'core/045-add-plugin-migration-integrity.sql',
      'core/046-create-plugin-publisher-trust.sql',
      'core/047-create-plugin-publication-governance.sql',
      'core/048-create-plugin-trust-security-events.sql',
    ]);
  });

  it('requires backup restore recovery and authorization', () => {
    const report =
      buildMigrationReadinessReport(
        controlledMigrations(),
      );

    expect(report.requirements).toEqual({
      backupEvidenceRequired: true,
      restoreExerciseRequired: true,
      isolatedEnvironmentFirst: true,
      explicitProductionAuthorizationRequired: true,
    });

    expect(
      report.migrations.every(
        (migration) =>
          migration.transactional &&
          !migration.reversible &&
          migration.recovery === 'BACKUP_RESTORE',
      ),
    ).toBe(true);
  });

  it('blocks a missing controlled migration', () => {
    const migrations = controlledMigrations().filter(
      (migration) =>
        migration.name !==
        'core/047-create-plugin-publication-governance.sql',
    );

    const report =
      buildMigrationReadinessReport(migrations);

    expect(report.status).toBe('BLOCKED');
    expect(report.errors).toContain(
      'Missing migration: ' +
        'core/047-create-plugin-publication-governance.sql',
    );
  });

  it('blocks migration content drift', () => {
    const migrations = controlledMigrations().map(
      (migration) =>
        migration.name ===
        'core/046-create-plugin-publisher-trust.sql'
          ? {
              ...migration,
              sql: `${migration.sql}\n-- unexpected drift`,
            }
          : migration,
    );

    const report =
      buildMigrationReadinessReport(migrations);

    expect(report.status).toBe('BLOCKED');
    expect(
      report.errors.some((error) =>
        error.startsWith(
          'Checksum mismatch for ' +
            'core/046-create-plugin-publisher-trust.sql',
        ),
      ),
    ).toBe(true);
  });

  it('blocks an invalid dependency order', () => {
    const migrations = controlledMigrations();
    const migration046 = migrations.find(
      (migration) =>
        migration.name ===
        'core/046-create-plugin-publisher-trust.sql',
    );
    const migration047 = migrations.find(
      (migration) =>
        migration.name ===
        'core/047-create-plugin-publication-governance.sql',
    );

    expect(migration046).toBeDefined();
    expect(migration047).toBeDefined();

    const reordered = migrations.filter(
      (migration) =>
        migration !== migration046 &&
        migration !== migration047,
    );

    reordered.push(migration047!, migration046!);

    const report =
      buildMigrationReadinessReport(reordered);

    expect(report.status).toBe('BLOCKED');
    expect(report.errors).toContain(
      'Dependency order violation: ' +
        'core/046-create-plugin-publisher-trust.sql ' +
        'must precede ' +
        'core/047-create-plugin-publication-governance.sql',
    );
  });

  it('computes deterministic lowercase SHA-256', () => {
    const digest = migrationSha256('PropertyOS');

    expect(digest).toMatch(/^[a-f0-9]{64}$/);
    expect(digest).toBe(
      migrationSha256('PropertyOS'),
    );
  });
});
