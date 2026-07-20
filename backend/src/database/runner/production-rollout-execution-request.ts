import { createHash } from 'crypto';
import {
  buildProductionRolloutAuthorizationPlan,
  ProductionRolloutAuthorizationPlan,
  ProductionRolloutAuthorizationRequest,
} from './production-rollout-authorization';
import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';

export interface ProductionExecutionRequest {
  schemaVersion: 1;
  executionRequestId: string;
  requestedAt: string;
  expiresAt: string;
  requestedBy: string;
  executionApproverId: string;
  executionApprovalId: string;
  executionApprovedAt: string;
  executionApprovalEvidenceSha256: string;
  executionApprovalConfirmed: boolean;
  candidateGitCommit: string;
  candidateReleaseTag: string;
  environmentId: string;
  targetDatabaseName: string;
  targetDatabaseIdentityReconfirmed: boolean;
  authorizationEvidenceSha256: string;
  backupEvidenceSha256: string;
  technicalPreflightEvidenceSha256: string;
  expectedPendingMigrations: string[];
  authorizationRequest:
    ProductionRolloutAuthorizationRequest;
  authorizationPlan:
    ProductionRolloutAuthorizationPlan;
}

export interface ProductionExecutionRequestSeal {
  status: 'SEALED_FOR_RUNNER_REVIEW' | 'BLOCKED';
  scope: 'PHASE_13D6_PRODUCTION_EXECUTION_REQUEST';
  executionRequestSealed: boolean;
  runnerExposed: false;
  runnerInvocationAuthorized: false;
  executionStarted: false;
  databaseMutated: false;
  executionRequestId: string;
  candidateGitCommit: string;
  environmentId: string;
  targetDatabaseName: string;
  migrations: string[];
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

function sameOrderedValues(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (value, index) => value === right[index],
    )
  );
}

