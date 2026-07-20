import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Phase 15C2 production configuration closure', () => {
  const evidence = JSON.parse(
    readFileSync(
      resolve(
        process.cwd(),
        '../generated/knowledge/phase-15c2-production-configuration-closure.json',
      ),
      'utf8',
    ),
  );

  it('binds closure to the Phase 15C2F checkpoint', () => {
    expect(evidence.repository.branch)
      .toBe('feature/v3-documentation');
    expect(evidence.repository.closureBaseCommit)
      .toBe('ff603e738904ba9360cccf151b7285140ed49291');
    expect(evidence.repository.closureBaseTag)
      .toBe('v2.9.95-phase-15c2f-active-health-contract');
  });

  it('resolves every original readiness blocker', () => {
    const resolutions =
      Object.values(evidence.originalBlockerResolution) as Array<{
        resolved: boolean;
      }>;

    expect(resolutions).toHaveLength(5);
    expect(resolutions.every(value => value.resolved)).toBe(true);
  });

  it('completes every original required action', () => {
    const resolutions =
      Object.values(evidence.requiredActionResolution);

    expect(resolutions).toHaveLength(7);
    expect(resolutions.every(value => value === true)).toBe(true);
  });

  it('binds closure to the accepted active runtime', () => {
    expect(evidence.activeRuntime.image)
      .toBe('propertyos-api:phase15c2f-1e3f57d2');
    expect(evidence.activeRuntime.revision)
      .toBe('1e3f57d262597fa75596b5ae6060482cb764e064');
    expect(evidence.activeRuntime.running).toBe(true);
    expect(evidence.activeRuntime.dockerHealth).toBe('healthy');
  });

  it('records active fail-closed readiness', () => {
    expect(evidence.activeRuntime.readinessPath)
      .toBe('/api/v1/health/ready');
    expect(evidence.activeRuntime.readinessHttpStatus).toBe(200);
    expect(evidence.activeRuntime.readinessStatus).toBe('ok');
  });

  it('records protected metrics', () => {
    expect(evidence.activeRuntime.metricsRoutesPresent).toBe(true);
    expect(evidence.activeRuntime.metricsRoutesProtected).toBe(true);
  });

  it('records local incident ownership and monitoring', () => {
    expect(evidence.monitoring.owner).toBe('Anand Nataraj');
    expect(evidence.monitoring.launchAgentLoaded).toBe(true);
    expect(evidence.monitoring.latestRecordedStatus).toBe('ok');
    expect(evidence.monitoring.externalAlertsEnabled).toBe(false);
  });

  it('retains a stopped rollback asset', () => {
    expect(evidence.rollback.running).toBe(false);
    expect(evidence.rollback.restartPolicy).toBe('no');
    expect(evidence.rollback.retained).toBe(true);
  });

  it('preserves source database safety', () => {
    expect(evidence.databaseSafety.sourceStateBefore).toBe('1|37|0');
    expect(evidence.databaseSafety.sourceStateAfter).toBe('1|37|0');
    expect(evidence.databaseSafety.controlledMigrationCount).toBe(13);
    expect(evidence.databaseSafety.controlledMigrationsApplied).toBe(0);
    expect(evidence.databaseSafety.databaseMutated).toBe(false);
  });

  it('keeps WhatsApp and live pilot authorization separate', () => {
    expect(
      evidence.scopeBoundary
        .whatsappConfigurationRequiredFor15C2Closure,
    ).toBe(false);
    expect(evidence.scopeBoundary.whatsappConfigurationDeferredTo)
      .toBe('PHASE_15D');
    expect(evidence.scopeBoundary.livePilotAuthorizationPresent)
      .toBe(false);
    expect(evidence.prohibitions.whatsappConfigured).toBe(false);
    expect(evidence.prohibitions.externalMessageSent).toBe(false);
  });

  it('keeps migration authorization separate', () => {
    expect(
      evidence.scopeBoundary
        .productionMigrationAuthorizationDeferredTo,
    ).toBe('PHASE_15C3');
    expect(evidence.prohibitions.migrationsApplied).toBe(false);
  });

  it('keeps multi-model orchestration outstanding', () => {
    expect(
      evidence.scopeBoundary.multiModelAiOrchestrationImplemented,
    ).toBe(false);
    expect(
      evidence.scopeBoundary.multiModelAiOrchestrationDeferredTo,
    ).toBe('PHASE_16');
    expect(evidence.status.phase16MultiModelAiOrchestration)
      .toBe('OUTSTANDING');
  });

  it('closes Phase 15C2 only', () => {
    expect(evidence.status.phase15C2).toBe('COMPLETE');
    expect(
      evidence.status.productionConfigurationAndMonitoringReady,
    ).toBe(true);
    expect(evidence.status.phase15C3MigrationAuthorization)
      .toBe('NOT_STARTED');
    expect(evidence.status.phase15DControlledPilot)
      .toBe('NOT_AUTHORIZED');
  });

  it('contains no credential material', () => {
    const serialized = JSON.stringify(evidence);

    expect(serialized).not.toMatch(
      /Bearer\s+[A-Za-z0-9._-]+|postgres:\/\/[^@]+@|AUTH_SECRET=/,
    );
  });
});
