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
  ProductionExecutionRequest,
  sealProductionExecutionRequest,
} from './production-rollout-execution-request';
import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';

const COMMIT =
  '65b52f24f271c1808fb45d388ef2352ce62d0006';
const TAG =
  'v2.9.59-phase-13d6a-production-authorization';

function authorizationRequest():
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
    releaseTag: TAG,
    readinessProofSha256: 'a'.repeat(64),
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
      releaseTag: TAG,
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
    backupEvidenceSha256: '',
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

function validRequest(): ProductionExecutionRequest {
  const authorization = authorizationRequest();
  const plan =
    buildProductionRolloutAuthorizationPlan(
      authorization,
    );

  if (!plan.authorizationEvidenceSha256) {
    throw new Error(
      'Test authorization evidence was not generated',
    );
  }

  return {
    schemaVersion: 1,
    executionRequestId:
      'production-execution-request-001',
    requestedAt: '2026-07-20T06:30:00.000Z',
    expiresAt: '2026-07-20T08:00:00.000Z',
    requestedBy: authorization.operatorId,
    executionApproverId:
      authorization.approverId,
    executionApprovalId:
      'production-execution-approval-001',
    executionApprovedAt:
      '2026-07-20T06:45:00.000Z',
    executionApprovalEvidenceSha256:
      'e'.repeat(64),
    executionApprovalConfirmed: true,
    candidateGitCommit: authorization.gitCommit,
    candidateReleaseTag: authorization.releaseTag,
    environmentId: authorization.environmentId,
    targetDatabaseName:
      authorization.targetDatabaseName,
    targetDatabaseIdentityReconfirmed: true,
    authorizationEvidenceSha256:
      plan.authorizationEvidenceSha256,
    backupEvidenceSha256:
      authorization.backupEvidenceSha256,
    technicalPreflightEvidenceSha256:
      authorization
        .technicalPreflightEvidenceSha256,
    expectedPendingMigrations:
      [...authorization.expectedPendingMigrations],
    authorizationRequest: authorization,
    authorizationPlan: plan,
  };
}

describe(
  'Phase 13D6 production execution request',
  () => {
    it('seals a deterministic request without authorizing invocation', () => {
      const first =
        sealProductionExecutionRequest(
          validRequest(),
        );
      const second =
        sealProductionExecutionRequest(
          validRequest(),
        );

      expect(first).toEqual(second);
      expect(first.status).toBe(
        'SEALED_FOR_RUNNER_REVIEW',
      );
      expect(first.executionRequestSealed)
        .toBe(true);
      expect(first.runnerExposed).toBe(false);
      expect(first.runnerInvocationAuthorized)
        .toBe(false);
      expect(first.executionStarted).toBe(false);
      expect(first.databaseMutated).toBe(false);
      expect(first.executionRequestSha256)
        .toMatch(/^[a-f0-9]{64}$/);
    });

    it('blocks absent separate execution approval', () => {
      const request = validRequest();
      request.executionApprovalConfirmed = false;

      const seal =
        sealProductionExecutionRequest(request);

      expect(seal.status).toBe('BLOCKED');
      expect(seal.executionRequestSealed)
        .toBe(false);
      expect(seal.executionRequestSha256)
        .toBeNull();
    });

    it('blocks invalid separate approval evidence', () => {
      const request = validRequest();
      request.executionApprovalEvidenceSha256 =
        'invalid';

      const seal =
        sealProductionExecutionRequest(request);

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Separate execution approval evidence digest is invalid',
      );
    });

    it('blocks approval recorded before the request', () => {
      const request = validRequest();
      request.executionApprovedAt =
        '2026-07-20T06:15:00.000Z';

      const seal =
        sealProductionExecutionRequest(request);

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Separate execution approval must follow the request and precede the window',
      );
    });

    it('blocks authorization-plan tampering', () => {
      const request = validRequest();
      request.authorizationPlan
        .authorizationEvidenceSha256 =
          'f'.repeat(64);

      const seal =
        sealProductionExecutionRequest(request);

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Submitted production authorization plan does not match recomputation',
      );
    });

    it('blocks backup-evidence drift', () => {
      const request = validRequest();
      request.backupEvidenceSha256 =
        'f'.repeat(64);

      const seal =
        sealProductionExecutionRequest(request);

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Execution request backup digest does not match authorization',
      );
    });

    it('blocks candidate commit drift', () => {
      const request = validRequest();
      request.candidateGitCommit =
        '0'.repeat(40);

      const seal =
        sealProductionExecutionRequest(request);

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Execution candidate does not match authorization',
      );
    });

    it('blocks target identity drift', () => {
      const request = validRequest();
      request.targetDatabaseName =
        'unexpected-production-database';

      const seal =
        sealProductionExecutionRequest(request);

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Execution target does not match authorization',
      );
    });

    it('blocks actor substitution', () => {
      const request = validRequest();
      request.requestedBy =
        'different-production-operator';

      const seal =
        sealProductionExecutionRequest(request);

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Execution request actors do not match the approved separation',
      );
    });

    it('blocks altered migration ordering', () => {
      const request = validRequest();
      request.expectedPendingMigrations.reverse();

      const seal =
        sealProductionExecutionRequest(request);

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Execution request migration range does not match',
      );
    });

    it('blocks a request outside the approved window binding', () => {
      const request = validRequest();
      request.expiresAt =
        '2026-07-20T09:00:00.000Z';

      const seal =
        sealProductionExecutionRequest(request);

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Execution request expiry must equal the maintenance-window end',
      );
    });

    it('always keeps runner invocation unauthorized', () => {
      const request = validRequest();

      const seal =
        sealProductionExecutionRequest(request);

      expect(seal.runnerInvocationAuthorized)
        .toBe(false);
      expect(seal.databaseMutated).toBe(false);
    });
  },
);