export function sealProductionExecutionRequest(
  request: ProductionExecutionRequest,
): ProductionExecutionRequestSeal {
  const errors: string[] = [];
  const migrations =
    CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
      (migration) => migration.name,
    );

  if (request.schemaVersion !== 1) {
    errors.push(
      'Unsupported production execution request schema version',
    );
  }

  for (const identifier of [
    request.executionRequestId,
    request.requestedBy,
    request.executionApproverId,
    request.executionApprovalId,
    request.environmentId,
    request.targetDatabaseName,
  ]) {
    if (!IDENTIFIER_PATTERN.test(identifier)) {
      errors.push(
        'Execution request identifier is invalid',
      );
      break;
    }
  }

  const recomputedAuthorization =
    buildProductionRolloutAuthorizationPlan(
      request.authorizationRequest,
    );

  if (
    recomputedAuthorization.status !== 'AUTHORIZED' ||
    !recomputedAuthorization.authorizationValid ||
    !recomputedAuthorization.authorizationEvidenceSha256
  ) {
    errors.push(
      'Underlying production authorization is invalid',
    );
  }

  if (
    request.authorizationPlan.status !==
      recomputedAuthorization.status ||
    request.authorizationPlan.authorizationValid !==
      recomputedAuthorization.authorizationValid ||
    request.authorizationPlan.authorizationEvidenceSha256 !==
      recomputedAuthorization.authorizationEvidenceSha256
  ) {
    errors.push(
      'Submitted production authorization plan does not match recomputation',
    );
  }

  if (
    request.authorizationPlan.runnerExposed ||
    request.authorizationPlan.executionStarted ||
    request.authorizationPlan.databaseMutated
  ) {
    errors.push(
      'Execution request requires a non-executed authorization plan',
    );
  }

  if (
    request.authorizationEvidenceSha256 !==
      recomputedAuthorization.authorizationEvidenceSha256 ||
    !SHA256_PATTERN.test(
      request.authorizationEvidenceSha256,
    )
  ) {
    errors.push(
      'Authorization evidence digest does not match',
    );
  }

  if (
    request.backupEvidenceSha256 !==
      request.authorizationRequest.backupEvidenceSha256 ||
    !SHA256_PATTERN.test(request.backupEvidenceSha256)
  ) {
    errors.push(
      'Execution request backup digest does not match authorization',
    );
  }

  if (
    request.technicalPreflightEvidenceSha256 !==
      request.authorizationRequest
        .technicalPreflightEvidenceSha256 ||
    !SHA256_PATTERN.test(
      request.technicalPreflightEvidenceSha256,
    )
  ) {
    errors.push(
      'Execution request preflight digest does not match authorization',
    );
  }

  if (
    request.candidateGitCommit !==
      recomputedAuthorization.gitCommit ||
    request.candidateReleaseTag !==
      recomputedAuthorization.releaseTag
  ) {
    errors.push(
      'Execution candidate does not match authorization',
    );
  }

  if (
    request.environmentId !==
      recomputedAuthorization.environmentId ||
    request.targetDatabaseName !==
      recomputedAuthorization.targetDatabaseName
  ) {
    errors.push(
      'Execution target does not match authorization',
    );
  }

  if (!request.targetDatabaseIdentityReconfirmed) {
    errors.push(
      'Execution target database identity must be reconfirmed',
    );
  }

  if (
    request.requestedBy !==
      request.authorizationRequest.operatorId ||
    request.executionApproverId !==
      request.authorizationRequest.approverId ||
    request.requestedBy === request.executionApproverId
  ) {
    errors.push(
      'Execution request actors do not match the approved separation',
    );
  }

  if (
    !SHA256_PATTERN.test(
      request.executionApprovalEvidenceSha256,
    )
  ) {
    errors.push(
      'Separate execution approval evidence digest is invalid',
    );
  }

  if (!request.executionApprovalConfirmed) {
    errors.push(
      'Separate execution approval confirmation is required',
    );
  }

  if (
    !sameOrderedValues(
      request.expectedPendingMigrations,
      migrations,
    )
  ) {
    errors.push(
      'Execution request migration range does not match',
    );
  }

  const requestedAt = Date.parse(request.requestedAt);
  const executionApprovedAt = Date.parse(
    request.executionApprovedAt,
  );
  const expiresAt = Date.parse(request.expiresAt);
  const approvedAt = Date.parse(
    request.authorizationRequest.approvedAt,
  );
  const windowStartsAt = Date.parse(
    request.authorizationRequest
      .maintenanceWindow.startsAt,
  );
  const windowEndsAt = Date.parse(
    request.authorizationRequest
      .maintenanceWindow.endsAt,
  );

  if (
    !validTimestamp(request.requestedAt) ||
    !validTimestamp(request.executionApprovedAt) ||
    !validTimestamp(request.expiresAt)
  ) {
    errors.push(
      'Execution request timestamps are invalid',
    );
  } else {
    if (
      requestedAt < approvedAt ||
      requestedAt > windowStartsAt
    ) {
      errors.push(
        'Execution request must be sealed after approval and before the window',
      );
    }

    if (
      executionApprovedAt < requestedAt ||
      executionApprovedAt > windowStartsAt
    ) {
      errors.push(
        'Separate execution approval must follow the request and precede the window',
      );
    }

    if (
      expiresAt !== windowEndsAt ||
      expiresAt <= executionApprovedAt
    ) {
      errors.push(
        'Execution request expiry must equal the maintenance-window end',
      );
    }
  }

  const status =
    errors.length === 0
      ? 'SEALED_FOR_RUNNER_REVIEW'
      : 'BLOCKED';

  const executionRequestSha256 =
    status === 'SEALED_FOR_RUNNER_REVIEW'
      ? createHash('sha256')
          .update(
            JSON.stringify({
              authorizationEvidenceSha256:
                request.authorizationEvidenceSha256,
              backupEvidenceSha256:
                request.backupEvidenceSha256,
              candidateGitCommit:
                request.candidateGitCommit,
              candidateReleaseTag:
                request.candidateReleaseTag,
              environmentId: request.environmentId,
              executionApprovalEvidenceSha256:
                request.executionApprovalEvidenceSha256,
              executionApprovalId:
                request.executionApprovalId,
              executionApprovedAt:
                request.executionApprovedAt,
              executionApproverId:
                request.executionApproverId,
              executionRequestId:
                request.executionRequestId,
              expectedPendingMigrations:
                request.expectedPendingMigrations,
              expiresAt: request.expiresAt,
              requestedAt: request.requestedAt,
              requestedBy: request.requestedBy,
              targetDatabaseName:
                request.targetDatabaseName,
              technicalPreflightEvidenceSha256:
                request.technicalPreflightEvidenceSha256,
            }),
            'utf8',
          )
          .digest('hex')
      : null;

  return {
    status,
    scope:
      'PHASE_13D6_PRODUCTION_EXECUTION_REQUEST',
    executionRequestSealed:
      status === 'SEALED_FOR_RUNNER_REVIEW',
    runnerExposed: false,
    runnerInvocationAuthorized: false,
    executionStarted: false,
    databaseMutated: false,
    executionRequestId:
      request.executionRequestId,
    candidateGitCommit:
      request.candidateGitCommit,
    environmentId: request.environmentId,
    targetDatabaseName:
      request.targetDatabaseName,
    migrations,
    executionRequestSha256,
    errors,
  };
}
