import {
  createHash,
} from 'node:crypto';
import {
  readFileSync,
} from 'node:fs';
import {
  join,
} from 'node:path';

import {
  describe,
  expect,
  it,
} from '@jest/globals';

interface ProofArtifact {
  path: string;
  sha256: string;
}

interface Phase14D5Proof {
  status: string;
  scope: string;
  candidateCommit: string;
  environment: string;
  networkBoundary: string;
  externalNetworkContacted: boolean;
  liveWhatsAppContacted: boolean;
  applicationWired: boolean;
  databaseMutated: boolean;
  sourceState: string;
  acceptance: {
    governedChainVerified: boolean;
    realLoopbackHttpBoundaryVerified:
      boolean;
    atomicReservationVerified:
      boolean;
    exactlyOnceDeliveryVerified:
      boolean;
    duplicateDeliveryPrevented:
      boolean;
    ambiguousDeliveryReconciliationVerified:
      boolean;
    payloadMinimizationVerified:
      boolean;
    endpointSubstitutionDigestBound:
      boolean;
  };
  validation: {
    testSuitesPassed: number;
    testsPassed: number;
    typecheckPassed: boolean;
    buildPassed: boolean;
  };
  artifacts: ProofArtifact[];
}

function sha256(
  value: Buffer | string,
): string {
  return createHash('sha256')
    .update(value)
    .digest('hex');
}

const repositoryRoot =
  join(process.cwd(), '..');

const proofPath =
  join(
    repositoryRoot,
    'generated/knowledge/phase-14d5-isolated-whatsapp-pilot-executor-proof.json',
  );

const proof =
  JSON.parse(
    readFileSync(
      proofPath,
      'utf8',
    ),
  ) as Phase14D5Proof;

describe(
  'Phase 14D5 isolated WhatsApp pilot executor evidence',
  () => {
    it(
      'records accepted isolated executor status',
      () => {
        expect(proof).toMatchObject({
          status: 'ACCEPTED',
          scope:
            'PHASE_14D5_ISOLATED_WHATSAPP_PILOT_EXECUTOR_ACCEPTANCE',
          candidateCommit:
            'bc0b42a60daed23b51425d5a77f67dde5c73c1a4',
          environment:
            'ISOLATED_LOOPBACK',
          networkBoundary:
            'LOOPBACK_ONLY',
          externalNetworkContacted:
            false,
          liveWhatsAppContacted:
            false,
          applicationWired: false,
          databaseMutated: false,
          sourceState: '1|37|0',
        });
      },
    );

    it(
      'records all required acceptance outcomes',
      () => {
        expect(proof.acceptance).toEqual({
          governedChainVerified:
            true,
          realLoopbackHttpBoundaryVerified:
            true,
          atomicReservationVerified:
            true,
          exactlyOnceDeliveryVerified:
            true,
          duplicateDeliveryPrevented:
            true,
          ambiguousDeliveryReconciliationVerified:
            true,
          payloadMinimizationVerified:
            true,
          endpointSubstitutionDigestBound:
            true,
        });
      },
    );

    it(
      'binds every acceptance artifact by SHA-256',
      () => {
        expect(
          proof.artifacts.length,
        ).toBeGreaterThanOrEqual(5);

        for (
          const artifact of
          proof.artifacts
        ) {
          expect(
            artifact.sha256,
          ).toMatch(/^[a-f0-9]{64}$/);

          const actual =
            sha256(
              readFileSync(
                join(
                  repositoryRoot,
                  artifact.path,
                ),
              ),
            );

          expect(actual).toBe(
            artifact.sha256,
          );
        }
      },
    );

    it(
      'records the complete closure validation',
      () => {
        expect(proof.validation).toEqual({
          testSuitesPassed: 6,
          testsPassed: 61,
          typecheckPassed: true,
          buildPassed: true,
        });
      },
    );

    it(
      'contains no secret-bearing evidence fields or bearer values',
      () => {
        const serialized =
          JSON.stringify(proof);

        expect(serialized).not.toMatch(
          /"(?:webhookToken|authorization|privateKey|password|secret|accessToken|apiKey)"\s*:|Bearer\s+[A-Za-z0-9._~+/-]+/i,
        );
      },
    );
  },
);
