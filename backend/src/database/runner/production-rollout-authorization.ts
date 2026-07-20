import { createHash } from 'crypto';
import {
  DeploymentBackupEvidence,
  validateDeploymentBackupEvidence,
} from './deployment-backup-evidence';
import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';

export const REQUIRED_PRODUCTION_ABORT_CONDITIONS = [
  'MIGRATION_CHECKSUM_OR_ORDER_CHANGED',
  'BACKUP_EVIDENCE_INVALID',
  'TARGET_DATABASE_IDENTITY_CHANGED',
  'SOURCE_BASELINE_CHANGED',
  'POSTGRESQL_UNHEALTHY',
  'API_UNHEALTHY',
  'SCHEMA_ACCEPTANCE_FAILED',
  'UNEXPECTED_PLUGIN_STATE_CHANGE',
  'PRIVATE_SIGNING_MATERIAL_DETECTED',
] as const;

export interface ProductionRolloutAuthorizationRequest {
  environmentClass: 'PRODUCTION';
  environmentId: string;
  targetDatabaseName: string;
  targetDatabaseIdentityConfirmed: boolean;
  gitCommit: string;
  releaseTag: string;
  readinessProofSha256: string;
  technicalPreflightStatus: 'READY' | 'BLOCKED';
  technicalPreflightEvidenceSha256: string;
  expectedPendingMigrations: string[];
  sourceBaseline: {
    schemaMigrationCount: number;
    corePluginCount: number;
    controlledMigrationCount: number;
    apiHealthy: boolean;
    postgresHealthy: boolean;
  };
  backupEvidence: DeploymentBackupEvidence;
  backupEvidenceSha256: string;
  operatorId: string;
  approverId: string;
  incidentOwnerId: string;
  recoveryOwnerId: string;
  approvalId: string;
  approvedAt: string;
  maintenanceWindow: {
    startsAt: string;
    endsAt: string;
    timezone: string;
  };
  abortConditions: string[];
  recoveryStrategy: 'BACKUP_RESTORE';
  explicitProductionApproval: boolean;
}

export interface ProductionRolloutAuthorizationPlan {
  status: 'AUTHORIZED' | 'BLOCKED';
  scope: 'PHASE_13D6_PRODUCTION_AUTHORIZATION';
  authorizationValid: boolean;
  runnerExposed: false;
  executionStarted: false;
  databaseMutated: false;
  approvalId: string;
  gitCommit: string;
  releaseTag: string;
  environmentId: string;
  targetDatabaseName: string;
  migrations: string[];
  authorizationEvidenceSha256: string | null;
  errors: string[];
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/;
const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;
const RELEASE_TAG_PATTERN =
  /^v[0-9]+\.[0-9]+\.[0-9]+[a-z0-9._-]*$/;

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

export function productionBackupEvidenceSha256(
  evidence: DeploymentBackupEvidence,
): string {
  return createHash('sha256')
    .update(JSON.stringify(evidence), 'utf8')
    .digest('hex');
}

export function buildProductionRolloutAuthorizationPlan(
  request: ProductionRolloutAuthorizationRequest,
): ProductionRolloutAuthorizationPlan {
  const errors: string[] = [];
  const migrations =
    CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
      (migration) => migration.name,
    );

  if (request.environmentClass !== 'PRODUCTION') {
    errors.push(
      'Production authorization requires a production environment',
    );
  }

  if (
    !IDENTIFIER_PATTERN.test(request.environmentId) ||
    !IDENTIFIER_PATTERN.test(request.targetDatabaseName)
  ) {
    errors.push(
      'Production environment or database identifier is invalid',
    );
  }

  if (!request.targetDatabaseIdentityConfirmed) {
    errors.push(
      'Production target database identity confirmation is required',
    );
  }

  if (!COMMIT_PATTERN.test(request.gitCommit)) {
    errors.push('Production Git commit is invalid');
  }

  if (!RELEASE_TAG_PATTERN.test(request.releaseTag)) {
    errors.push('Production release tag is invalid');
  }

  if (
    !SHA256_PATTERN.test(request.readinessProofSha256) ||
    !SHA256_PATTERN.test(
      request.technicalPreflightEvidenceSha256,
    ) ||
    !SHA256_PATTERN.test(request.backupEvidenceSha256)
  ) {
    errors.push(
      'Production authorization evidence digest is invalid',
    );
  }

  if (request.technicalPreflightStatus !== 'READY') {
    errors.push(
      'Technical production preflight is not ready',
    );
  }

  if (
    !sameOrderedValues(
      request.expectedPendingMigrations,
      migrations,
    )
  ) {
    errors.push(
      'Expected production migration range does not match',
    );
  }

