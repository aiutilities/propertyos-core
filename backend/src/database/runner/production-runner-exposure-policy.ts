import { createHash } from 'crypto';
import {
  ProductionExecutionRequestSeal,
} from './production-rollout-execution-request';

export interface ProductionRunnerExposureRequest {
  executionRequestSeal:
    ProductionExecutionRequestSeal;
  explicitLiveInvocationAuthorization: boolean;
  liveAuthorizationId: string;
  liveAuthorizedAt: string;
  liveAuthorizationEvidenceSha256: string;
  operatorId: string;
  approverId: string;
  recoveryOwnerId: string;
  incidentOwnerId: string;
  evaluatedAt: string;
  maintenanceWindowStartsAt: string;
  maintenanceWindowEndsAt: string;
  operatorPresent: boolean;
  approverPresent: boolean;
  recoveryOwnerPresent: boolean;
  incidentOwnerPresent: boolean;
  targetDatabaseIdentityLocked: boolean;
  commitIdentityLocked: boolean;
  backupEvidenceReconfirmed: boolean;
  technicalPreflightReconfirmed: boolean;
}

export interface ProductionRunnerExposureDecision {
  status:
    | 'ELIGIBLE_FOR_SEPARATE_RUNNER_EXPOSURE'
    | 'BLOCKED';
  scope: 'PHASE_13D6_PRODUCTION_RUNNER_EXPOSURE';
  eligibilityConfirmed: boolean;
  runnerExposed: false;
  runnerInvocationAuthorized: false;
  invocationPerformed: false;
  databaseMutated: false;
  executionRequestSha256: string | null;
  liveAuthorizationId: string;
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

export function productionLiveAuthorizationEvidenceSha256(
  request: ProductionRunnerExposureRequest,
): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        approverId: request.approverId,
        candidateGitCommit:
          request.executionRequestSeal
            .candidateGitCommit,
        environmentId:
          request.executionRequestSeal.environmentId,
        executionRequestSha256:
          request.executionRequestSeal
            .executionRequestSha256,
        incidentOwnerId:
          request.incidentOwnerId,
        liveAuthorizationId:
          request.liveAuthorizationId,
        liveAuthorizedAt:
          request.liveAuthorizedAt,
        maintenanceWindowEndsAt:
          request.maintenanceWindowEndsAt,
        maintenanceWindowStartsAt:
          request.maintenanceWindowStartsAt,
        operatorId: request.operatorId,
        recoveryOwnerId:
          request.recoveryOwnerId,
        targetDatabaseName:
          request.executionRequestSeal
            .targetDatabaseName,
      }),
      'utf8',
    )
    .digest('hex');
}

export function evaluateProductionRunnerExposure(
  request: ProductionRunnerExposureRequest,
): ProductionRunnerExposureDecision {
  const errors: string[] = [];
  const seal = request.executionRequestSeal;

  if (
    seal.status !== 'SEALED_FOR_RUNNER_REVIEW' ||
    !seal.executionRequestSealed ||
    !seal.executionRequestSha256
  ) {
    errors.push(
      'A valid sealed execution request is required',
    );
  }

  if (
    seal.runnerExposed ||
    seal.runnerInvocationAuthorized ||
    seal.executionStarted ||
    seal.databaseMutated
  ) {
    errors.push(
      'Execution request seal must represent a non-executed state',
    );
  }

  if (
    !seal.executionRequestSha256 ||
    !SHA256_PATTERN.test(
      seal.executionRequestSha256,
    )
  ) {
    errors.push(
      'Execution request seal digest is invalid',
    );
  }

  if (!request.explicitLiveInvocationAuthorization) {
    errors.push(
      'Explicit live invocation authorization is required',
    );
  }

  for (const identifier of [
    request.liveAuthorizationId,
    request.operatorId,
    request.approverId,
    request.recoveryOwnerId,
    request.incidentOwnerId,
  ]) {
    if (!IDENTIFIER_PATTERN.test(identifier)) {
      errors.push(
        'Live authorization actor or identifier is invalid',
      );
      break;
    }
  }

  if (request.operatorId === request.approverId) {
    errors.push(
      'Live operator and approver must be different',
    );
  }

  if (
    !SHA256_PATTERN.test(
      request.liveAuthorizationEvidenceSha256,
    )
  ) {
    errors.push(
      'Live authorization evidence digest is invalid',
    );
  } else if (
    request.liveAuthorizationEvidenceSha256 !==
    productionLiveAuthorizationEvidenceSha256(
      request,
    )
  ) {
    errors.push(
      'Live authorization evidence does not match the sealed request',
    );
  }

  const liveAuthorizedAt =
    Date.parse(request.liveAuthorizedAt);
  const evaluatedAt =
    Date.parse(request.evaluatedAt);
  const windowStartsAt =
    Date.parse(
      request.maintenanceWindowStartsAt,
    );
  const windowEndsAt =
    Date.parse(
      request.maintenanceWindowEndsAt,
    );

  if (
    !validTimestamp(request.liveAuthorizedAt) ||
    !validTimestamp(request.evaluatedAt) ||
    !validTimestamp(
      request.maintenanceWindowStartsAt,
    ) ||
    !validTimestamp(
      request.maintenanceWindowEndsAt,
    )
  ) {
    errors.push(
      'Runner exposure time evidence is invalid',
    );
  } else {
    if (
      liveAuthorizedAt > evaluatedAt ||
      liveAuthorizedAt >= windowEndsAt
    ) {
      errors.push(
        'Live authorization timestamp is invalid for this evaluation',
      );
    }

    if (
      windowStartsAt >= windowEndsAt ||
      evaluatedAt < windowStartsAt ||
      evaluatedAt >= windowEndsAt
    ) {
      errors.push(
        'Runner exposure is outside the maintenance window',
      );
    }
  }

  if (
    !request.operatorPresent ||
    !request.approverPresent ||
    !request.recoveryOwnerPresent ||
    !request.incidentOwnerPresent
  ) {
    errors.push(
      'All approved production roles must be present',
    );
  }

  if (!request.targetDatabaseIdentityLocked) {
    errors.push(
      'Production database identity lock is required',
    );
  }

  if (!request.commitIdentityLocked) {
    errors.push(
      'Production commit identity lock is required',
    );
  }

  if (!request.backupEvidenceReconfirmed) {
    errors.push(
      'Commit-bound backup evidence must be reconfirmed',
    );
  }

  if (!request.technicalPreflightReconfirmed) {
    errors.push(
      'Technical preflight must be reconfirmed',
    );
  }

  const status =
    errors.length === 0
      ? 'ELIGIBLE_FOR_SEPARATE_RUNNER_EXPOSURE'
      : 'BLOCKED';

  return {
    status,
    scope:
      'PHASE_13D6_PRODUCTION_RUNNER_EXPOSURE',
    eligibilityConfirmed:
      status ===
      'ELIGIBLE_FOR_SEPARATE_RUNNER_EXPOSURE',
    runnerExposed: false,
    runnerInvocationAuthorized: false,
    invocationPerformed: false,
    databaseMutated: false,
    executionRequestSha256:
      seal.executionRequestSha256,
    liveAuthorizationId:
      request.liveAuthorizationId,
    errors,
  };
}
