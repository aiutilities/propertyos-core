import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  decideProductionRecoveryAction,
  ProductionAcceptanceSnapshot,
  ProductionRecoverySnapshot,
  validateProductionAcceptance,
} from './production-operational-runbook';

function safeRecoverySnapshot():
  ProductionRecoverySnapshot {
  return {
    phase: 'PRE_MUTATION',
    authorizationValid: true,
    targetDatabaseIdentityConfirmed: true,
    backupReadableAndRestorable: true,
    migrationChecksumAndOrderValid: true,
    sourceBaselineUnchanged: true,
    privateSigningMaterialDetected: false,
    unexpectedPluginStateChange: false,
    migrationFailure: false,
    schemaAccepted: false,
    apiHealthy: true,
    postgresHealthy: true,
    pluginAcceptancePassed: false,
  };
}

function acceptedSnapshot():
  ProductionAcceptanceSnapshot {
  return {
    authorizationEvidenceVerified: true,
    productionTargetReconfirmed: true,
    migrationRangeAppliedExactlyOnce: true,
    unexpectedMigrationsApplied: false,
    schemaAccepted: true,
    corePluginCountUnchanged: true,
    unrelatedPluginStateUnchanged: true,
    apiHealthy: true,
    postgresHealthy: true,
    publicationRegressionsPassed: true,
    trustedInstallationRegressionsPassed: true,
    privateSigningMaterialDetected: false,
    auditEvidenceCaptured: true,
    recoveryOwnerAcknowledged: true,
    operatorSignedOff: true,
    approverSignedOff: true,
  };
}

describe(
  'Phase 13D6 production operational runbook',
  () => {
    it('aborts before mutation when authorization is invalid', () => {
      const snapshot = safeRecoverySnapshot();
      snapshot.authorizationValid = false;

      const decision =
        decideProductionRecoveryAction(snapshot);

      expect(decision.action).toBe(
        'ABORT_BEFORE_MUTATION',
      );
      expect(decision.releaseAccepted).toBe(false);
      expect(decision.executionAuthorizationGranted)
        .toBe(false);
      expect(decision.databaseMutationPerformed)
        .toBe(false);
    });

    it('aborts before mutation when target identity changed', () => {
      const snapshot = safeRecoverySnapshot();
      snapshot.targetDatabaseIdentityConfirmed =
        false;

      const decision =
        decideProductionRecoveryAction(snapshot);

      expect(decision.action).toBe(
        'ABORT_BEFORE_MUTATION',
      );
    });

    it('escalates when mutation started and backup is unreadable', () => {
      const snapshot = safeRecoverySnapshot();
      snapshot.phase = 'MIGRATIONS_RUNNING';
      snapshot.backupReadableAndRestorable =
        false;

      const decision =
        decideProductionRecoveryAction(snapshot);

      expect(decision.action).toBe(
        'HALT_AND_ESCALATE_RECOVERY',
      );
      expect(decision.releaseAccepted).toBe(false);
      expect(decision.executionAuthorizationGranted)
        .toBe(false);
      expect(decision.reasons).toContain(
        'Commit-bound backup is unavailable or unreadable',
      );
    });

    it('requires restoration after a migration failure', () => {
      const snapshot = safeRecoverySnapshot();
      snapshot.phase = 'MIGRATIONS_RUNNING';
      snapshot.migrationFailure = true;

      const decision =
        decideProductionRecoveryAction(snapshot);

      expect(decision.action).toBe(
        'RESTORE_COMMIT_BOUND_BACKUP',
      );
      expect(decision.reasons).toContain(
        'Controlled migration failed',
      );
    });

    it('requires restoration after schema rejection', () => {
      const snapshot = safeRecoverySnapshot();
      snapshot.phase = 'MIGRATIONS_COMMITTED';

      const decision =
        decideProductionRecoveryAction(snapshot);

      expect(decision.action).toBe(
        'RESTORE_COMMIT_BOUND_BACKUP',
      );
      expect(decision.reasons).toContain(
        'Post-migration schema acceptance has not passed',
      );
    });

    it('requires restoration for unexpected plugin changes', () => {
      const snapshot = safeRecoverySnapshot();
      snapshot.phase = 'MIGRATIONS_COMMITTED';
      snapshot.unexpectedPluginStateChange = true;

      const decision =
        decideProductionRecoveryAction(snapshot);

      expect(decision.action).toBe(
        'RESTORE_COMMIT_BOUND_BACKUP',
      );
    });

    it('never accepts private signing material', () => {
      const snapshot = safeRecoverySnapshot();
      snapshot.privateSigningMaterialDetected =
        true;

      const decision =
        decideProductionRecoveryAction(snapshot);

      expect(decision.action).toBe(
        'ABORT_BEFORE_MUTATION',
      );
    });

    it('accepts only after every runtime gate passes', () => {
      const snapshot = safeRecoverySnapshot();
      snapshot.phase =
        'POST_DEPLOYMENT_ACCEPTANCE';
      snapshot.schemaAccepted = true;
      snapshot.pluginAcceptancePassed = true;

      const decision =
        decideProductionRecoveryAction(snapshot);

      expect(decision.action).toBe(
        'ACCEPT_RELEASE',
      );
      expect(decision.releaseAccepted).toBe(true);
    });

    it('accepts a complete production checklist', () => {
      const result =
        validateProductionAcceptance(
          acceptedSnapshot(),
        );

      expect(result.status).toBe('ACCEPTED');
      expect(result.failedChecks).toEqual([]);
      expect(result.executionAuthorizationGranted)
        .toBe(false);
      expect(result.databaseMutationPerformed)
        .toBe(false);
    });

    it('rejects unexpected applied migrations', () => {
      const snapshot = acceptedSnapshot();
      snapshot.unexpectedMigrationsApplied = true;

      const result =
        validateProductionAcceptance(snapshot);

      expect(result.status).toBe('REJECTED');
      expect(result.failedChecks).toContain(
        'Unexpected migrations were applied',
      );
    });

    it('rejects missing independent sign-off', () => {
      const snapshot = acceptedSnapshot();
      snapshot.approverSignedOff = false;

      const result =
        validateProductionAcceptance(snapshot);

      expect(result.status).toBe('REJECTED');
      expect(result.failedChecks).toContain(
        'Approver sign-off is missing',
      );
    });

    it('rejects unhealthy services', () => {
      const snapshot = acceptedSnapshot();
      snapshot.apiHealthy = false;
      snapshot.postgresHealthy = false;

      const result =
        validateProductionAcceptance(snapshot);

      expect(result.status).toBe('REJECTED');
      expect(result.failedChecks).toContain(
        'PropertyOS API is unhealthy',
      );
      expect(result.failedChecks).toContain(
        'PostgreSQL is unhealthy',
      );
    });
  },
);
