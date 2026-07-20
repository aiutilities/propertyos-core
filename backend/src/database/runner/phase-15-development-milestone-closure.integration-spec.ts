import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Phase 15 development milestone closure', () => {
  const root = resolve(process.cwd(), '..');
  const evidencePath = resolve(
    root,
    'generated/knowledge/phase-15-development-milestone-closure.json',
  );
  const planPath = resolve(
    root,
    'documentation/PHASE_15_ADVAITHS_NEST_PILOT_PLAN.md',
  );
  const checklistPath = resolve(
    root,
    'documentation/RELEASE_CHECKLIST.md',
  );

  const evidence = JSON.parse(readFileSync(evidencePath, 'utf8'));
  const plan = readFileSync(planPath, 'utf8');
  const checklist = readFileSync(checklistPath, 'utf8');

  it('binds closure to the reconciled Phase 15D checkpoint', () => {
    expect(evidence.sourceCheckpoint.commit).toBe(
      '51e30cbb158382516aba1449158b70d23ddf5116',
    );
  });

  it('closes Phase 15 as a development milestone', () => {
    expect(evidence.closure.status).toBe('COMPLETE');
    expect(evidence.closure.classification).toBe(
      'DEVELOPMENT_MILESTONE_COMPLETE_WITH_DEFERRED_EXTERNAL_DELIVERY',
    );
  });

  it('records every completed Phase 15 workstream', () => {
    expect(evidence.completedWork).toMatchObject({
      phase15A: true,
      phase15B: true,
      phase15C1: true,
      phase15C2: true,
      phase15C3: true,
      phase15D: 'COMPLETE_FAILED_CLOSED',
      phase15E1: true,
      phase15E2: true,
    });
  });

  it('preserves the accepted source migration state', () => {
    expect(evidence.database).toMatchObject({
      state: '1|50|13',
      controlledRange: '037-049',
      controlledMigrationCount: 13,
      mutationDuringClosure: false,
    });
  });

  it('records healthy runtime operations', () => {
    expect(evidence.runtime).toMatchObject({
      activeApiHealthy: true,
      readinessContractActive: true,
      localIncidentMonitorLoaded: true,
      incidentOwner: 'Anand Nataraj',
    });
  });

  it('records the consumed exactly-once attempt', () => {
    expect(evidence.delivery).toMatchObject({
      attemptsAuthorized: 1,
      attemptsUsed: 1,
      attemptsRemaining: 0,
      automaticRetryAllowed: false,
      retryPerformed: false,
    });
  });

  it('does not claim successful local acknowledgement', () => {
    expect(evidence.delivery.localAcknowledgementReceived).toBe(false);
  });

  it('does not claim real WhatsApp delivery', () => {
    expect(evidence.delivery.realWhatsAppMessageSent).toBe(false);
  });

  it('defers the external WPPConnect pilot', () => {
    expect(evidence.delivery.externalWppConnectPilot).toBe(
      'DEFERRED_REQUIRES_SEPARATE_FUTURE_AUTHORIZATION',
    );
  });

  it('keeps broader commercial production blocked', () => {
    expect(evidence.closure.commercialProductionAuthorized).toBe(false);
    expect(
      evidence.governance
        .independentHumanReviewRequiredBeforeCommercialProduction,
    ).toBe(true);
  });

  it('retains editable future separation of duties', () => {
    expect(evidence.governance).toMatchObject({
      mode: 'SOLO_FOUNDER_CONTROLLED',
      futureTeamMode: 'SEPARATION_OF_DUTIES',
    });
  });

  it('preserves external execution boundaries during closure', () => {
    expect(evidence.boundaries).toMatchObject({
      webhookContactDuringClosure: false,
      externalEndpointContactDuringClosure: false,
      externalMessageDuringClosure: false,
    });
  });

  it('keeps Phase 16 outstanding', () => {
    expect(evidence.boundaries.phase16Complete).toBe(false);
  });

  it('aligns the Phase 15 plan', () => {
    expect(plan).toContain(
      'Phase 15 is complete as a development milestone.',
    );
    expect(plan).toContain(
      'The real WPPConnect delivery pilot remains deferred.',
    );
    expect(plan).toContain('no real WhatsApp message was sent');
  });

  it('aligns the release checklist', () => {
    expect(checklist).toContain(
      '- [x] Phase 15 complete as a development milestone',
    );
    expect(checklist).toContain(
      '- [x] Real WPPConnect pilot deferred to separate authorization',
    );
    expect(checklist).toContain(
      '- [x] Phase 16 multi-model AI orchestration remains outstanding',
    );
  });

  it('contains no credential or recipient material', () => {
    const serialized = JSON.stringify(evidence);
    expect(serialized).not.toMatch(
      /Bearer\s+[A-Za-z0-9._-]+|AUTH_SECRET=|postgres:\/\/[^@]+@/,
    );
    expect(serialized).not.toMatch(/recipientSha256|phoneNumber|webhookToken/);
  });
});
