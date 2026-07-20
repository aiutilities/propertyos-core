import {
  describe,
  expect,
  it,
} from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Phase 15C3 source migration execution closure', () => {
  const evidence = JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '../generated/knowledge/phase-15c3-source-migration-execution-closure.json',
      ),
      'utf8',
    ),
  );

  it('binds execution to the accepted checkpoint', () => {
    expect(evidence.repository.executionCommit)
      .toBe('32ec19af061db8734cba6a87416f7868d084cbec');
    expect(evidence.repository.executionTag)
      .toBe('v2.9.99-phase-15c3c-isolated-executor-acceptance');
  });

  it('records solo-founder authorization', () => {
    expect(evidence.authorization.mode)
      .toBe('SOLO_FOUNDER_CONTROLLED');
    expect(evidence.authorization.accountableOwnerId)
      .toBe('anand-nataraj');
    expect(evidence.authorization.explicitFinalConfirmationRecorded)
      .toBe(true);
  });

  it('records the cooling-off requirement', () => {
    expect(evidence.authorization.coolingOffMinutesSatisfied)
      .toBeGreaterThanOrEqual(15);
    expect(evidence.authorization.preparationSha256)
      .toBe(
        '0941c87d8a0a4316289339db6ea758fbefef4321e5437ae77c49ba110cb7bf0b',
      );
  });

  it('records the cutover backup', () => {
    expect(evidence.backup.cutoverBackupSha256)
      .toBe(
        'd5eefbe8396b67b0f6cf56fbd857ad1a25e728efc69357b7e09f73e5236fccd5',
      );
    expect(evidence.backup.catalogReadable).toBe(true);
    expect(evidence.backup.isolatedRestoreVerified).toBe(true);
  });

  it('records the exact migration range', () => {
    expect(evidence.execution.migrationRange).toBe('037-049');
    expect(evidence.execution.migrationCount).toBe(13);
    expect(evidence.execution.migrationSetSha256)
      .toBe(
        'fe2f31fb77109a87a65a7f8859c6e7949ad166debc2fce8392abc67d95b9b1d0',
      );
  });

  it('records atomic execution without retry', () => {
    expect(evidence.execution.transactionStrategy)
      .toBe('ATOMIC_CONTROLLED_RANGE');
    expect(evidence.execution.atomicCommitCompleted).toBe(true);
    expect(evidence.execution.duplicateRetryPerformed).toBe(false);
  });

  it('records the committed database transition', () => {
    expect(evidence.databaseAcceptance.sourceStateBefore)
      .toBe('1|37|0');
    expect(evidence.databaseAcceptance.sourceStateAfter)
      .toBe('1|50|13');
    expect(evidence.databaseAcceptance.controlledMigrationsRecorded)
      .toBe(13);
  });

  it('records access credential schema acceptance', () => {
    expect(
      evidence.databaseAcceptance.runtimeCredentialReference,
    ).toBe('access_credentials');
    expect(
      evidence.databaseAcceptance.legacyCredentialReference,
    ).toBe('credentials');
  });

  it('classifies the health timeout as transient', () => {
    expect(
      evidence.runtimeReconciliation.initialDockerHealthWaitTimedOut,
    ).toBe(true);
    expect(evidence.runtimeReconciliation.classification)
      .toBe('TRANSIENT_POST_RESTART_HEALTH_TIMING');
    expect(evidence.runtimeReconciliation.migrationFailure)
      .toBe(false);
  });

  it('forbids retry and unnecessary restore', () => {
    expect(evidence.runtimeReconciliation.migrationRetryRequired)
      .toBe(false);
    expect(evidence.runtimeReconciliation.migrationRetryForbidden)
      .toBe(true);
    expect(evidence.runtimeReconciliation.databaseRestoreRequired)
      .toBe(false);
  });

  it('records healthy reconciled services', () => {
    expect(evidence.runtimeReconciliation.activeApiRunning)
      .toBe(true);
    expect(evidence.runtimeReconciliation.dockerHealth)
      .toBe('healthy');
    expect(evidence.runtimeReconciliation.readinessHttpStatus)
      .toBe(200);
    expect(evidence.runtimeReconciliation.postgresHealth)
      .toBe('healthy');
    expect(evidence.runtimeReconciliation.incidentMonitorLoaded)
      .toBe(true);
  });

  it('preserves WhatsApp and external boundaries', () => {
    expect(evidence.boundaries.whatsappConfigured).toBe(false);
    expect(evidence.boundaries.whatsappExecutorExposed).toBe(false);
    expect(evidence.boundaries.externalEndpointContacted)
      .toBe(false);
    expect(evidence.boundaries.externalMessageSent).toBe(false);
  });

  it('keeps commercial production blocked', () => {
    expect(evidence.boundaries.broaderCommercialProductionAuthorized)
      .toBe(false);
    expect(
      evidence.boundaries
        .independentHumanReviewBeforeCommercialProductionRequired,
    ).toBe(true);
  });

  it('closes Phase 15C3 only', () => {
    expect(evidence.status.phase15C3).toBe('COMPLETE');
    expect(evidence.status.sourceMigrationsApplied).toBe(true);
    expect(evidence.status.sourceDatabaseReady).toBe(true);
    expect(evidence.status.nextPhase)
      .toBe('PHASE_15D_CONTROLLED_PILOT');
    expect(evidence.status.phase15DLiveAuthorizationPresent)
      .toBe(false);
  });
});
