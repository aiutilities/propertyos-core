import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  DeploymentBackupEvidence,
  validateDeploymentBackupEvidence,
} from './deployment-backup-evidence';
import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';

const GIT_COMMIT =
  '24033e4ad4e5c79deeb98f7813dd1d56fcd80ac1';

function validEvidence():
  DeploymentBackupEvidence {
  return {
    schemaVersion: 1,
    environmentId: 'propertyos-staging',
    capturedAt: '2026-07-19T15:00:00.000Z',
    gitCommit: GIT_COMMIT,
    releaseTag:
      'v2.9.37-phase-13d1c-controlled-migration-scope',
    database: {
      name: 'propertyos',
      serverMajorVersion: 16,
      migrationCount: 37,
      corePluginCount: 1,
    },
    dump: {
      format: 'POSTGRES_CUSTOM',
      path:
        '/backups/propertyos-20260719.dump',
      sha256: 'a'.repeat(64),
      sizeBytes: 1024,
      restoreListVerified: true,
    },
    storage: {
      evidenceReference:
        'storage-backup-20260719',
      verified: true,
    },
    controlledPendingMigrations:
      CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
        (migration) => migration.name,
      ),
    isolatedRestore: {
      environmentId:
        'propertyos-restore-exercise',
      completedAt:
        '2026-07-19T15:30:00.000Z',
      verified: true,
    },
  };
}

describe('Phase 13D backup evidence', () => {
  it('validates complete evidence without authorizing apply', () => {
    const result =
      validateDeploymentBackupEvidence(
        validEvidence(),
        GIT_COMMIT,
      );

    expect(result.status).toBe('VALID');
    expect(result.applyAuthorized).toBe(false);
    expect(result.errors).toEqual([]);
  });

  it('rejects evidence from a different commit', () => {
    const evidence = validEvidence();
    evidence.gitCommit = 'b'.repeat(40);

    const result =
      validateDeploymentBackupEvidence(
        evidence,
        GIT_COMMIT,
      );

    expect(result.status).toBe('INVALID');
    expect(result.errors).toContain(
      'Backup Git commit does not match rollout commit',
    );
  });

  it('rejects an unreadable or empty dump', () => {
    const evidence = validEvidence();
    evidence.dump.sizeBytes = 0;
    evidence.dump.restoreListVerified = false;

    const result =
      validateDeploymentBackupEvidence(
        evidence,
        GIT_COMMIT,
      );

    expect(result.status).toBe('INVALID');
    expect(result.errors).toContain(
      'Database dump must be non-empty',
    );
    expect(result.errors).toContain(
      'pg_restore list verification is required',
    );
  });

  it('rejects an altered pending migration inventory', () => {
    const evidence = validEvidence();
    evidence.controlledPendingMigrations =
      evidence.controlledPendingMigrations.slice(1);

    const result =
      validateDeploymentBackupEvidence(
        evidence,
        GIT_COMMIT,
      );

    expect(result.status).toBe('INVALID');
    expect(result.errors).toContain(
      'Controlled pending migration inventory does not match',
    );
  });

  it('rejects restore exercises in the source environment', () => {
    const evidence = validEvidence();
    evidence.isolatedRestore.environmentId =
      evidence.environmentId;

    const result =
      validateDeploymentBackupEvidence(
        evidence,
        GIT_COMMIT,
      );

    expect(result.status).toBe('INVALID');
    expect(result.errors).toContain(
      'Restore exercise must use a different environment',
    );
  });

  it('rejects missing storage and restore proof', () => {
    const evidence = validEvidence();
    evidence.storage.verified = false;
    evidence.isolatedRestore.verified = false;

    const result =
      validateDeploymentBackupEvidence(
        evidence,
        GIT_COMMIT,
      );

    expect(result.status).toBe('INVALID');
    expect(result.errors).toContain(
      'Storage backup evidence is not verified',
    );
    expect(result.errors).toContain(
      'Successful isolated restore evidence is required',
    );
  });
});
