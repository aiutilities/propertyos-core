import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  readFileSync,
} from 'node:fs';
import {
  resolve,
} from 'node:path';

describe(
  'Phase 15C2 production configuration readiness evidence',
  () => {
    const evidencePath = resolve(
      __dirname,
      '../../../../generated/knowledge/phase-15c2-production-configuration-readiness-evidence.json',
    );

    const raw = readFileSync(
      evidencePath,
      'utf8',
    );

    const evidence = JSON.parse(raw);

    it('binds evidence to the verified Phase 15C1 checkpoint', () => {
      expect(evidence.phase).toBe('15C2');
      expect(evidence.repository).toEqual({
        branch:
          'feature/v3-documentation',
        head:
          '0d015a78dcf6de12fe17534b35905e1c7b530b58',
        cleanBeforeEvidenceCreation:
          true,
      });
    });

    it('preserves the source database safety state', () => {
      expect(evidence.sourceDatabase.state).toBe(
        '1|37|0',
      );
      expect(
        evidence.sourceDatabase.controlledMigrationRange,
      ).toBe('037-049');
      expect(
        evidence.sourceDatabase.controlledMigrationsApplied,
      ).toBe(0);
      expect(
        evidence.sourceDatabase.mutatedDuringInspection,
      ).toBe(false);
    });

    it('classifies the running API as stale and unacceptable', () => {
      expect(
        evidence.runtime.containerImageAvailableLocally,
      ).toBe(false);
      expect(evidence.runtime.classification).toBe(
        'ORPHANED_STALE_RUNTIME',
      );
      expect(
        evidence.runtime.currentAuthValidationCompiled,
      ).toBe(false);
      expect(
        evidence.runtime.currentMetricsControllerCompiled,
      ).toBe(false);
      expect(
        evidence.runtime.pilotCandidateAcceptable,
      ).toBe(false);
    });

    it('records the authentication blocker without secret material', () => {
      expect(evidence.authentication.secretPresent).toBe(
        true,
      );
      expect(
        evidence.authentication.minimumLengthSatisfied,
      ).toBe(false);
      expect(
        evidence.authentication.secretValueRecorded,
      ).toBe(false);
      expect(
        evidence.authentication.secretHashRecorded,
      ).toBe(false);
      expect(
        evidence.authentication.rotationAuthorized,
      ).toBe(false);
    });

    it('recognizes scheduler defaults as non-blocking', () => {
      expect(evidence.scheduler.defaultsAvailable).toBe(
        true,
      );
      expect(evidence.scheduler).toMatchObject({
        pollIntervalMsDefault: 30000,
        batchSizeDefault: 20,
        staleAfterMsDefault: 300000,
        retryBaseDelayMsDefault: 30000,
        maximumRetryDelayMsDefault: 300000,
        readinessBlocker: false,
      });
    });

    it('records healthy liveness but unavailable metrics', () => {
      expect(
        evidence.monitoring.healthEndpoint,
      ).toMatchObject({
        path: '/api/v1/health',
        httpStatus: 200,
        healthy: true,
      });

      expect(
        evidence.monitoring.metricsAvailableInRuntime,
      ).toBe(false);

      expect(
        evidence.monitoring.metricsEndpoints,
      ).toHaveLength(4);

      for (
        const endpoint of
        evidence.monitoring.metricsEndpoints
      ) {
        expect(endpoint.httpStatus).toBe(404);
      }
    });

    it('records missing incident readiness', () => {
      expect(
        evidence.incidentResponse.configured,
      ).toBe(false);
      expect(
        evidence.incidentResponse.configuredKeyCount,
      ).toBe(0);
      expect(
        evidence.incidentResponse.channelValueRecorded,
      ).toBe(false);
    });

    it('preserves WhatsApp and live-execution prohibitions', () => {
      expect(evidence.whatsapp).toMatchObject({
        providerConfigured: false,
        webhookUrlConfigured: false,
        webhookTokenConfigured: false,
        tokenValueRecorded: false,
        executorInvoked: false,
        externalEndpointContacted: false,
        externalMessageSent: false,
      });

      expect(
        evidence.authorization.whatsappLiveAuthorizationPresent,
      ).toBe(false);
    });

    it('requires every corrective action before readiness', () => {
      expect(evidence.requiredActions).toEqual(
        expect.arrayContaining([
          'AUTHORIZE_AND_PERFORM_CONTROLLED_AUTH_SECRET_ROTATION',
          'BUILD_A_COMMIT_BOUND_API_IMAGE',
          'VERIFY_AUTHENTICATED_METRICS_ROUTES',
          'CONFIGURE_MONITORING_ALERTS_AND_INCIDENT_CHANNEL',
        ]),
      );
    });

    it('fails closed without deployment or pilot authorization', () => {
      expect(evidence.conclusion).toEqual({
        status: 'NOT_READY_FAIL_CLOSED',
        phase15C2Complete: false,
        productionDeploymentAuthorized: false,
        controlledPilotAuthorized: false,
      });

      expect(
        evidence.authorization.productionConfigurationMutationAuthorized,
      ).toBe(false);
      expect(
        evidence.authorization.serviceRestartAuthorized,
      ).toBe(false);
      expect(
        evidence.authorization.migrationAuthorized,
      ).toBe(false);
    });

    it('contains no recorded secret, password, token or channel values', () => {
      const forbiddenKeys = new Set([
        'secret',
        'secretValue',
        'password',
        'passwordValue',
        'token',
        'tokenValue',
        'webhookToken',
        'channelValue',
      ]);

      const inspect = (
        value: unknown,
        path: string[] = [],
      ): void => {
        if (
          value === null ||
          typeof value !== 'object'
        ) {
          return;
        }

        for (
          const [key, child] of
          Object.entries(
            value as Record<string, unknown>,
          )
        ) {
          expect(
            forbiddenKeys.has(key),
          ).toBe(false);

          inspect(
            child,
            [...path, key],
          );
        }
      };

      inspect(evidence);

      expect(raw).not.toMatch(
        /propertyos-dev-secret-change-me/,
      );
      expect(raw).not.toMatch(
        /change-me-in-production/,
      );
    });
  },
);
