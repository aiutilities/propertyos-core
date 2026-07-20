export type ProductionRolloutPhase =
  | 'PRE_MUTATION'
  | 'MIGRATIONS_RUNNING'
  | 'MIGRATIONS_COMMITTED'
  | 'POST_DEPLOYMENT_ACCEPTANCE';

export type ProductionRecoveryAction =
  | 'ABORT_BEFORE_MUTATION'
  | 'CONTINUE_CONTROLLED_OBSERVATION'
  | 'RESTORE_COMMIT_BOUND_BACKUP'
  | 'HALT_AND_ESCALATE_RECOVERY'
  | 'ACCEPT_RELEASE';

export interface ProductionRecoverySnapshot {
  phase: ProductionRolloutPhase;
  authorizationValid: boolean;
  targetDatabaseIdentityConfirmed: boolean;
  backupReadableAndRestorable: boolean;
  migrationChecksumAndOrderValid: boolean;
  sourceBaselineUnchanged: boolean;
  privateSigningMaterialDetected: boolean;
  unexpectedPluginStateChange: boolean;
  migrationFailure: boolean;
  schemaAccepted: boolean;
  apiHealthy: boolean;
  postgresHealthy: boolean;
  pluginAcceptancePassed: boolean;
}

export interface ProductionRecoveryDecision {
  scope: 'PHASE_13D6_PRODUCTION_RECOVERY';
  action: ProductionRecoveryAction;
  executionAuthorizationGranted: false;
  databaseMutationPerformed: false;
  releaseAccepted: boolean;
  reasons: string[];
}

export interface ProductionAcceptanceSnapshot {
  authorizationEvidenceVerified: boolean;
  productionTargetReconfirmed: boolean;
  migrationRangeAppliedExactlyOnce: boolean;
  unexpectedMigrationsApplied: boolean;
  schemaAccepted: boolean;
  corePluginCountUnchanged: boolean;
  unrelatedPluginStateUnchanged: boolean;
  apiHealthy: boolean;
  postgresHealthy: boolean;
  publicationRegressionsPassed: boolean;
  trustedInstallationRegressionsPassed: boolean;
  privateSigningMaterialDetected: boolean;
  auditEvidenceCaptured: boolean;
  recoveryOwnerAcknowledged: boolean;
  operatorSignedOff: boolean;
  approverSignedOff: boolean;
}

export interface ProductionAcceptanceResult {
  status: 'ACCEPTED' | 'REJECTED';
  scope: 'PHASE_13D6_PRODUCTION_ACCEPTANCE';
  executionAuthorizationGranted: false;
  databaseMutationPerformed: false;
  failedChecks: string[];
}

function requiresRecovery(
  snapshot: ProductionRecoverySnapshot,
): string[] {
  const reasons: string[] = [];

  if (!snapshot.backupReadableAndRestorable) {
    reasons.push(
      'Commit-bound backup is unavailable or unreadable',
    );
  }

  if (!snapshot.migrationChecksumAndOrderValid) {
    reasons.push(
      'Migration checksum or order changed',
    );
  }

  if (!snapshot.sourceBaselineUnchanged) {
    reasons.push('Source baseline changed');
  }

  if (snapshot.privateSigningMaterialDetected) {
    reasons.push('Private signing material detected');
  }

  if (snapshot.unexpectedPluginStateChange) {
    reasons.push('Unexpected plugin state change detected');
  }

  if (snapshot.migrationFailure) {
    reasons.push('Controlled migration failed');
  }

  return reasons;
}

