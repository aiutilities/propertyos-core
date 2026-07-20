import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Phase 15C2F active health-contract evidence', () => {
  const evidencePath = resolve(
    process.cwd(),
    '../generated/knowledge/phase-15c2f-active-health-contract-evidence.json',
  );

  const evidence = JSON.parse(
    readFileSync(evidencePath, 'utf8'),
  );

  it('binds acceptance to the authorized source checkpoint', () => {
    expect(evidence.repository.branch)
      .toBe('feature/v3-documentation');
    expect(evidence.repository.sourceCommit)
      .toBe('1e3f57d262597fa75596b5ae6060482cb764e064');
    expect(evidence.authorization.explicitAuthorizationRecorded)
      .toBe(true);
  });

  it('binds the active runtime to the accepted image revision', () => {
    expect(evidence.acceptedImage.tag)
      .toBe('propertyos-api:phase15c2f-1e3f57d2');
    expect(evidence.acceptedImage.revision)
      .toBe(evidence.repository.sourceCommit);
    expect(evidence.activeRuntime.running).toBe(true);
    expect(evidence.activeRuntime.dockerHealth).toBe('healthy');
  });

  it('records the fail-closed readiness health contract', () => {
    expect(evidence.acceptedImage.readinessHealthcheckEmbedded)
      .toBe(true);
    expect(evidence.acceptedImage.readinessHealthcheckPath)
      .toBe('/api/v1/health/ready');
    expect(evidence.activeRuntime.readinessHttpStatus).toBe(200);
    expect(evidence.activeRuntime.readinessStatus).toBe('ok');
  });

  it('records protected metrics routes', () => {
    expect(evidence.activeRuntime.metricsRoutesPresent).toBe(true);
    expect(evidence.activeRuntime.metricsRoutesProtected).toBe(true);
  });

  it('records active local incident monitoring ownership', () => {
    expect(evidence.monitoring.owner).toBe('Anand Nataraj');
    expect(evidence.monitoring.loaded).toBe(true);
    expect(evidence.monitoring.failureThreshold).toBe(2);
    expect(evidence.monitoring.externalAlertsEnabled).toBe(false);
  });

  it('retains a stopped rollback asset', () => {
    expect(evidence.rollback.containerName)
      .toBe('propertyos-api-phase15c2f-rollback');
    expect(evidence.rollback.running).toBe(false);
    expect(evidence.rollback.restartPolicy).toBe('no');
    expect(evidence.rollback.retained).toBe(true);
  });

  it('records retirement of only the older stale rollback', () => {
    expect(evidence.rollback.olderStaleRollbackRetired).toBe(true);
  });

  it('preserves source database safety', () => {
    expect(evidence.databaseSafety.sourceStateBefore).toBe('1|37|0');
    expect(evidence.databaseSafety.sourceStateAfter).toBe('1|37|0');
    expect(evidence.databaseSafety.controlledMigrationCount).toBe(13);
    expect(evidence.databaseSafety.controlledMigrationsApplied).toBe(0);
    expect(evidence.databaseSafety.databaseMutated).toBe(false);
  });

  it('preserves external execution prohibitions', () => {
    expect(evidence.prohibitions.migrationsApplied).toBe(false);
    expect(evidence.prohibitions.whatsappConfigured).toBe(false);
    expect(evidence.prohibitions.executorInvoked).toBe(false);
    expect(evidence.prohibitions.externalEndpointContacted).toBe(false);
    expect(evidence.prohibitions.externalAlertSent).toBe(false);
    expect(evidence.prohibitions.externalMessageSent).toBe(false);
  });

  it('closes only Phase 15C2F', () => {
    expect(evidence.status.phase15C2F).toBe('COMPLETE');
    expect(evidence.status.phase15C2)
      .toBe('PENDING_CLOSURE_ASSESSMENT');
    expect(evidence.status.activeApiAccepted).toBe(true);
    expect(evidence.status.liveWhatsappAuthorized).toBe(false);
  });

  it('contains no credential material', () => {
    const serialized = JSON.stringify(evidence);
    expect(serialized).not.toMatch(
      /Bearer\s+[A-Za-z0-9._-]+|postgres:\/\/[^@]+@|AUTH_SECRET=/,
    );
  });
});
