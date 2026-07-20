import { createHash } from 'crypto';
import {
  buildRuntimeContainmentAuthorization,
  RuntimeContainmentAuthorizationPlan,
  RuntimeContainmentAuthorizationRequest,
} from './plugin-runtime-containment-authorization';
import {
  RuntimeContainmentAction,
} from './plugin-runtime-containment-policy';

export interface RuntimeContainmentExecutionRequest {
  schemaVersion: 1;
  executionRequestId: string;
  requestedAt: string;
  requestedBy: string;
  pluginId: string;
  incidentId: string;
  requestedAction: RuntimeContainmentAction;
  authorizationEvidenceSha256: string;
  incidentEvidenceSha256: string;
  runtimeSnapshotSha256: string;
  unrelatedPluginBaselineSha256: string;
  recoveryPlanEvidenceSha256: string;
  runtimeStateReconfirmed: boolean;
  authorizationRequest:
    RuntimeContainmentAuthorizationRequest;
  authorizationPlan:
    RuntimeContainmentAuthorizationPlan;
}

export interface RuntimeContainmentExecutionRequestSeal {
  status:
    | 'SEALED_FOR_CONTAINMENT_EXECUTOR_REVIEW'
    | 'BLOCKED';
  scope:
    'PHASE_13E_RUNTIME_CONTAINMENT_EXECUTION_REQUEST';
  executionRequestSealed: boolean;
  executorExposed: false;
  executorInvocationAuthorized: false;
  executionStarted: false;
  runtimeChanged: false;
  deactivationPerformed: false;
  isolationPerformed: false;
  executionRequestId: string;
  pluginId: string;
  incidentId: string;
  requestedAction: RuntimeContainmentAction;
  authorizationEvidenceSha256: string;
  executionRequestSha256: string | null;
  errors: string[];
}

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function validTimestamp(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

export function sealRuntimeContainmentExecutionRequest(
  request: RuntimeContainmentExecutionRequest,
): RuntimeContainmentExecutionRequestSeal {
  const errors: string[] = [];

  if (request.schemaVersion !== 1) {
    errors.push(
      'Unsupported containment execution request schema version',
    );
  }

  for (const identifier of [
    request.executionRequestId,
    request.requestedBy,
    request.pluginId,
    request.incidentId,
  ]) {
    if (!IDENTIFIER_PATTERN.test(identifier)) {
      errors.push(
        'Containment execution request identifier is invalid',
      );
      break;
    }
  }

  const recomputedAuthorization =
    buildRuntimeContainmentAuthorization(
      request.authorizationRequest,
    );

  if (
    recomputedAuthorization.status !==
      'AUTHORIZED_FOR_SEPARATE_CONTAINMENT_EXECUTION' ||
    !recomputedAuthorization
      .containmentExecutionEligible ||
    !recomputedAuthorization
      .authorizationEvidenceSha256
  ) {
    errors.push(
      'Underlying containment authorization is invalid',
    );
  }

  if (
    request.authorizationPlan.status !==
      recomputedAuthorization.status ||
    request.authorizationPlan
      .containmentExecutionEligible !==
      recomputedAuthorization
        .containmentExecutionEligible ||
    request.authorizationPlan
      .authorizationEvidenceSha256 !==
      recomputedAuthorization
        .authorizationEvidenceSha256
  ) {
    errors.push(
      'Submitted containment authorization plan does not match recomputation',
    );
  }

  if (
    request.authorizationPlan.executorExposed ||
    request.authorizationPlan.executionStarted ||
    request.authorizationPlan.runtimeChanged ||
    request.authorizationPlan.deactivationPerformed ||
    request.authorizationPlan.isolationPerformed
  ) {
    errors.push(
      'Containment authorization must represent a non-executed state',
    );
  }

  if (
    request.authorizationEvidenceSha256 !==
      recomputedAuthorization
        .authorizationEvidenceSha256 ||
    !SHA256_PATTERN.test(
      request.authorizationEvidenceSha256,
    )
  ) {
    errors.push(
      'Containment authorization evidence digest does not match',
    );
  }

  if (
    request.pluginId !==
      recomputedAuthorization.pluginId ||
    request.incidentId !==
      recomputedAuthorization.incidentId ||
    request.requestedAction !==
      recomputedAuthorization.requestedAction
  ) {
    errors.push(
      'Containment execution target does not match authorization',
    );
  }

  if (
    request.requestedBy !==
    request.authorizationRequest
      .containmentOperatorId
  ) {
    errors.push(
      'Containment execution requester is not the approved operator',
    );
  }

  if (
    request.incidentEvidenceSha256 !==
      request.authorizationRequest
        .incidentEvidenceSha256 ||
    request.runtimeSnapshotSha256 !==
      request.authorizationRequest
        .runtimeSnapshotSha256
  ) {
    errors.push(
      'Containment incident or runtime evidence changed after authorization',
    );
  }

  for (const digest of [
    request.incidentEvidenceSha256,
    request.runtimeSnapshotSha256,
    request.unrelatedPluginBaselineSha256,
    request.recoveryPlanEvidenceSha256,
  ]) {
    if (!SHA256_PATTERN.test(digest)) {
      errors.push(
        'Containment execution evidence digest is invalid',
      );
      break;
    }
  }

  if (!request.runtimeStateReconfirmed) {
    errors.push(
      'Runtime state must be reconfirmed before containment',
    );
  }

  if (!validTimestamp(request.requestedAt)) {
    errors.push(
      'Containment execution request timestamp is invalid',
    );
  } else {
    const requestedAt =
      Date.parse(request.requestedAt);
    const approvedAt =
      Date.parse(
        request.authorizationRequest.approvedAt,
      );
    const expiresAt =
      Date.parse(
        request.authorizationRequest
          .authorizationExpiresAt,
      );

    if (
      requestedAt < approvedAt ||
      requestedAt >= expiresAt
    ) {
      errors.push(
        'Containment execution request is outside its authorization window',
      );
    }
  }

  const status =
    errors.length === 0
      ? 'SEALED_FOR_CONTAINMENT_EXECUTOR_REVIEW'
      : 'BLOCKED';

  const executionRequestSha256 =
    status ===
      'SEALED_FOR_CONTAINMENT_EXECUTOR_REVIEW'
      ? createHash('sha256')
          .update(
            JSON.stringify({
              authorizationEvidenceSha256:
                request.authorizationEvidenceSha256,
              executionRequestId:
                request.executionRequestId,
              incidentEvidenceSha256:
                request.incidentEvidenceSha256,
              incidentId: request.incidentId,
              pluginId: request.pluginId,
              recoveryPlanEvidenceSha256:
                request.recoveryPlanEvidenceSha256,
              requestedAction:
                request.requestedAction,
              requestedAt: request.requestedAt,
              requestedBy: request.requestedBy,
              runtimeSnapshotSha256:
                request.runtimeSnapshotSha256,
              unrelatedPluginBaselineSha256:
                request.unrelatedPluginBaselineSha256,
            }),
            'utf8',
          )
          .digest('hex')
      : null;

  return {
    status,
    scope:
      'PHASE_13E_RUNTIME_CONTAINMENT_EXECUTION_REQUEST',
    executionRequestSealed:
      status ===
      'SEALED_FOR_CONTAINMENT_EXECUTOR_REVIEW',
    executorExposed: false,
    executorInvocationAuthorized: false,
    executionStarted: false,
    runtimeChanged: false,
    deactivationPerformed: false,
    isolationPerformed: false,
    executionRequestId:
      request.executionRequestId,
    pluginId: request.pluginId,
    incidentId: request.incidentId,
    requestedAction: request.requestedAction,
    authorizationEvidenceSha256:
      request.authorizationEvidenceSha256,
    executionRequestSha256,
    errors,
  };
}
