import { createHash } from 'crypto';
import {
  readFileSync,
} from 'fs';
import {
  resolve,
} from 'path';
import {
  describe,
  expect,
  it,
} from '@jest/globals';

interface ControlEvidence {
  path: string;
  sha256: string;
}

interface Phase13D6Evidence {
  schemaVersion: string;
  scope: string;
  status: string;
  candidateCommit: string;
  candidateTag: string;
  sourceState: string;
  controlledMigrationRange: {
    first: number;
    last: number;
    count: number;
  };
  checkpoints: Record<
    string,
    {
      commit: string;
      tag: string;
      status: string;
    }
  >;
  controls: Record<string, ControlEvidence>;
  safetyState: {
    productionAuthorizationMaterialized: boolean;
    executionRequestMaterialized: boolean;
    liveInvocationAuthorizationPresent: boolean;
    runnerExposed: boolean;
    runnerInvocationAuthorized: boolean;
    executionStarted: boolean;
    databaseMutated: boolean;
  };
  remainingRequirements:
    Record<string, boolean>;
  conclusion: string;
}

const repositoryRoot =
  resolve(__dirname, '../../../..');

const evidencePath = resolve(
  repositoryRoot,
  'generated/knowledge/' +
    'phase-13d6-production-authorization-readiness.json',
);

function loadEvidence(): Phase13D6Evidence {
  return JSON.parse(
    readFileSync(evidencePath, 'utf8'),
  ) as Phase13D6Evidence;
}

function fileSha256(path: string): string {
  return createHash('sha256')
    .update(
      readFileSync(
        resolve(repositoryRoot, path),
      ),
    )
    .digest('hex');
}

describe(
  'Phase 13D6 production authorization readiness evidence',
  () => {
    it('records the expected non-executed readiness state', () => {
      const evidence = loadEvidence();

      expect(evidence.schemaVersion).toBe(
        '1.0.0',
      );
      expect(evidence.scope).toBe(
        'PHASE_13D6_PRODUCTION_AUTHORIZATION_READINESS',
      );
      expect(evidence.status).toBe(
        'READY_FOR_EXPLICIT_LIVE_AUTHORIZATION',
      );
      expect(evidence.sourceState).toBe('1|37|0');
      expect(evidence.controlledMigrationRange)
        .toEqual({
          first: 37,
          last: 48,
          count: 12,
        });
    });

    it('binds all four Phase 13D6 checkpoints', () => {
      const evidence = loadEvidence();

      expect(Object.keys(evidence.checkpoints))
        .toEqual([
          'phase13d6a',
          'phase13d6b',
          'phase13d6c',
          'phase13d6d',
        ]);

      for (
        const checkpoint of
        Object.values(evidence.checkpoints)
      ) {
        expect(checkpoint.status).toBe(
          'COMPLETED',
        );
        expect(checkpoint.commit)
          .toMatch(/^[a-f0-9]{40}$/);
        expect(checkpoint.tag)
          .toMatch(/^v2\.9\.[0-9]+-/);
      }
    });

    it('binds every control to its repository content', () => {
      const evidence = loadEvidence();

      expect(Object.keys(evidence.controls))
        .toEqual([
          'productionAuthorization',
          'operationalRunbook',
          'executionRequestSeal',
          'runnerExposurePolicy',
          'operatorDocumentation',
        ]);

      for (
        const control of
        Object.values(evidence.controls)
      ) {
        expect(control.sha256)
          .toMatch(/^[a-f0-9]{64}$/);
        expect(fileSha256(control.path))
          .toBe(control.sha256);
      }
    });

    it('proves that no production action occurred', () => {
      const safety = loadEvidence().safetyState;

      expect(safety).toEqual({
        productionAuthorizationMaterialized:
          false,
        executionRequestMaterialized: false,
        liveInvocationAuthorizationPresent:
          false,
        runnerExposed: false,
        runnerInvocationAuthorized: false,
        executionStarted: false,
        databaseMutated: false,
      });
    });

    it('keeps every live prerequisite mandatory', () => {
      const requirements =
        loadEvidence().remainingRequirements;

      expect(Object.values(requirements))
        .not.toContain(false);
      expect(
        requirements
          .separateLiveInvocationAuthorizationRequired,
      ).toBe(true);
      expect(
        requirements
          .freshCommitBoundBackupRequired,
      ).toBe(true);
      expect(
        requirements
          .targetDatabaseIdentityLockRequired,
      ).toBe(true);
    });
  },
);
