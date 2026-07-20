import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  evaluateProductionRunnerExposure,
  productionLiveAuthorizationEvidenceSha256,
  ProductionRunnerExposureRequest,
} from './production-runner-exposure-policy';
import {
  ProductionExecutionRequestSeal,
} from './production-rollout-execution-request';

function validSeal():
  ProductionExecutionRequestSeal {
  return {
    status: 'SEALED_FOR_RUNNER_REVIEW',
    scope:
      'PHASE_13D6_PRODUCTION_EXECUTION_REQUEST',
    executionRequestSealed: true,
    runnerExposed: false,
    runnerInvocationAuthorized: false,
    executionStarted: false,
    databaseMutated: false,
    executionRequestId:
      'production-execution-request-001',
    candidateGitCommit:
      '6d91adec7af4cd641fa064e84671b2a86d374d5e',
    environmentId: 'propertyos-production',
    targetDatabaseName: 'propertyos',
    migrations: Array.from(
      { length: 12 },
      (_, index) => `migration-${index + 37}`,
    ),
    executionRequestSha256: 'a'.repeat(64),
    errors: [],
  };
}

function validRequest():
  ProductionRunnerExposureRequest {
  const request:
    ProductionRunnerExposureRequest = {
    executionRequestSeal: validSeal(),
    explicitLiveInvocationAuthorization: true,
    liveAuthorizationId:
      'live-authorization-001',
    liveAuthorizedAt:
      '2026-07-20T06:55:00.000Z',
    liveAuthorizationEvidenceSha256: '',
    operatorId: 'production-operator',
    approverId: 'production-approver',
    recoveryOwnerId: 'recovery-owner',
    incidentOwnerId: 'incident-owner',
    evaluatedAt: '2026-07-20T07:30:00.000Z',
    maintenanceWindowStartsAt:
      '2026-07-20T07:00:00.000Z',
    maintenanceWindowEndsAt:
      '2026-07-20T08:00:00.000Z',
    operatorPresent: true,
    approverPresent: true,
    recoveryOwnerPresent: true,
    incidentOwnerPresent: true,
    targetDatabaseIdentityLocked: true,
    commitIdentityLocked: true,
    backupEvidenceReconfirmed: true,
    technicalPreflightReconfirmed: true,
  };

  request.liveAuthorizationEvidenceSha256 =
    productionLiveAuthorizationEvidenceSha256(
      request,
    );

  return request;
}

describe(
  'Phase 13D6 production runner exposure policy',
  () => {
    it('confirms eligibility without exposing a runner', () => {
      const decision =
        evaluateProductionRunnerExposure(
          validRequest(),
        );

      expect(decision.status).toBe(
        'ELIGIBLE_FOR_SEPARATE_RUNNER_EXPOSURE',
      );
      expect(decision.eligibilityConfirmed)
        .toBe(true);
      expect(decision.runnerExposed).toBe(false);
      expect(decision.runnerInvocationAuthorized)
        .toBe(false);
      expect(decision.invocationPerformed)
        .toBe(false);
      expect(decision.databaseMutated).toBe(false);
    });

    it('blocks live evidence changed after sealing', () => {
      const request = validRequest();
      request.operatorId =
        'substituted-production-operator';

      const decision =
        evaluateProductionRunnerExposure(request);

      expect(decision.status).toBe('BLOCKED');
      expect(decision.errors).toContain(
        'Live authorization evidence does not match the sealed request',
      );
    });

    it('blocks operator and approver reuse', () => {
      const request = validRequest();
      request.approverId = request.operatorId;
      request.liveAuthorizationEvidenceSha256 =
        productionLiveAuthorizationEvidenceSha256(
          request,
        );

      const decision =
        evaluateProductionRunnerExposure(request);

      expect(decision.status).toBe('BLOCKED');
      expect(decision.errors).toContain(
        'Live operator and approver must be different',
      );
    });

    it('blocks absent live authorization', () => {
      const request = validRequest();
      request.explicitLiveInvocationAuthorization =
        false;

      const decision =
        evaluateProductionRunnerExposure(request);

      expect(decision.status).toBe('BLOCKED');
      expect(decision.errors).toContain(
        'Explicit live invocation authorization is required',
      );
    });

    it('blocks an invalid execution seal', () => {
      const request = validRequest();
      request.executionRequestSeal.status =
        'BLOCKED';
      request.executionRequestSeal
        .executionRequestSealed = false;

      const decision =
        evaluateProductionRunnerExposure(request);

      expect(decision.status).toBe('BLOCKED');
      expect(decision.errors).toContain(
        'A valid sealed execution request is required',
      );
    });

    it('blocks outside the maintenance window', () => {
      const request = validRequest();
      request.evaluatedAt =
        '2026-07-20T08:00:00.000Z';

      const decision =
        evaluateProductionRunnerExposure(request);

      expect(decision.status).toBe('BLOCKED');
      expect(decision.errors).toContain(
        'Runner exposure is outside the maintenance window',
      );
    });

    it('blocks absent recovery ownership', () => {
      const request = validRequest();
      request.recoveryOwnerPresent = false;

      const decision =
        evaluateProductionRunnerExposure(request);

      expect(decision.status).toBe('BLOCKED');
      expect(decision.errors).toContain(
        'All approved production roles must be present',
      );
    });

    it('blocks unlocked production identity', () => {
      const request = validRequest();
      request.targetDatabaseIdentityLocked =
        false;
      request.commitIdentityLocked = false;

      const decision =
        evaluateProductionRunnerExposure(request);

      expect(decision.status).toBe('BLOCKED');
      expect(decision.errors).toContain(
        'Production database identity lock is required',
      );
      expect(decision.errors).toContain(
        'Production commit identity lock is required',
      );
    });

    it('blocks stale backup or preflight evidence', () => {
      const request = validRequest();
      request.backupEvidenceReconfirmed = false;
      request.technicalPreflightReconfirmed =
        false;

      const decision =
        evaluateProductionRunnerExposure(request);

      expect(decision.status).toBe('BLOCKED');
      expect(decision.errors).toContain(
        'Commit-bound backup evidence must be reconfirmed',
      );
      expect(decision.errors).toContain(
        'Technical preflight must be reconfirmed',
      );
    });

    it('never grants invocation authority', () => {
      const decision =
        evaluateProductionRunnerExposure(
          validRequest(),
        );

      expect(decision.runnerInvocationAuthorized)
        .toBe(false);
      expect(decision.runnerExposed).toBe(false);
      expect(decision.databaseMutated).toBe(false);
    });
  },
);