export function decideProductionRecoveryAction(
  snapshot: ProductionRecoverySnapshot,
): ProductionRecoveryDecision {
  const reasons: string[] = [];

  if (!snapshot.authorizationValid) {
    reasons.push(
      'Production authorization is absent or invalid',
    );
  }

  if (!snapshot.targetDatabaseIdentityConfirmed) {
    reasons.push(
      'Production target database identity is not confirmed',
    );
  }

  const safetyFailures = requiresRecovery(snapshot);
  reasons.push(...safetyFailures);

  if (reasons.length > 0) {
    const mutationMayHaveStarted =
      snapshot.phase !== 'PRE_MUTATION';

    let action: ProductionRecoveryAction;

    if (!mutationMayHaveStarted) {
      action = 'ABORT_BEFORE_MUTATION';
    } else if (!snapshot.backupReadableAndRestorable) {
      action = 'HALT_AND_ESCALATE_RECOVERY';
    } else {
      action = 'RESTORE_COMMIT_BOUND_BACKUP';
    }

    return {
      scope: 'PHASE_13D6_PRODUCTION_RECOVERY',
      action,
      executionAuthorizationGranted: false,
      databaseMutationPerformed: false,
      releaseAccepted: false,
      reasons,
    };
  }

  if (
    snapshot.phase ===
      'POST_DEPLOYMENT_ACCEPTANCE' &&
    snapshot.schemaAccepted &&
    snapshot.apiHealthy &&
    snapshot.postgresHealthy &&
    snapshot.pluginAcceptancePassed
  ) {
    return {
      scope: 'PHASE_13D6_PRODUCTION_RECOVERY',
      action: 'ACCEPT_RELEASE',
      executionAuthorizationGranted: false,
      databaseMutationPerformed: false,
      releaseAccepted: true,
      reasons: [],
    };
  }

  if (
    snapshot.phase ===
      'MIGRATIONS_COMMITTED' ||
    snapshot.phase ===
      'POST_DEPLOYMENT_ACCEPTANCE'
  ) {
    if (!snapshot.schemaAccepted) {
      reasons.push(
        'Post-migration schema acceptance has not passed',
      );
    }

    if (!snapshot.apiHealthy) {
      reasons.push('PropertyOS API is unhealthy');
    }

    if (!snapshot.postgresHealthy) {
      reasons.push('PostgreSQL is unhealthy');
    }

    if (!snapshot.pluginAcceptancePassed) {
      reasons.push(
        'Plugin acceptance has not passed',
      );
    }

    return {
      scope: 'PHASE_13D6_PRODUCTION_RECOVERY',
      action: 'RESTORE_COMMIT_BOUND_BACKUP',
      executionAuthorizationGranted: false,
      databaseMutationPerformed: false,
      releaseAccepted: false,
      reasons,
    };
  }

  return {
    scope: 'PHASE_13D6_PRODUCTION_RECOVERY',
    action: 'CONTINUE_CONTROLLED_OBSERVATION',
    executionAuthorizationGranted: false,
    databaseMutationPerformed: false,
    releaseAccepted: false,
    reasons: [],
  };
}

export function validateProductionAcceptance(
  snapshot: ProductionAcceptanceSnapshot,
): ProductionAcceptanceResult {
  const failedChecks: string[] = [];

  const requiredTrueChecks:
    Array<[boolean, string]> = [
      [
        snapshot.authorizationEvidenceVerified,
        'Production authorization evidence is not verified',
      ],
      [
        snapshot.productionTargetReconfirmed,
        'Production target was not reconfirmed',
      ],
      [
        snapshot.migrationRangeAppliedExactlyOnce,
        'Controlled migration range was not applied exactly once',
      ],
      [
        snapshot.schemaAccepted,
        'Schema acceptance failed',
      ],
      [
        snapshot.corePluginCountUnchanged,
        'Core plugin count changed unexpectedly',
      ],
      [
        snapshot.unrelatedPluginStateUnchanged,
        'Unrelated plugin state changed unexpectedly',
      ],
      [
        snapshot.apiHealthy,
        'PropertyOS API is unhealthy',
      ],
      [
        snapshot.postgresHealthy,
        'PostgreSQL is unhealthy',
      ],
      [
        snapshot.publicationRegressionsPassed,
        'Publication regressions failed',
      ],
      [
        snapshot.trustedInstallationRegressionsPassed,
        'Trusted installation regressions failed',
      ],
      [
        snapshot.auditEvidenceCaptured,
        'Production audit evidence is missing',
      ],
      [
        snapshot.recoveryOwnerAcknowledged,
        'Recovery owner acknowledgement is missing',
      ],
      [
        snapshot.operatorSignedOff,
        'Operator sign-off is missing',
      ],
      [
        snapshot.approverSignedOff,
        'Approver sign-off is missing',
      ],
    ];

  for (const [passed, error] of requiredTrueChecks) {
    if (!passed) {
      failedChecks.push(error);
    }
  }

  if (snapshot.unexpectedMigrationsApplied) {
    failedChecks.push(
      'Unexpected migrations were applied',
    );
  }

  if (snapshot.privateSigningMaterialDetected) {
    failedChecks.push(
      'Private signing material was detected',
    );
  }

  return {
    status:
      failedChecks.length === 0
        ? 'ACCEPTED'
        : 'REJECTED',
    scope: 'PHASE_13D6_PRODUCTION_ACCEPTANCE',
    executionAuthorizationGranted: false,
    databaseMutationPerformed: false,
    failedChecks,
  };
}
