import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  buildRuntimeContainmentAuthorization,
  RuntimeContainmentAuthorizationRequest,
} from './plugin-runtime-containment-authorization';
import {
  RuntimeContainmentExecutionRequest,
  sealRuntimeContainmentExecutionRequest,
} from './plugin-runtime-containment-execution-request';
import {
  assessRuntimeContainment,
  RuntimeContainmentAssessmentInput,
} from './plugin-runtime-containment-policy';

function assessmentInput():
  RuntimeContainmentAssessmentInput {
  return {
    pluginId: 'propertyos.visitor',
    installed: true,
    active: true,
    installationProvenanceMatches: true,
    publicationStatus: 'REVOKED',
    publisherStatus: 'ACTIVE',
    signingKeyStatus: 'REVOKED',
    artifactIntegrity: 'MISMATCH',
    runtimeExploitEvidence: 'CONFIRMED',
    operationalCriticality: 'CRITICAL',
    automaticContainmentRequested: false,
  };
}

function authorizationRequest():
  RuntimeContainmentAuthorizationRequest {
  const input = assessmentInput();

  return {
    assessmentInput: input,
    submittedAssessment:
      assessRuntimeContainment(input),
    incidentId:
      'plugin-security-incident-001',
    incidentEvidenceSha256:
      'a'.repeat(64),
    runtimeSnapshotSha256:
      'b'.repeat(64),
    requestedAction:
      'ISOLATE_AND_DEACTIVATE_AFTER_EXPLICIT_APPROVAL',
    requestedBy: 'security-requester',
    approvedBy: 'security-approver',
    containmentOperatorId:
      'containment-operator',
    incidentOwnerId: 'incident-owner',
    recoveryOwnerId: 'recovery-owner',
    approvalId:
      'containment-approval-001',
    approvedAt:
      '2026-07-20T09:00:00.000Z',
    authorizationExpiresAt:
      '2026-07-20T10:00:00.000Z',
    justification:
      'Confirmed artifact mismatch and runtime exploit require coordinated containment.',
    explicitContainmentApproval: true,
  };
}

function validRequest():
  RuntimeContainmentExecutionRequest {
  const authorization =
    authorizationRequest();
  const plan =
    buildRuntimeContainmentAuthorization(
      authorization,
    );

  if (!plan.authorizationEvidenceSha256) {
    throw new Error(
      'Test containment authorization failed',
    );
  }

  return {
    schemaVersion: 1,
    executionRequestId:
      'containment-execution-request-001',
    requestedAt:
      '2026-07-20T09:15:00.000Z',
    requestedBy:
      authorization.containmentOperatorId,
    pluginId: plan.pluginId,
    incidentId: plan.incidentId,
    requestedAction: plan.requestedAction,
    authorizationEvidenceSha256:
      plan.authorizationEvidenceSha256,
    incidentEvidenceSha256:
      authorization.incidentEvidenceSha256,
    runtimeSnapshotSha256:
      authorization.runtimeSnapshotSha256,
    unrelatedPluginBaselineSha256:
      'c'.repeat(64),
    recoveryPlanEvidenceSha256:
      'd'.repeat(64),
    runtimeStateReconfirmed: true,
    authorizationRequest: authorization,
    authorizationPlan: plan,
  };
}

describe(
  'Phase 13E containment execution request',
  () => {
    it('seals deterministically without exposing an executor', () => {
      const first =
        sealRuntimeContainmentExecutionRequest(
          validRequest(),
        );
      const second =
        sealRuntimeContainmentExecutionRequest(
          validRequest(),
        );

      expect(first).toEqual(second);
      expect(first.status).toBe(
        'SEALED_FOR_CONTAINMENT_EXECUTOR_REVIEW',
      );
      expect(first.executionRequestSealed)
        .toBe(true);
      expect(first.executorExposed).toBe(false);
      expect(first.executorInvocationAuthorized)
        .toBe(false);
      expect(first.executionStarted).toBe(false);
      expect(first.runtimeChanged).toBe(false);
      expect(first.executionRequestSha256)
        .toMatch(/^[a-f0-9]{64}$/);
    });

    it('blocks authorization-plan tampering', () => {
      const request = validRequest();

      request.authorizationPlan
        .authorizationEvidenceSha256 =
          'f'.repeat(64);

      const seal =
        sealRuntimeContainmentExecutionRequest(
          request,
        );

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Submitted containment authorization plan does not match recomputation',
      );
    });

    it('blocks action substitution', () => {
      const request = validRequest();
      request.requestedAction =
        'KEEP_RUNNING_DISTRIBUTION_BLOCKED';

      const seal =
        sealRuntimeContainmentExecutionRequest(
          request,
        );

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Containment execution target does not match authorization',
      );
    });

    it('blocks operator substitution', () => {
      const request = validRequest();
      request.requestedBy =
        'unauthorized-operator';

      const seal =
        sealRuntimeContainmentExecutionRequest(
          request,
        );

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Containment execution requester is not the approved operator',
      );
    });

    it('blocks incident evidence drift', () => {
      const request = validRequest();
      request.incidentEvidenceSha256 =
        'e'.repeat(64);

      const seal =
        sealRuntimeContainmentExecutionRequest(
          request,
        );

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Containment incident or runtime evidence changed after authorization',
      );
    });

    it('blocks runtime snapshot drift', () => {
      const request = validRequest();
      request.runtimeSnapshotSha256 =
        'e'.repeat(64);

      const seal =
        sealRuntimeContainmentExecutionRequest(
          request,
        );

      expect(seal.status).toBe('BLOCKED');
    });

    it('blocks absent runtime reconfirmation', () => {
      const request = validRequest();
      request.runtimeStateReconfirmed = false;

      const seal =
        sealRuntimeContainmentExecutionRequest(
          request,
        );

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Runtime state must be reconfirmed before containment',
      );
    });

    it('blocks an expired execution request', () => {
      const request = validRequest();
      request.requestedAt =
        request.authorizationRequest
          .authorizationExpiresAt;

      const seal =
        sealRuntimeContainmentExecutionRequest(
          request,
        );

      expect(seal.status).toBe('BLOCKED');
      expect(seal.errors).toContain(
        'Containment execution request is outside its authorization window',
      );
    });

    it('never performs containment', () => {
      const seal =
        sealRuntimeContainmentExecutionRequest(
          validRequest(),
        );

      expect(seal.executorInvocationAuthorized)
        .toBe(false);
      expect(seal.runtimeChanged).toBe(false);
      expect(seal.deactivationPerformed)
        .toBe(false);
      expect(seal.isolationPerformed).toBe(false);
    });
  },
);
