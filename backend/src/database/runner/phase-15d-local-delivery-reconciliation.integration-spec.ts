import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Phase 15D local delivery reconciliation', () => {
  const evidencePath = resolve(
    __dirname,
    '../../../../generated/knowledge/phase-15d-local-delivery-reconciliation.json',
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

  it('binds reconciliation to the Phase 15E2 checkpoint', () => {
    expect(evidence.repository.checkpointCommit).toBe(
      'b724653a4629a33a179373e9de4fe7a1c9298398',
    );
  });

  it('records explicit solo-founder authorization', () => {
    expect(evidence.governance.mode).toBe('SOLO_FOUNDER_CONTROLLED');
    expect(
      evidence.governance.explicitOneTimeInvocationConfirmed,
    ).toBe(true);
  });

  it('records exactly one consumed attempt', () => {
    expect(evidence.governance.maximumAttempts).toBe(1);
    expect(evidence.governance.attemptsUsed).toBe(1);
    expect(evidence.governance.attemptsRemaining).toBe(0);
  });

  it('forbids and records absence of automatic retry', () => {
    expect(evidence.governance.automaticRetryPermitted).toBe(false);
    expect(evidence.governance.automaticRetryPerformed).toBe(false);
  });

  it('records the published protected local adapter', () => {
    expect(evidence.localAdapter.publishedBeforeInvocation).toBe(true);
    expect(evidence.localAdapter.headerAuthenticationConfigured).toBe(true);
    expect(evidence.localAdapter.nodeCount).toBe(3);
  });

  it('records the local workflow failure accurately', () => {
    expect(evidence.outcome.classification).toBe(
      'LOCAL_WORKFLOW_EXECUTION_ERROR',
    );
    expect(evidence.outcome.failureCode).toBe(
      'N8N_RESPOND_TO_WEBHOOK_NODE_NOT_AVAILABLE_IN_PUBLISHED_EXECUTION',
    );
    expect(evidence.outcome.n8nExecutionStatus).toBe('error');
  });

  it('records that no local acknowledgement was received', () => {
    expect(evidence.outcome.localAcknowledgementReceived).toBe(false);
  });

  it('records that no real WhatsApp message was sent', () => {
    expect(evidence.outcome.realWhatsAppMessageSent).toBe(false);
    expect(evidence.boundaries.successfulWhatsAppDeliveryProven).toBe(false);
  });

  it('defers the real WPPConnect pilot', () => {
    expect(evidence.outcome.realWppConnectPilotDeferred).toBe(true);
    expect(
      evidence.boundaries.realExternalPilotRequiresNewAuthorization,
    ).toBe(true);
  });

  it('preserves the source database state', () => {
    expect(evidence.safety.sourceStateBefore).toBe('1|50|13');
    expect(evidence.safety.sourceStateAfter).toBe('1|50|13');
    expect(evidence.safety.sourceDatabaseMutated).toBe(false);
  });

  it('aligns the Phase 15 plan with the failed-closed outcome', () => {
    expect(plan).toContain(
      'Phase 15D — Local-development delivery rehearsal',
    );
    expect(plan).toContain('No real WhatsApp message was sent.');
    expect(plan).toMatch(/requires a new,\s+separately authorized future phase/);
  });

  it('aligns the release checklist', () => {
    expect(checklist).toContain(
      '[x] Exactly one local-development webhook attempt executed',
    );
    expect(checklist).toContain(
      '[x] Local workflow error reconciled without automatic retry',
    );
  });

  it('contains no recipient, message, endpoint, or credential material', () => {
    expect(rawEvidence).not.toMatch(/\+[1-9][0-9]{7,14}/);
    expect(rawEvidence).not.toContain(
      'PropertyOS pilot notification:',
    );
    expect(rawEvidence).not.toMatch(/https?:\/\/[^"]+\/webhook/);
    expect(rawEvidence).not.toMatch(
      /Bearer\s+[A-Za-z0-9._-]+|WEBHOOK_TOKEN=|AUTH_SECRET=/,
    );
  });

  it('closes only Phase 15D and retains final closure', () => {
    expect(evidence.boundaries.phase15DDevelopmentExercise).toBe('COMPLETE');
    expect(evidence.boundaries.phase15FinalClosureRequired).toBe(true);
    expect(evidence.nextStatus).toBe('PHASE_15_FINAL_CLOSURE');
  });

  it('retains Phase 16 as outstanding', () => {
    expect(evidence.boundaries.phase16MultiModelAi).toBe('OUTSTANDING');
  });
});
