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

interface ClosureArtifact {
  path: string;
  sha256: string;
}

interface Phase14ClosureProof {
  status: string;
  scope: string;
  candidateCommit: string;
  phase14cProofSha256: string;
  phase14d5ProofSha256: string;
  sourceState: string;
  executorExposed: boolean;
  executorInvocationAuthorized:
    boolean;
  explicitLiveAuthorizationPresent:
    boolean;
  liveMessageSent: boolean;
  externalNetworkContacted: boolean;
  databaseMutated: boolean;
  completedMilestones: string[];
  validation: {
    testSuitesPassed: number;
    testsPassed: number;
    typecheckPassed: boolean;
    buildPassed: boolean;
  };
  artifacts: ClosureArtifact[];
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
    'generated/knowledge/phase-14-mvp-pilot-readiness-closure.json',
  );

const proof =
  JSON.parse(
    readFileSync(
      proofPath,
      'utf8',
    ),
  ) as Phase14ClosureProof;

describe(
  'Phase 14 MVP pilot-readiness closure evidence',
  () => {
    it(
      'closes Phase 14 at explicit-live-authorization readiness',
      () => {
        expect(proof).toMatchObject({
          status:
            'READY_FOR_EXPLICIT_LIVE_AUTHORIZATION',
          scope:
            'PHASE_14_MVP_PILOT_READINESS_CLOSURE',
          candidateCommit:
            '360e0df51c4e89652fb15e94032d9ce77092483c',
          phase14cProofSha256:
            '4384b47e0cd51d1a799515d7385179726d12beba03dbe3df2241cc071a3cf31d',
          phase14d5ProofSha256:
            'dc7833b8685e17df14e3b98478f0a75cd579111093494c02a4c0969afaf8e2bb',
          sourceState: '1|37|0',
          executorExposed: false,
          executorInvocationAuthorized:
            false,
          explicitLiveAuthorizationPresent:
            false,
          liveMessageSent: false,
          externalNetworkContacted:
            false,
          databaseMutated: false,
        });
      },
    );

    it(
      'records every Phase 14 milestone',
      () => {
        expect(
          proof.completedMilestones,
        ).toEqual([
          '14A_PROVIDER_SELECTION',
          '14B1_WEBHOOK_CONFIGURATION',
          '14B2_WEBHOOK_PROVIDER',
          '14B3_CONTROLLED_WIRING',
          '14C_ISOLATED_WEBHOOK_ACCEPTANCE',
          '14D1_PILOT_AUTHORIZATION',
          '14D2_EXECUTION_REQUEST_SEAL',
          '14D3A_CONFIGURATION_EVIDENCE',
          '14D3B_EXPOSURE_POLICY',
          '14D4_PILOT_EXECUTOR',
          '14D5A_ISOLATED_SUBSTITUTION',
          '14D5_ISOLATED_EXECUTOR_ACCEPTANCE',
          '14D6_OPERATIONAL_READINESS',
        ]);
      },
    );

    it(
      'records a successful consolidated regression',
      () => {
        expect(
          proof.validation
            .testSuitesPassed,
        ).toBeGreaterThan(0);

        expect(
          proof.validation.testsPassed,
        ).toBeGreaterThan(0);

        expect(
          proof.validation
            .typecheckPassed,
        ).toBe(true);

        expect(
          proof.validation.buildPassed,
        ).toBe(true);
      },
    );

    it(
      'binds all closure artifacts by SHA-256',
      () => {
        expect(
          proof.artifacts.length,
        ).toBeGreaterThanOrEqual(10);

        for (
          const artifact of
          proof.artifacts
        ) {
          expect(
            artifact.sha256,
          ).toMatch(/^[a-f0-9]{64}$/);

          expect(
            sha256(
              readFileSync(
                join(
                  repositoryRoot,
                  artifact.path,
                ),
              ),
            ),
          ).toBe(artifact.sha256);
        }
      },
    );

    it(
      'contains no secret-bearing fields or bearer values',
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
