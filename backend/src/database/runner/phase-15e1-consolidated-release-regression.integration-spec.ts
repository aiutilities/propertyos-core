import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Phase 15E1 consolidated release regression evidence', () => {
  const evidencePath = resolve(
    __dirname,
    '../../../../generated/knowledge/phase-15e1-consolidated-release-regression.json',
  );

  const rawEvidence = readFileSync(evidencePath, 'utf8');
  const evidence = JSON.parse(rawEvidence);

  it('binds evidence to the accepted Phase 15C3 checkpoint', () => {
    expect(evidence.repository.checkpointCommit).toBe(
      '3a393b8ee9eac9d7a08b1eeb63a9fc1b1e082832',
    );
    expect(evidence.repository.cleanBefore).toBe(true);
    expect(evidence.repository.cleanAfter).toBe(true);
  });

  it('records the complete backend regression result', () => {
    expect(evidence.backend.testSuitesPassed).toBe(167);
    expect(evidence.backend.testSuitesTotal).toBe(167);
    expect(evidence.backend.testsPassed).toBe(1261);
    expect(evidence.backend.testsTotal).toBe(1261);
    expect(evidence.backend.snapshots).toBe(0);
  });

  it('records backend typecheck and build acceptance', () => {
    expect(evidence.backend.typecheckPassed).toBe(true);
    expect(evidence.backend.buildPassed).toBe(true);
  });

  it('records frontend verification and production build acceptance', () => {
    expect(evidence.frontend.pilotContractsPassed).toBe(4);
    expect(evidence.frontend.pilotContractsTotal).toBe(4);
    expect(evidence.frontend.typecheckPassed).toBe(true);
    expect(evidence.frontend.productionBuildPassed).toBe(true);
    expect(evidence.frontend.generatedPages).toBe(150);
  });

  it('preserves the post-migration source state', () => {
    expect(evidence.database.sourceStateBefore).toBe('1|50|13');
    expect(evidence.database.sourceStateAfter).toBe('1|50|13');
    expect(evidence.database.controlledMigrationsApplied).toBe(13);
    expect(evidence.database.mutationDuringRegression).toBe(false);
  });

  it('records healthy runtime and local incident monitoring', () => {
    expect(evidence.runtime.activeApiHealthy).toBe(true);
    expect(evidence.runtime.readinessHttpStatus).toBe(200);
    expect(evidence.runtime.incidentMonitorLoaded).toBe(true);
    expect(evidence.runtime.incidentOwner).toBe('Anand Nataraj');
  });

  it('closes Phase 15E1 without prematurely closing Phase 15', () => {
    expect(evidence.phaseBoundaries.phase15C3).toBe('COMPLETE');
    expect(evidence.phaseBoundaries.phase15E1).toBe('COMPLETE');
    expect(evidence.phaseBoundaries.phase15Complete).toBe(false);
  });

  it('parks Phase 15D as the final operational sprint', () => {
    expect(evidence.phaseBoundaries.phase15D).toBe(
      'PARKED_AS_FINAL_OPERATIONAL_SPRINT',
    );
    expect(evidence.phaseBoundaries.phase15E2).toBe('NOT_STARTED');
  });

  it('preserves all delivery prohibitions', () => {
    expect(evidence.deliverySafety.endpointContacted).toBe(false);
    expect(evidence.deliverySafety.deliveryAttemptUsed).toBe(false);
    expect(evidence.deliverySafety.externalMessageSent).toBe(false);
  });

  it('contains no recipient, endpoint or credential material', () => {
    expect(rawEvidence).not.toMatch(/\+[1-9][0-9]{7,14}/);
    expect(rawEvidence).not.toMatch(/https?:\/\/[^"]+\/webhook/);
    expect(rawEvidence).not.toMatch(
      /Bearer\s+[A-Za-z0-9._-]+|AUTH_SECRET=|WEBHOOK_TOKEN=/,
    );
  });

  it('retains Phase 16 as outstanding', () => {
    expect(evidence.phaseBoundaries.phase16MultiModelAi).toBe('OUTSTANDING');
    expect(evidence.nextStatus).toBe('PHASE_15E2_RELEASE_READINESS');
  });
});
