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
  assessRuntimeContainment,
  RuntimeContainmentAssessmentInput,
} from './plugin-runtime-containment-policy';

function compromisedInput():
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

function validRequest():
  RuntimeContainmentAuthorizationRequest {
  const input = compromisedInput();
  const assessment =
    assessRuntimeContainment(input);

  return {
    assessmentInput: input,
    submittedAssessment: assessment,
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

describe(
  'Phase 13E runtime containment authorization',
  () => {
    it('builds deterministic authorization without execution', () => {
      const first =
        buildRuntimeContainmentAuthorization(
          validRequest(),
        );
      const second =
        buildRuntimeContainmentAuthorization(
          validRequest(),
        );

      expect(first).toEqual(second);
      expect(first.status).toBe(
        'AUTHORIZED_FOR_SEPARATE_CONTAINMENT_EXECUTION',
      );
      expect(first.containmentExecutionEligible)
        .toBe(true);
      expect(first.automaticContainmentAllowed)
        .toBe(false);
      expect(first.executorExposed).toBe(false);
      expect(first.executionStarted).toBe(false);
      expect(first.runtimeChanged).toBe(false);
      expect(first.authorizationEvidenceSha256)
        .toMatch(/^[a-f0-9]{64}$/);
    });

    it('blocks ordinary distribution revocation', () => {
      const request = validRequest();

      request.assessmentInput.artifactIntegrity =
        'VALID';
      request.assessmentInput.runtimeExploitEvidence =
        'NONE';
      request.submittedAssessment =
        assessRuntimeContainment(
          request.assessmentInput,
        );

      const plan =
        buildRuntimeContainmentAuthorization(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Runtime containment is not recommended by policy',
      );
      expect(plan.runtimeChanged).toBe(false);
    });

    it('blocks quarantine without compromise evidence', () => {
      const request = validRequest();

      request.assessmentInput.publicationStatus =
        'QUARANTINED';
      request.assessmentInput.signingKeyStatus =
        'ACTIVE';
      request.assessmentInput.artifactIntegrity =
        'VALID';
      request.assessmentInput.runtimeExploitEvidence =
        'NONE';
      request.submittedAssessment =
        assessRuntimeContainment(
          request.assessmentInput,
        );

      const plan =
        buildRuntimeContainmentAuthorization(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
    });

    it('blocks assessment tampering', () => {
      const request = validRequest();
      request.submittedAssessment.runtimeChanged =
        true as false;

      const plan =
        buildRuntimeContainmentAuthorization(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Submitted containment assessment does not match recomputation',
      );
    });

    it('blocks action substitution', () => {
      const request = validRequest();
      request.requestedAction =
        'KEEP_RUNNING_DISTRIBUTION_BLOCKED';

      const plan =
        buildRuntimeContainmentAuthorization(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Requested containment action is not authorized by policy',
      );
    });

    it('blocks absent explicit approval', () => {
      const request = validRequest();
      request.explicitContainmentApproval = false;

      const plan =
        buildRuntimeContainmentAuthorization(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Explicit runtime containment approval is required',
      );
    });

    it('blocks approver and operator reuse', () => {
      const request = validRequest();
      request.approvedBy =
        request.containmentOperatorId;

      const plan =
        buildRuntimeContainmentAuthorization(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Containment approver must be separate from requester and operator',
      );
    });

    it('blocks invalid incident evidence', () => {
      const request = validRequest();
      request.incidentEvidenceSha256 =
        'invalid';

      const plan =
        buildRuntimeContainmentAuthorization(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Containment incident or runtime evidence digest is invalid',
      );
    });

    it('blocks expired-at-approval authorization', () => {
      const request = validRequest();
      request.authorizationExpiresAt =
        request.approvedAt;

      const plan =
        buildRuntimeContainmentAuthorization(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Containment authorization expiry must follow approval',
      );
    });

    it('blocks authorization lasting more than four hours', () => {
      const request = validRequest();
      request.authorizationExpiresAt =
        '2026-07-20T13:00:00.001Z';

      const plan =
        buildRuntimeContainmentAuthorization(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Containment authorization may not exceed four hours',
      );
    });

    it('blocks inadequate justification', () => {
      const request = validRequest();
      request.justification = 'Too short';

      const plan =
        buildRuntimeContainmentAuthorization(
          request,
        );

      expect(plan.status).toBe('BLOCKED');
      expect(plan.errors).toContain(
        'Containment justification must contain 20 to 2000 characters',
      );
    });
  },
);
