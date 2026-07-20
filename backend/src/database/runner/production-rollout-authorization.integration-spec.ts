import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  buildProductionRolloutAuthorizationPlan,
  productionBackupEvidenceSha256,
  ProductionRolloutAuthorizationRequest,
  REQUIRED_PRODUCTION_ABORT_CONDITIONS,
} from './production-rollout-authorization';
import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';

const COMMIT =
  'abf7040ed6abc7af4ef4b451523346cf9f9e1186';
const SHA = 'a'.repeat(64);

function validRequest():
  ProductionRolloutAuthorizationRequest {
  const migrations =
    CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
      (migration) => migration.name,
    );

  const request:
    ProductionRolloutAuthorizationRequest = {
    environmentClass: 'PRODUCTION',
    environmentId: 'propertyos-production',
    targetDatabaseName: 'propertyos',
    targetDatabaseIdentityConfirmed: true,
    gitCommit: COMMIT,
    releaseTag:
      'v2.9.58-phase-13d5-production-readiness',
    readinessProofSha256: SHA,
    technicalPreflightStatus: 'READY',
    technicalPreflightEvidenceSha256:
      'b'.repeat(64),
    expectedPendingMigrations: migrations,
    sourceBaseline: {
      schemaMigrationCount: 37,
      corePluginCount: 1,
      controlledMigrationCount: 0,
      apiHealthy: true,
      postgresHealthy: true,
    },
    backupEvidence: {
      schemaVersion: 1,
      environmentId: 'propertyos-production',
      capturedAt: '2026-07-20T05:00:00.000Z',
      gitCommit: COMMIT,
      releaseTag:
        'v2.9.58-phase-13d5-production-readiness',
      database: {
        name: 'propertyos',
        serverMajorVersion: 16,
        migrationCount: 37,
        corePluginCount: 1,
      },
      dump: {
        format: 'POSTGRES_CUSTOM',
        path: '/secure/backup/propertyos.dump',
        sha256: 'c'.repeat(64),
        sizeBytes: 1024,
        restoreListVerified: true,
      },
      storage: {
        evidenceReference:
          'storage-backup-evidence-001',
        verified: true,
      },
      controlledPendingMigrations: migrations,
      isolatedRestore: {
        environmentId:
          'propertyos-production-restore-check',
        completedAt:
          '2026-07-20T05:30:00.000Z',
        verified: true,
      },
    },
    backupEvidenceSha256: 'd'.repeat(64),
    operatorId: 'production-operator',
    approverId: 'production-approver',
    incidentOwnerId: 'incident-owner',
    recoveryOwnerId: 'recovery-owner',
    approvalId: 'production-approval-001',
    approvedAt: '2026-07-20T06:00:00.000Z',
    maintenanceWindow: {
      startsAt: '2026-07-20T07:00:00.000Z',
      endsAt: '2026-07-20T08:00:00.000Z',
      timezone: 'Asia/Kolkata',
    },
    abortConditions: [
      ...REQUIRED_PRODUCTION_ABORT_CONDITIONS,
    ],
    recoveryStrategy: 'BACKUP_RESTORE',
    explicitProductionApproval: true,
  };

  request.backupEvidenceSha256 =
    productionBackupEvidenceSha256(
      request.backupEvidence,
    );

  return request;
}

describe(
  'Phase 13D6 production rollout authorization',
  () => {
    it('builds deterministic authorization evidence without executing', () => {
      const first =
        buildProductionRolloutAuthorizationPlan(
          validRequest(),
        );
      const second =
        buildProductionRolloutAuthorizationPlan(
          validRequest(),
        );

      expect(first).toEqual(second);
      expect(first.status).toBe('AUTHORIZED');
      expect(first.authorizationValid).toBe(true);
      expect(first.runnerExposed).toBe(false);
      expect(first.executionStarted).toBe(false);
      expect(first.databaseMutated).toBe(false);
      expect(first.migrations).toHaveLength(13);
      expect(first.authorizationEvidenceSha256)
        .toMatch(/^[a-f0-9]{64}$/);
    });

    it('blocks absent explicit production approval', () => {
      const request = validRequest();
      request.explicitProductionApproval = false;

      const plan =
        buildProductionRolloutAuthorizationPlan(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.authorizationValid).toBe(false);
      expect(plan.authorizationEvidenceSha256)
        .toBeNull();
      expect(plan.errors).toContain(
        'Explicit production approval is required',
      );
    });

    it('blocks backup evidence changed after digest binding', () => {
      const request = validRequest();

      request.backupEvidence.dump.sizeBytes += 1;

      const plan =
        buildProductionRolloutAuthorizationPlan(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.authorizationValid).toBe(false);
      expect(plan.authorizationEvidenceSha256)
        .toBeNull();
      expect(plan.errors).toContain(
        'Backup evidence SHA-256 does not match its content',
      );
    });

    it('blocks operator and approver reuse', () => {
      const request = validRequest();
      request.approverId = request.operatorId;

      const plan =
        buildProductionRolloutAuthorizationPlan(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Production operator and approver must be different',
      );
    });

    it('blocks an altered production target', () => {
      const request = validRequest();
      request.targetDatabaseName =
        'unexpected-production-database';

      const plan =
        buildProductionRolloutAuthorizationPlan(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Backup evidence does not match the production target',
      );
    });

    it('blocks an invalid source baseline', () => {
      const request = validRequest();
      request.sourceBaseline.schemaMigrationCount =
        38;

      const plan =
        buildProductionRolloutAuthorizationPlan(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Production source baseline does not match 1|37|0',
      );
    });

    it('blocks altered migration ordering', () => {
      const request = validRequest();
      request.expectedPendingMigrations.reverse();

      const plan =
        buildProductionRolloutAuthorizationPlan(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Expected production migration range does not match',
      );
    });

    it('blocks missing abort conditions', () => {
      const request = validRequest();
      request.abortConditions = [];

      const plan =
        buildProductionRolloutAuthorizationPlan(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Missing production abort condition: ' +
          'MIGRATION_CHECKSUM_OR_ORDER_CHANGED',
      );
    });

    it('blocks an invalid maintenance window', () => {
      const request = validRequest();
      request.maintenanceWindow.endsAt =
        request.maintenanceWindow.startsAt;

      const plan =
        buildProductionRolloutAuthorizationPlan(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Maintenance window end must follow its start',
      );
    });

    it('blocks invalid commit-bound backup evidence', () => {
      const request = validRequest();
      request.backupEvidence.gitCommit =
        '0'.repeat(40);

      const plan =
        buildProductionRolloutAuthorizationPlan(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Commit-bound backup and restore evidence is invalid',
      );
    });

    it('fails closed for a non-production environment', () => {
      const request = validRequest();

      (
        request as {
          environmentClass: string;
        }
      ).environmentClass = 'STAGING';

      const plan =
        buildProductionRolloutAuthorizationPlan(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.runnerExposed).toBe(false);
      expect(plan.executionStarted).toBe(false);
      expect(plan.databaseMutated).toBe(false);
    });
  },
);
