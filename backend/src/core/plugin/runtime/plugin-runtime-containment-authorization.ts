import { createHash } from 'crypto';
import {
  assessRuntimeContainment,
  RuntimeContainmentAction,
  RuntimeContainmentAssessment,
  RuntimeContainmentAssessmentInput,
} from './plugin-runtime-containment-policy';

export interface RuntimeContainmentAuthorizationRequest {
  assessmentInput:
    RuntimeContainmentAssessmentInput;
  submittedAssessment:
    RuntimeContainmentAssessment;
  incidentId: string;
  incidentEvidenceSha256: string;
  runtimeSnapshotSha256: string;
  requestedAction: RuntimeContainmentAction;
  requestedBy: string;
  approvedBy: string;
  containmentOperatorId: string;
  incidentOwnerId: string;
  recoveryOwnerId: string;
  approvalId: string;
  approvedAt: string;
  authorizationExpiresAt: string;
  justification: string;
  explicitContainmentApproval: boolean;
}

export interface RuntimeContainmentAuthorizationPlan {
  status:
    | 'AUTHORIZED_FOR_SEPARATE_CONTAINMENT_EXECUTION'
    | 'BLOCKED';
  scope:
    'PHASE_13E_RUNTIME_CONTAINMENT_AUTHORIZATION';
  pluginId: string;
  incidentId: string;
  requestedAction: RuntimeContainmentAction;
  containmentExecutionEligible: boolean;
  automaticContainmentAllowed: false;
  executorExposed: false;
  executionStarted: false;
  runtimeChanged: false;
  deactivationPerformed: false;
  isolationPerformed: false;
  assessmentSha256: string;
  authorizationEvidenceSha256: string | null;
  errors: string[];
}

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const MAX_CONTAINMENT_AUTHORIZATION_MS =
  4 * 60 * 60 * 1000;

function validTimestamp(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

export function runtimeContainmentAssessmentSha256(
  input: RuntimeContainmentAssessmentInput,
  assessment: RuntimeContainmentAssessment,
): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        input,
        assessment,
      }),
      'utf8',
    )
    .digest('hex');
}

export function buildRuntimeContainmentAuthorization(
  request: RuntimeContainmentAuthorizationRequest,
): RuntimeContainmentAuthorizationPlan {
  const errors: string[] = [];

  const recomputedAssessment =
    assessRuntimeContainment(
      request.assessmentInput,
    );

  const submittedAssessmentMatches =
    JSON.stringify(request.submittedAssessment) ===
    JSON.stringify(recomputedAssessment);

  if (!submittedAssessmentMatches) {
    errors.push(
      'Submitted containment assessment does not match recomputation',
    );
  }

  if (recomputedAssessment.status !== 'ASSESSED') {
    errors.push(
      'Containment assessment is blocked',
    );
  }

  if (
    !recomputedAssessment.containmentRecommended ||
    !recomputedAssessment.emergencyReviewRequired
  ) {
    errors.push(
      'Runtime containment is not recommended by policy',
    );
  }

  if (
    request.requestedAction !==
      recomputedAssessment.runtimeAction ||
    (
      request.requestedAction !==
        'DEACTIVATE_AFTER_EXPLICIT_APPROVAL' &&
      request.requestedAction !==
        'ISOLATE_AND_DEACTIVATE_AFTER_EXPLICIT_APPROVAL'
    )
  ) {
    errors.push(
      'Requested containment action is not authorized by policy',
    );
  }

  for (const identifier of [
    request.incidentId,
    request.requestedBy,
    request.approvedBy,
    request.containmentOperatorId,
    request.incidentOwnerId,
    request.recoveryOwnerId,
    request.approvalId,
  ]) {
    if (!IDENTIFIER_PATTERN.test(identifier)) {
      errors.push(
        'Containment actor, incident, or approval identifier is invalid',
      );
      break;
    }
  }

  if (
    request.requestedBy === request.approvedBy ||
    request.containmentOperatorId ===
      request.approvedBy
  ) {
    errors.push(
      'Containment approver must be separate from requester and operator',
    );
  }

  if (
    !SHA256_PATTERN.test(
      request.incidentEvidenceSha256,
    ) ||
    !SHA256_PATTERN.test(
      request.runtimeSnapshotSha256,
    )
  ) {
    errors.push(
      'Containment incident or runtime evidence digest is invalid',
    );
  }

  if (
    !validTimestamp(request.approvedAt) ||
    !validTimestamp(
      request.authorizationExpiresAt,
    )
  ) {
    errors.push(
      'Containment authorization timestamp is invalid',
    );
  } else {
    const approvedAt =
      Date.parse(request.approvedAt);
    const expiresAt =
      Date.parse(request.authorizationExpiresAt);
    const authorizationLifetime =
      expiresAt - approvedAt;

    if (authorizationLifetime <= 0) {
      errors.push(
        'Containment authorization expiry must follow approval',
      );
    } else if (
      authorizationLifetime >
      MAX_CONTAINMENT_AUTHORIZATION_MS
    ) {
      errors.push(
        'Containment authorization may not exceed four hours',
      );
    }
  }

  if (
    typeof request.justification !== 'string' ||
    request.justification.trim().length < 20 ||
    request.justification.trim().length > 2000
  ) {
    errors.push(
      'Containment justification must contain 20 to 2000 characters',
    );
  }

  if (!request.explicitContainmentApproval) {
    errors.push(
      'Explicit runtime containment approval is required',
    );
  }

  const assessmentSha256 =
    runtimeContainmentAssessmentSha256(
      request.assessmentInput,
      recomputedAssessment,
    );

  const status =
    errors.length === 0
      ? 'AUTHORIZED_FOR_SEPARATE_CONTAINMENT_EXECUTION'
      : 'BLOCKED';

  const authorizationEvidenceSha256 =
    status ===
      'AUTHORIZED_FOR_SEPARATE_CONTAINMENT_EXECUTION'
      ? createHash('sha256')
          .update(
            JSON.stringify({
              approvalId: request.approvalId,
              approvedAt: request.approvedAt,
              approvedBy: request.approvedBy,
              assessmentSha256,
              authorizationExpiresAt:
                request.authorizationExpiresAt,
              containmentOperatorId:
                request.containmentOperatorId,
              incidentEvidenceSha256:
                request.incidentEvidenceSha256,
              incidentId: request.incidentId,
              incidentOwnerId:
                request.incidentOwnerId,
              justification:
                request.justification.trim(),
              pluginId:
                recomputedAssessment.pluginId,
              recoveryOwnerId:
                request.recoveryOwnerId,
              requestedAction:
                request.requestedAction,
              requestedBy: request.requestedBy,
              runtimeSnapshotSha256:
                request.runtimeSnapshotSha256,
            }),
            'utf8',
          )
          .digest('hex')
      : null;

  return {
    status,
    scope:
      'PHASE_13E_RUNTIME_CONTAINMENT_AUTHORIZATION',
    pluginId: recomputedAssessment.pluginId,
    incidentId: request.incidentId,
    requestedAction: request.requestedAction,
    containmentExecutionEligible:
      status ===
      'AUTHORIZED_FOR_SEPARATE_CONTAINMENT_EXECUTION',
    automaticContainmentAllowed: false,
    executorExposed: false,
    executionStarted: false,
    runtimeChanged: false,
    deactivationPerformed: false,
    isolationPerformed: false,
    assessmentSha256,
    authorizationEvidenceSha256,
    errors,
  };
}
