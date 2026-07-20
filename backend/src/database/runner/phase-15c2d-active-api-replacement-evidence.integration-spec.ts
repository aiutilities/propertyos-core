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
  'Phase 15C2D active API replacement evidence',
  () => {
    const evidencePath = resolve(
      __dirname,
      '../../../../generated/knowledge/phase-15c2d-active-api-replacement-evidence.json',
    );

    const raw = readFileSync(
      evidencePath,
      'utf8',
    );

    const evidence = JSON.parse(raw);

    it('binds evidence to the verified repository checkpoint', () => {
      expect(evidence.repository).toEqual({
        branch:
          'feature/v3-documentation',
        head:
          'aad9c672dbe82aad9d6d595eec79f9f1e17ad13e',
        tag:
          'v2.9.91-phase-15c2c-isolated-image-acceptance',
        cleanBeforeEvidenceCreation:
          true,
      });
    });

    it('records explicit authorization without broadening it', () => {
      expect(evidence.authorization).toMatchObject({
        secretRotationAuthorized:
          true,
        activeApiReplacementAuthorized:
          true,
        migrationAuthorized:
          false,
        whatsappConfigurationAuthorized:
          false,
        executorInvocationAuthorized:
          false,
        externalMessageAuthorized:
          false,
      });
    });

    it('records secure secret rotation without secret material', () => {
      expect(evidence.secretRotation).toMatchObject({
        completed:
          true,
        generatedLength:
          64,
        minimumRequiredLength:
          32,
        activeLengthSatisfied:
          true,
        persistedEnvironmentFileMode:
          '600',
        protectedPreRotationBackupCreated:
          true,
        secretValueRecorded:
          false,
        secretHashRecorded:
          false,
        existingJwtSessionsInvalidated:
          true,
      });
    });

    it('binds the active runtime to the accepted image', () => {
      expect(evidence.activeRuntime).toMatchObject({
        containerName:
          'propertyos-api',
        image:
          'propertyos-api:phase15c2c-eb5cb9a2',
        imageId:
          'sha256:7637ff6fd1309678b40f5233342a7b93ba5d857eb6ade9754312c32657c40b71',
        sourceRevision:
          'eb5cb9a20270e380d4031038185351eb4975a05d',
        restartPolicy:
          'unless-stopped',
        running:
          true,
      });
    });

    it('retains a stopped rollback asset', () => {
      expect(evidence.rollbackRuntime).toMatchObject({
        containerName:
          'propertyos-api-phase15c2d-rollback',
        retained:
          true,
        running:
          false,
        restartPolicy:
          'no',
        networkConnected:
          false,
      });
    });

    it('records healthy and protected active endpoints', () => {
      expect(evidence.endpointAcceptance.health).toEqual({
        path:
          '/api/v1/health',
        httpStatus:
          200,
      });

      expect(
        evidence.endpointAcceptance.metrics,
      ).toHaveLength(4);

      for (
        const endpoint of
        evidence.endpointAcceptance.metrics
      ) {
        expect(endpoint.httpStatus).toBe(401);
      }

      expect(
        evidence.endpointAcceptance.processStableAfterMetricsProbes,
      ).toBe(true);
    });

    it('preserves persistent storage volumes', () => {
      expect(evidence.storage).toEqual({
        uploadVolume:
          'backend_propertyos_upload_data',
        pluginVolume:
          'backend_propertyos_plugin_data',
        volumesPreserved:
          true,
      });
    });

    it('preserves source database safety', () => {
      expect(evidence.sourceDatabase).toEqual({
        before:
          '1|37|0',
        after:
          '1|37|0',
        mutated:
          false,
        migrationsApplied:
          false,
      });
    });

    it('preserves external execution prohibitions', () => {
      expect(evidence.externalSafety).toEqual({
        whatsappConfigured:
          false,
        executorExposed:
          false,
        executorInvoked:
          false,
        externalEndpointContacted:
          false,
        externalMessageSent:
          false,
      });
    });

    it('closes only active API replacement', () => {
      expect(evidence.conclusion).toEqual({
        status:
          'ACTIVE_API_REPLACEMENT_ACCEPTED',
        phase15C2DComplete:
          true,
        phase15C2Complete:
          false,
        activeApiAccepted:
          true,
        productionMigrationsAuthorized:
          false,
        controlledPilotAuthorized:
          false,
      });
    });

    it('contains no secret, password, token or channel value', () => {
      expect(raw).not.toMatch(
        /"secretValue"[[:space:]]*:/,
      );

      expect(raw).not.toMatch(
        /"passwordValue"[[:space:]]*:/,
      );

      expect(raw).not.toMatch(
        /"tokenValue"[[:space:]]*:/,
      );

      expect(raw).not.toMatch(
        /"channelValue"[[:space:]]*:/,
      );

      expect(raw).not.toContain(
        'propertyos-dev-secret-change-me',
      );
    });
  },
);
