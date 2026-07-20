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

interface ContainmentProof {
  schemaVersion: string;
  scope: string;
  status: string;
  candidateCommit: string;
  candidateTag: string;
  environmentClass: string;
  sourceState: string;
  applicationWired: boolean;
  sourceRuntimeChanged: boolean;
  databaseMutated: boolean;
  automaticContainment: boolean;
  exercise: {
    policyAssessed: boolean;
    explicitAuthorizationVerified:
      boolean;
    executionRequestSealed: boolean;
    manualInvocationEvidenceVerified:
      boolean;
    runtimeIsolated: boolean;
    runtimeDeactivated: boolean;
    targetInactiveVerified: boolean;
    unrelatedPluginStateUnchanged:
      boolean;
    sourceRuntimeRootUnchanged: boolean;
    auditEventOrder: string[];
  };
  controls:
    Record<string, ControlEvidence>;
  conclusion: string;
}

const repositoryRoot =
  resolve(__dirname, '../../../../..');

const proofPath = resolve(
  repositoryRoot,
  'generated/knowledge/' +
    'phase-13e5b-isolated-runtime-containment-proof.json',
);

function loadProof(): ContainmentProof {
  return JSON.parse(
    readFileSync(proofPath, 'utf8'),
  ) as ContainmentProof;
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
  'Phase 13E5B isolated containment evidence',
  () => {
    it('records accepted isolated execution only', () => {
      const proof = loadProof();

      expect(proof.schemaVersion).toBe(
        '1.0.0',
      );
      expect(proof.scope).toBe(
        'PHASE_13E5B_ISOLATED_RUNTIME_CONTAINMENT',
      );
      expect(proof.status).toBe('ACCEPTED');
      expect(proof.environmentClass).toBe(
        'ISOLATED',
      );
      expect(proof.sourceState).toBe('1|37|0');
    });

    it('binds the reviewed candidate checkpoint', () => {
      const proof = loadProof();

      expect(proof.candidateCommit).toBe(
        '53209f73e3af628ace929712367de7cd9bff8356',
      );
      expect(proof.candidateTag).toBe(
        'v2.9.68-phase-13e5a-isolated-containment-adapter',
      );
    });

    it('recomputes every control checksum', () => {
      const controls =
        loadProof().controls;

      expect(Object.keys(controls)).toEqual([
        'policy',
        'authorization',
        'executionRequest',
        'executor',
        'isolatedAdapter',
        'isolatedExercise',
      ]);

      for (
        const control of
        Object.values(controls)
      ) {
        expect(control.sha256)
          .toMatch(/^[a-f0-9]{64}$/);
        expect(fileSha256(control.path))
          .toBe(control.sha256);
      }
    });

    it('proves the complete approved containment flow', () => {
      const exercise =
        loadProof().exercise;

      expect(exercise).toEqual({
        policyAssessed: true,
        explicitAuthorizationVerified:
          true,
        executionRequestSealed: true,
        manualInvocationEvidenceVerified:
          true,
        runtimeIsolated: true,
        runtimeDeactivated: true,
        targetInactiveVerified: true,
        unrelatedPluginStateUnchanged:
          true,
        sourceRuntimeRootUnchanged: true,
        auditEventOrder: [
          'CONTAINMENT_STARTED',
          'RUNTIME_ISOLATED',
          'RUNTIME_DEACTIVATED',
          'CONTAINMENT_COMPLETED',
        ],
      });
    });

    it('proves source and application safety', () => {
      const proof = loadProof();

      expect(proof.applicationWired).toBe(
        false,
      );
      expect(proof.sourceRuntimeChanged)
        .toBe(false);
      expect(proof.databaseMutated).toBe(
        false,
      );
      expect(proof.automaticContainment)
        .toBe(false);
    });
  },
);
