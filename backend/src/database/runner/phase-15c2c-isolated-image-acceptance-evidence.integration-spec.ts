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
  'Phase 15C2C isolated image acceptance evidence',
  () => {
    const evidencePath = resolve(
      __dirname,
      '../../../../generated/knowledge/phase-15c2c-isolated-image-acceptance-evidence.json',
    );

    const raw = readFileSync(
      evidencePath,
      'utf8',
    );

    const evidence = JSON.parse(raw);

    it('binds the candidate image to the accepted source commit', () => {
      expect(evidence.repository.head).toBe(
        'eb5cb9a20270e380d4031038185351eb4975a05d',
      );

      expect(evidence.candidateImage).toMatchObject({
        tag:
          'propertyos-api:phase15c2c-eb5cb9a2',
        imageId:
          'sha256:7637ff6fd1309678b40f5233342a7b93ba5d857eb6ade9754312c32657c40b71',
        revision:
          'eb5cb9a20270e380d4031038185351eb4975a05d',
        commitBound:
          true,
        retainedLocally:
          true,
      });
    });

    it('records the reproducible Docker correction', () => {
      expect(evidence.reproducibility).toMatchObject({
        initialCleanBuildPassed:
          false,
        correctiveCommit:
          '8001ac110ed4fec5afbc49851bc1a6c109bd30ff',
        cleanBuildAfterCorrection:
          true,
        runtimeCoreContractsResolved:
          true,
      });
    });

    it('records contained telemetry persistence failure', () => {
      expect(evidence.reliability).toMatchObject({
        persistencePolicy:
          'FAIL_OPEN_WITH_IN_MEMORY_RETENTION',
        persistenceFailureLogged:
          true,
        persistenceFailureSanitized:
          true,
        candidateSurvivedPersistenceRejection:
          true,
      });
    });

    it('proves fail-closed production secret validation', () => {
      expect(evidence.startupValidation).toMatchObject({
        productionMode:
          true,
        invalidSecretRejected:
          true,
        invalidSecretNetworkAvailable:
          false,
        minimumSecretLength:
          32,
        secretValueRecorded:
          false,
        secretHashRecorded:
          false,
      });
    });

    it('records healthy and protected runtime endpoints', () => {
      expect(evidence.endpoints.health).toEqual({
        path:
          '/api/v1/health',
        httpStatus:
          200,
      });

      expect(evidence.endpoints.metrics).toHaveLength(4);

      for (
        const endpoint of
        evidence.endpoints.metrics
      ) {
        expect(endpoint.httpStatus).toBe(401);
      }

      expect(evidence.endpoints.metricsPresent).toBe(true);
      expect(evidence.endpoints.metricsProtected).toBe(true);
    });

    it('proves read-only isolated execution and cleanup', () => {
      expect(evidence.isolation).toMatchObject({
        rootFilesystemReadOnly:
          true,
        databaseDefaultTransactionReadOnly:
          true,
        temporaryCandidatesRemoved:
          true,
        existingApiReplaced:
          false,
        existingApiRestarted:
          false,
      });
    });

    it('preserves the source database safety state', () => {
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

    it('preserves external and WhatsApp prohibitions', () => {
      expect(evidence.externalSafety).toEqual({
        whatsappConfigured:
          false,
        executorInvoked:
          false,
        externalEndpointContacted:
          false,
        externalMessageSent:
          false,
      });
    });

    it('retains active-runtime authorization boundaries', () => {
      expect(evidence.authorization).toEqual({
        isolatedImageBuildAuthorized:
          true,
        activeSecretRotationAuthorized:
          false,
        activeRuntimeReplacementAuthorized:
          false,
        migrationAuthorized:
          false,
        liveWhatsappAuthorizationPresent:
          false,
      });
    });

    it('closes only isolated candidate acceptance', () => {
      expect(evidence.conclusion).toEqual({
        status:
          'ISOLATED_CANDIDATE_ACCEPTED',
        phase15C2CComplete:
          true,
        phase15C2Complete:
          false,
        activeRuntimeApproved:
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
