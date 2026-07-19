import {
  createHash,
} from 'crypto';
import {
  BackupEvidenceValidation,
} from './deployment-backup-evidence';
import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';

export interface ControlledRolloutRequest {
  environmentClass: 'ISOLATED' | 'STAGING';
  sourceEnvironmentId: string;
  targetEnvironmentId: string;
  sourceDatabaseName: string;
  targetDatabaseName: string;
  gitCommit: string;
  operatorId: string;
  approverId: string;
  approvalId: string;
  approvedAt: string;
  expectedPendingMigrations: string[];
  technicalPreflightStatus: 'READY' | 'BLOCKED';
  backupEvidenceValidation:
    BackupEvidenceValidation;
  explicitApplyApproval: boolean;
}

export interface ControlledRolloutPlan {
  status: 'READY' | 'BLOCKED';
  scope: 'PHASE_13D_CONTROLLED_MIGRATION_EXECUTION';
  productionAllowed: false;
  executionAuthorized: boolean;
  transactionStrategy:
    'ATOMIC_CONTROLLED_RANGE';
  migrations: string[];
  evidenceSha256: string | null;
  errors: string[];
}

const COMMIT_PATTERN = /^[a-f0-9]{40}$/;
const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;

function sameOrderedValues(
  left: readonly string[],
  right: readonly string[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (value, index) =>
        value === right[index],
    )
  );
}

export function buildControlledRolloutPlan(
  request: ControlledRolloutRequest,
): ControlledRolloutPlan {
  const errors: string[] = [];
  const migrations =
    CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
      (migration) => migration.name,
    );

  if (
    request.environmentClass !== 'ISOLATED' &&
    request.environmentClass !== 'STAGING'
  ) {
    errors.push(
      'Production migration execution is forbidden',
    );
  }

  if (
    !request.sourceEnvironmentId.trim() ||
    !request.targetEnvironmentId.trim() ||
    request.sourceEnvironmentId ===
      request.targetEnvironmentId
  ) {
    errors.push(
      'Source and target environments must be distinct',
    );
  }

  if (
    !request.sourceDatabaseName.trim() ||
    !request.targetDatabaseName.trim() ||
    request.sourceDatabaseName ===
      request.targetDatabaseName
  ) {
    errors.push(
      'Source and target databases must be distinct',
    );
  }

  if (!COMMIT_PATTERN.test(request.gitCommit)) {
    errors.push(
      'Rollout Git commit is invalid',
    );
  }

  if (
    !IDENTIFIER_PATTERN.test(
      request.operatorId,
    ) ||
    !IDENTIFIER_PATTERN.test(
      request.approverId,
    ) ||
    !IDENTIFIER_PATTERN.test(
      request.approvalId,
    )
  ) {
    errors.push(
      'Rollout actor or approval identifier is invalid',
    );
  }

  if (
    request.operatorId ===
    request.approverId
  ) {
    errors.push(
      'Rollout operator and approver must be different',
    );
  }

  if (
    !Number.isFinite(
      Date.parse(request.approvedAt),
    )
  ) {
    errors.push(
      'Rollout approval timestamp is invalid',
    );
  }

  if (
    request.technicalPreflightStatus !==
    'READY'
  ) {
    errors.push(
      'Technical migration preflight is not ready',
    );
  }

  if (
    request.backupEvidenceValidation.status !==
    'VALID'
  ) {
    errors.push(
      'Backup and restore evidence is invalid',
    );
  }

  if (
    !sameOrderedValues(
      request.expectedPendingMigrations,
      migrations,
    )
  ) {
    errors.push(
      'Expected pending migration range does not match',
    );
  }

  if (!request.explicitApplyApproval) {
    errors.push(
      'Explicit migration apply approval is required',
    );
  }

  const status =
    errors.length === 0 ? 'READY' : 'BLOCKED';

  const evidenceSha256 =
    status === 'READY'
      ? createHash('sha256')
          .update(
            JSON.stringify({
              approvalId:
                request.approvalId,
              approvedAt:
                request.approvedAt,
              approverId:
                request.approverId,
              environmentClass:
                request.environmentClass,
              gitCommit:
                request.gitCommit,
              migrations,
              operatorId:
                request.operatorId,
              sourceDatabaseName:
                request.sourceDatabaseName,
              sourceEnvironmentId:
                request.sourceEnvironmentId,
              targetDatabaseName:
                request.targetDatabaseName,
              targetEnvironmentId:
                request.targetEnvironmentId,
              transactionStrategy:
                'ATOMIC_CONTROLLED_RANGE',
            }),
            'utf8',
          )
          .digest('hex')
      : null;

  return {
    status,
    scope:
      'PHASE_13D_CONTROLLED_MIGRATION_EXECUTION',
    productionAllowed: false,
    executionAuthorized:
      status === 'READY',
    transactionStrategy:
      'ATOMIC_CONTROLLED_RANGE',
    migrations,
    evidenceSha256,
    errors,
  };
}
