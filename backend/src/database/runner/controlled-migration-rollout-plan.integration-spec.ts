import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  buildControlledRolloutPlan,
  ControlledRolloutRequest,
} from './controlled-migration-rollout-plan';
import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';

function validRequest():
  ControlledRolloutRequest {
  return {
    environmentClass: 'ISOLATED',
    sourceEnvironmentId:
      'propertyos-development',
    targetEnvironmentId:
      'propertyos-restore-exercise',
    sourceDatabaseName:
      'propertyos',
    targetDatabaseName:
      'propertyos_restore_exercise',
    gitCommit:
      '5af8e325d0fad3ea0e5a8c36d74e7ab688cdaaf4',
    operatorId:
      'migration-operator',
    approverId:
      'migration-approver',
    approvalId:
      'migration-approval-001',
    approvedAt:
      '2026-07-19T17:00:00.000Z',
    expectedPendingMigrations:
      CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
        (migration) => migration.name,
      ),
    technicalPreflightStatus: 'READY',
    backupEvidenceValidation: {
      status: 'VALID',
      applyAuthorized: false,
      errors: [],
    },
    explicitApplyApproval: true,
  };
}

describe('Phase 13D controlled rollout plan', () => {
  it('authorizes an explicitly approved isolated plan', () => {
    const plan =
      buildControlledRolloutPlan(
        validRequest(),
      );

    expect(plan.status).toBe('READY');
    expect(plan.executionAuthorized).toBe(true);
    expect(plan.productionAllowed).toBe(false);
    expect(plan.transactionStrategy).toBe(
      'ATOMIC_CONTROLLED_RANGE',
    );
    expect(plan.migrations).toHaveLength(12);
    expect(plan.evidenceSha256)
      .toMatch(/^[a-f0-9]{64}$/);
  });

  it('is deterministic for the same authorization', () => {
    const request = validRequest();

    const first =
      buildControlledRolloutPlan(request);
    const second =
      buildControlledRolloutPlan(request);

    expect(second).toEqual(first);
  });

  it('blocks when explicit apply approval is absent', () => {
    const request = validRequest();
    request.explicitApplyApproval = false;

    const plan =
      buildControlledRolloutPlan(request);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.executionAuthorized).toBe(false);
    expect(plan.evidenceSha256).toBeNull();
    expect(plan.errors).toContain(
      'Explicit migration apply approval is required',
    );
  });

  it('blocks same source and target database', () => {
    const request = validRequest();
    request.targetDatabaseName =
      request.sourceDatabaseName;

    const plan =
      buildControlledRolloutPlan(request);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.errors).toContain(
      'Source and target databases must be distinct',
    );
  });

  it('blocks operator and approver reuse', () => {
    const request = validRequest();
    request.approverId =
      request.operatorId;

    const plan =
      buildControlledRolloutPlan(request);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.errors).toContain(
      'Rollout operator and approver must be different',
    );
  });

  it('blocks invalid backup evidence', () => {
    const request = validRequest();
    request.backupEvidenceValidation = {
      status: 'INVALID',
      applyAuthorized: false,
      errors: ['dump invalid'],
    };

    const plan =
      buildControlledRolloutPlan(request);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.errors).toContain(
      'Backup and restore evidence is invalid',
    );
  });

  it('blocks altered migration ordering', () => {
    const request = validRequest();
    request.expectedPendingMigrations =
      [...request.expectedPendingMigrations]
        .reverse();

    const plan =
      buildControlledRolloutPlan(request);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.errors).toContain(
      'Expected pending migration range does not match',
    );
  });

  it('blocks production even through an unsafe cast', () => {
    const request = validRequest();

    (
      request as {
        environmentClass: string;
      }
    ).environmentClass = 'PRODUCTION';

    const plan =
      buildControlledRolloutPlan(request);

    expect(plan.status).toBe('BLOCKED');
    expect(plan.productionAllowed).toBe(false);
    expect(plan.errors).toContain(
      'Production migration execution is forbidden',
    );
  });
});
