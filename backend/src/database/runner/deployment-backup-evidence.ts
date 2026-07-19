import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';

export interface DeploymentBackupEvidence {
  schemaVersion: 1;
  environmentId: string;
  capturedAt: string;
  gitCommit: string;
  releaseTag: string;
  database: {
    name: string;
    serverMajorVersion: number;
    migrationCount: number;
    corePluginCount: number;
  };
  dump: {
    format: 'POSTGRES_CUSTOM';
    path: string;
    sha256: string;
    sizeBytes: number;
    restoreListVerified: boolean;
  };
  storage: {
    evidenceReference: string;
    verified: boolean;
  };
  controlledPendingMigrations: string[];
  isolatedRestore: {
    environmentId: string;
    completedAt: string;
    verified: boolean;
  };
}

export interface BackupEvidenceValidation {
  status: 'VALID' | 'INVALID';
  applyAuthorized: false;
  errors: string[];
}

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/;

function validTimestamp(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

export function validateDeploymentBackupEvidence(
  evidence: DeploymentBackupEvidence,
  expectedGitCommit: string,
): BackupEvidenceValidation {
  const errors: string[] = [];
  const expectedMigrations =
    CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
      (migration) => migration.name,
    );

  if (evidence.schemaVersion !== 1) {
    errors.push('Unsupported backup evidence schema version');
  }

  if (!evidence.environmentId.trim()) {
    errors.push('Environment identifier is required');
  }

  if (!validTimestamp(evidence.capturedAt)) {
    errors.push('Backup capture timestamp is invalid');
  }

  if (
    !COMMIT_PATTERN.test(evidence.gitCommit) ||
    evidence.gitCommit !== expectedGitCommit
  ) {
    errors.push('Backup Git commit does not match rollout commit');
  }

  if (!evidence.releaseTag.trim()) {
    errors.push('Release tag is required');
  }

  if (!evidence.database.name.trim()) {
    errors.push('Database name is required');
  }

  if (evidence.database.serverMajorVersion !== 16) {
    errors.push('Backup must originate from PostgreSQL 16');
  }

  if (
    !Number.isInteger(
      evidence.database.migrationCount,
    ) ||
    evidence.database.migrationCount < 0
  ) {
    errors.push('Migration count must be a non-negative integer');
  }

  if (
    !Number.isInteger(
      evidence.database.corePluginCount,
    ) ||
    evidence.database.corePluginCount < 0
  ) {
    errors.push('Core plugin count must be a non-negative integer');
  }

  if (evidence.dump.format !== 'POSTGRES_CUSTOM') {
    errors.push('A PostgreSQL custom-format dump is required');
  }

  if (!evidence.dump.path.trim()) {
    errors.push('Database dump path is required');
  }

  if (!SHA256_PATTERN.test(evidence.dump.sha256)) {
    errors.push('Database dump SHA-256 is invalid');
  }

  if (
    !Number.isInteger(evidence.dump.sizeBytes) ||
    evidence.dump.sizeBytes <= 0
  ) {
    errors.push('Database dump must be non-empty');
  }

  if (!evidence.dump.restoreListVerified) {
    errors.push('pg_restore list verification is required');
  }

  if (!evidence.storage.evidenceReference.trim()) {
    errors.push('Storage backup evidence reference is required');
  }

  if (!evidence.storage.verified) {
    errors.push('Storage backup evidence is not verified');
  }

  if (
    evidence.controlledPendingMigrations.length !==
      expectedMigrations.length ||
    evidence.controlledPendingMigrations.some(
      (name, index) =>
        name !== expectedMigrations[index],
    )
  ) {
    errors.push(
      'Controlled pending migration inventory does not match',
    );
  }

  if (
    !evidence.isolatedRestore.environmentId.trim()
  ) {
    errors.push(
      'Isolated restore environment identifier is required',
    );
  }

  if (
    evidence.isolatedRestore.environmentId ===
    evidence.environmentId
  ) {
    errors.push(
      'Restore exercise must use a different environment',
    );
  }

  if (
    !validTimestamp(
      evidence.isolatedRestore.completedAt,
    )
  ) {
    errors.push(
      'Isolated restore completion timestamp is invalid',
    );
  }

  if (!evidence.isolatedRestore.verified) {
    errors.push(
      'Successful isolated restore evidence is required',
    );
  }

  return {
    status:
      errors.length === 0 ? 'VALID' : 'INVALID',
    applyAuthorized: false,
    errors,
  };
}