  if (
    request.sourceBaseline.schemaMigrationCount !== 37 ||
    request.sourceBaseline.corePluginCount !== 1 ||
    request.sourceBaseline.controlledMigrationCount !== 0
  ) {
    errors.push(
      'Production source baseline does not match 1|37|0',
    );
  }

  if (
    !request.sourceBaseline.apiHealthy ||
    !request.sourceBaseline.postgresHealthy
  ) {
    errors.push(
      'Production source services must be healthy',
    );
  }

  const backupValidation =
    validateDeploymentBackupEvidence(
      request.backupEvidence,
      request.gitCommit,
    );

  if (backupValidation.status !== 'VALID') {
    errors.push(
      'Commit-bound backup and restore evidence is invalid',
    );
  }

  const calculatedBackupEvidenceSha256 =
    productionBackupEvidenceSha256(
      request.backupEvidence,
    );

  if (
    request.backupEvidenceSha256 !==
    calculatedBackupEvidenceSha256
  ) {
    errors.push(
      'Backup evidence SHA-256 does not match its content',
    );
  }

  if (
    request.backupEvidence.environmentId !==
      request.environmentId ||
    request.backupEvidence.database.name !==
      request.targetDatabaseName ||
    request.backupEvidence.releaseTag !==
      request.releaseTag
  ) {
    errors.push(
      'Backup evidence does not match the production target',
    );
  }

  for (const identifier of [
    request.operatorId,
    request.approverId,
    request.incidentOwnerId,
    request.recoveryOwnerId,
    request.approvalId,
  ]) {
    if (!IDENTIFIER_PATTERN.test(identifier)) {
      errors.push(
        'Production authorization actor or approval identifier is invalid',
      );
      break;
    }
  }

  if (request.operatorId === request.approverId) {
    errors.push(
      'Production operator and approver must be different',
    );
  }

  const approvedAt = Date.parse(request.approvedAt);
  const windowStartsAt =
    Date.parse(request.maintenanceWindow.startsAt);
  const windowEndsAt =
    Date.parse(request.maintenanceWindow.endsAt);

  if (
    !validTimestamp(request.approvedAt) ||
    !validTimestamp(request.maintenanceWindow.startsAt) ||
    !validTimestamp(request.maintenanceWindow.endsAt) ||
    !request.maintenanceWindow.timezone.trim()
  ) {
    errors.push(
      'Production approval or maintenance window is invalid',
    );
  } else {
    if (windowStartsAt >= windowEndsAt) {
      errors.push(
        'Maintenance window end must follow its start',
      );
    }

    if (approvedAt > windowStartsAt) {
      errors.push(
        'Production approval must precede the maintenance window',
      );
    }
  }

  const abortConditionSet =
    new Set(request.abortConditions);

  for (
    const condition of
    REQUIRED_PRODUCTION_ABORT_CONDITIONS
  ) {
    if (!abortConditionSet.has(condition)) {
      errors.push(
        `Missing production abort condition: ${condition}`,
      );
    }
  }

  if (request.recoveryStrategy !== 'BACKUP_RESTORE') {
    errors.push(
      'Backup restoration is the required recovery strategy',
    );
  }

  if (!request.explicitProductionApproval) {
    errors.push(
      'Explicit production approval is required',
    );
  }

  const status =
    errors.length === 0 ? 'AUTHORIZED' : 'BLOCKED';

  const authorizationEvidenceSha256 =
    status === 'AUTHORIZED'
      ? createHash('sha256')
          .update(
            JSON.stringify({
              abortConditions:
                [...request.abortConditions].sort(),
              approvalId: request.approvalId,
              approvedAt: request.approvedAt,
              approverId: request.approverId,
              backupEvidenceSha256:
                request.backupEvidenceSha256,
              environmentId: request.environmentId,
              gitCommit: request.gitCommit,
              incidentOwnerId:
                request.incidentOwnerId,
              maintenanceWindow:
                request.maintenanceWindow,
              migrations,
              operatorId: request.operatorId,
              readinessProofSha256:
                request.readinessProofSha256,
              recoveryOwnerId:
                request.recoveryOwnerId,
              recoveryStrategy:
                request.recoveryStrategy,
              releaseTag: request.releaseTag,
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
    scope: 'PHASE_13D6_PRODUCTION_AUTHORIZATION',
    authorizationValid: status === 'AUTHORIZED',
    runnerExposed: false,
    executionStarted: false,
    databaseMutated: false,
    approvalId: request.approvalId,
    gitCommit: request.gitCommit,
    releaseTag: request.releaseTag,
    environmentId: request.environmentId,
    targetDatabaseName: request.targetDatabaseName,
    migrations,
    authorizationEvidenceSha256,
    errors,
  };
}
