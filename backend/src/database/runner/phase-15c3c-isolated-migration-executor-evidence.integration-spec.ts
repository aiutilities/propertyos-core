import {
  describe,
  expect,
  it,
} from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Phase 15C3C isolated executor evidence', () => {
  const evidence = JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '../generated/knowledge/phase-15c3c-isolated-migration-executor-evidence.json',
      ),
      'utf8',
    ),
  );

  it('binds evidence to the executor checkpoint', () => {
    expect(evidence.repository.sourceCommit)
      .toBe('acd02a4d91c07a83ddea2642e4cec347652cfa11');
    expect(evidence.repository.sourceTag)
      .toBe('v2.9.98-phase-15c3b-solo-migration-executor');
    expect(evidence.repository.repositoryClean).toBe(true);
  });

  it('records editable solo-founder governance', () => {
    expect(evidence.governance.mode)
      .toBe('SOLO_FOUNDER_CONTROLLED');
    expect(evidence.governance.accountableOwnerId)
      .toBe('anand-nataraj');
    expect(evidence.governance.futureSeparationOfDutiesRequired)
      .toBe(true);
  });

  it('keeps commercial production blocked', () => {
    expect(evidence.governance.founderPilotOnly).toBe(true);
    expect(evidence.governance.commercialProductionAllowed)
      .toBe(false);
    expect(
      evidence.governance
        .independentHumanReviewBeforeCommercialProduction,
    ).toBe(true);
  });

  it('records all 13 controlled migrations', () => {
    expect(evidence.isolatedExecution.controlledMigrationRange)
      .toBe('037-049');
    expect(evidence.isolatedExecution.controlledMigrationCount)
      .toBe(13);
    expect(evidence.isolatedExecution.firstMigration)
      .toBe(
        'core/037-create-core-inventory-material-issue.sql',
      );
    expect(evidence.isolatedExecution.lastMigration)
      .toBe(
        'core/049-correct-access-event-credential-reference.sql',
      );
  });

  it('records the immutable migration-set digest', () => {
    expect(evidence.isolatedExecution.migrationSetSha256)
      .toBe(
        'fe2f31fb77109a87a65a7f8859c6e7949ad166debc2fce8392abc67d95b9b1d0',
      );
  });

  it('records atomic execution and duplicate prevention', () => {
    expect(evidence.isolatedExecution.transactionStrategy)
      .toBe('ATOMIC_CONTROLLED_RANGE');
    expect(evidence.isolatedExecution.atomicExecutionVerified)
      .toBe(true);
    expect(evidence.isolatedExecution.duplicateInvocationPrevented)
      .toBe(true);
  });

  it('records target and baseline locks', () => {
    expect(evidence.isolatedExecution.advisoryLockUsed)
      .toBe(true);
    expect(evidence.isolatedExecution.targetIdentityVerified)
      .toBe(true);
    expect(evidence.isolatedExecution.baselineLockVerified)
      .toBe(true);
  });

  it('records schema acceptance', () => {
    expect(
      evidence.schemaAcceptance.accessEventCredentialReference,
    ).toBe('access_credentials');
    expect(
      evidence.schemaAcceptance.legacyCredentialReferencePreserved,
    ).toBe(true);
    expect(
      evidence.schemaAcceptance.controlledTargetRelationCount,
    ).toBe(6);
  });

  it('records isolated cleanup', () => {
    expect(evidence.cleanup.temporaryHarnessRemoved).toBe(true);
    expect(evidence.cleanup.temporaryDatabaseRemoved).toBe(true);
    expect(evidence.cleanup.sourceDatabaseStatePreserved)
      .toBe(true);
  });

  it('preserves source database safety', () => {
    expect(evidence.sourceSafety.stateBefore).toBe('1|37|0');
    expect(evidence.sourceSafety.stateAfter).toBe('1|37|0');
    expect(evidence.sourceSafety.controlledMigrationsApplied)
      .toBe(0);
    expect(evidence.sourceSafety.databaseMutated).toBe(false);
  });

  it('preserves final invocation boundaries', () => {
    expect(evidence.authorizationBoundary.sourceRunnerExposed)
      .toBe(false);
    expect(
      evidence.authorizationBoundary.sourceInvocationPerformed,
    ).toBe(false);
    expect(
      evidence.authorizationBoundary
        .finalDigestBoundConfirmationRequired,
    ).toBe(true);
    expect(
      evidence.authorizationBoundary
        .freshBackupRequiredBeforeSourceInvocation,
    ).toBe(true);
    expect(
      evidence.authorizationBoundary.externalMessagingAuthorized,
    ).toBe(false);
  });

  it('closes isolated acceptance only', () => {
    expect(evidence.status.phase15C3C).toBe('COMPLETE');
    expect(evidence.status.isolatedExecutorAccepted).toBe(true);
    expect(evidence.status.sourceMigrationStatus)
      .toBe(
        'AWAITING_PREPARATION_AND_FINAL_CONFIRMATION',
      );
  });
});
