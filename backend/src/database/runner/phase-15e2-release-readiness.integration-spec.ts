import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Phase 15E2 release readiness evidence', () => {
  const evidencePath = resolve(
    __dirname,
    '../../../../generated/knowledge/phase-15e2-release-readiness.json',
  );
  const planPath = resolve(
    __dirname,
    '../../../../documentation/PHASE_15_ADVAITHS_NEST_PILOT_PLAN.md',
  );
  const checklistPath = resolve(
    __dirname,
    '../../../../documentation/RELEASE_CHECKLIST.md',
  );

  const rawEvidence = readFileSync(evidencePath, 'utf8');
  const evidence = JSON.parse(rawEvidence);
  const plan = readFileSync(planPath, 'utf8');
  const checklist = readFileSync(checklistPath, 'utf8');

  it('binds readiness to the Phase 15E1 checkpoint', () => {
    expect(evidence.repository.checkpointCommit).toBe(
      'bca69616f2a8607ad50c26183c37c46474be34bd',
    );
  });

  it('records the reconciled source database state', () => {
    expect(evidence.documentation.sourceStateRecorded).toBe('1|50|13');
    expect(plan).toContain('Source database state: `1|50|13`');
  });

  it('records completed configuration and migration phases', () => {
    expect(evidence.verifiedFoundation.phase15C2).toBe('COMPLETE');
    expect(evidence.verifiedFoundation.phase15C3).toBe('COMPLETE');
    expect(plan).toContain('Phase 15C3 — Controlled source migrations');
  });

  it('records the consolidated regression checkpoint', () => {
    expect(evidence.verifiedFoundation.phase15E1).toBe('COMPLETE');
    expect(evidence.verifiedFoundation.backendSuitesPassed).toBe(167);
    expect(evidence.verifiedFoundation.backendTestsPassed).toBe(1261);
  });

  it('records editable solo-founder governance accurately', () => {
    expect(evidence.documentation.soloFounderGovernanceRecorded).toBe(true);
    expect(plan).toContain('SOLO_FOUNDER_CONTROLLED');
    expect(plan).toContain('must not be represented as independent approval');
  });

  it('requires future separation of duties', () => {
    expect(
      evidence.documentation.futureSeparationOfDutiesRecorded,
    ).toBe(true);
    expect(checklist).toContain('SEPARATION_OF_DUTIES');
  });

  it('parks Phase 15D as the final operational sprint', () => {
    expect(evidence.remainingPhase15Work.phase15D).toBe(
      'PARKED_AS_FINAL_OPERATIONAL_SPRINT',
    );
    expect(evidence.nextStatus).toBe(
      'PHASE_15D_FINAL_OPERATIONAL_SPRINT',
    );
  });

  it('requires exactly-once delivery and reconciliation', () => {
    expect(
      evidence.remainingPhase15Work.exactlyOneDeliveryAttemptRequired,
    ).toBe(true);
    expect(
      evidence.remainingPhase15Work.postDeliveryReconciliationRequired,
    ).toBe(true);
  });

  it('does not prematurely close Phase 15', () => {
    expect(evidence.releaseBoundary.phase15Complete).toBe(false);
    expect(
      evidence.remainingPhase15Work.finalClosureCheckpointRequired,
    ).toBe(true);
  });

  it('keeps commercial production and branch merge blocked', () => {
    expect(evidence.releaseBoundary.commercialReleaseAuthorized).toBe(false);
    expect(
      evidence.releaseBoundary.longLivedBranchMergeAuthorized,
    ).toBe(false);
    expect(evidence.documentation.commercialProductionBlocked).toBe(true);
  });

  it('preserves delivery safety boundaries', () => {
    expect(evidence.deliverySafety.endpointContacted).toBe(false);
    expect(evidence.deliverySafety.deliveryAttemptUsed).toBe(false);
    expect(evidence.deliverySafety.externalMessageSent).toBe(false);
  });

  it('contains no recipient, endpoint, token or credential material', () => {
    expect(rawEvidence).not.toMatch(/\+[1-9][0-9]{7,14}/);
    expect(rawEvidence).not.toMatch(/https?:\/\/[^"]+\/webhook/);
    expect(rawEvidence).not.toMatch(
      /Bearer\s+[A-Za-z0-9._-]+|AUTH_SECRET=|WEBHOOK_TOKEN=/,
    );
  });

  it('retains Phase 16 as outstanding', () => {
    expect(evidence.releaseBoundary.phase16MultiModelAi).toBe(
      'OUTSTANDING',
    );
  });
});
