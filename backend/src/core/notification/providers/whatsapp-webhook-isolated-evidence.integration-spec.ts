import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  createHash,
} from 'node:crypto';
import {
  readFileSync,
} from 'node:fs';
import {
  resolve,
} from 'node:path';

interface ProofArtifact {
  path: string;
  sha256: string;
}

interface IsolatedWebhookProof {
  status: 'ACCEPTED';
  scope:
    'PHASE_14C_ISOLATED_WHATSAPP_WEBHOOK_ACCEPTANCE';
  candidateCommit: string;
  environment:
    'ISOLATED_LOOPBACK';
  networkBoundary:
    'LOOPBACK_ONLY';
  externalNetworkContacted: false;
  liveWhatsAppContacted: false;
  databaseMutated: false;
  sourceState: '1|37|0';
  acceptance: {
    realHttpBoundaryExercised: true;
    bearerAuthenticationVerified: true;
    e164NormalizationVerified: true;
    payloadMinimizationVerified: true;
    successAcknowledgementVerified: true;
    remoteRejectionSanitized: true;
    invalidAcknowledgementRejected: true;
  };
  validation: {
    testSuitesPassed: number;
    testsPassed: number;
    typecheckPassed: true;
    buildPassed: true;
  };
  artifacts: ProofArtifact[];
}

function sha256(
  content: Buffer | string,
): string {
  return createHash('sha256')
    .update(content)
    .digest('hex');
}

describe(
  'Phase 14C isolated WhatsApp webhook evidence',
  () => {
    const repositoryRoot = resolve(
      process.cwd(),
      '..',
    );

    const proofPath = resolve(
      repositoryRoot,
      'generated/knowledge/phase-14c-isolated-whatsapp-webhook-proof.json',
    );

    const proof = JSON.parse(
      readFileSync(proofPath, 'utf8'),
    ) as IsolatedWebhookProof;

    it(
      'records accepted isolated-only execution',
      () => {
        expect(proof).toMatchObject({
          status: 'ACCEPTED',
          scope:
            'PHASE_14C_ISOLATED_WHATSAPP_WEBHOOK_ACCEPTANCE',
          candidateCommit:
            '18add27f16e526fd709f91cf3851a7fa071c25ce',
          environment:
            'ISOLATED_LOOPBACK',
          networkBoundary:
            'LOOPBACK_ONLY',
          externalNetworkContacted:
            false,
          liveWhatsAppContacted:
            false,
          databaseMutated: false,
          sourceState: '1|37|0',
        });
      },
    );

    it(
      'records all mandatory acceptance invariants',
      () => {
        expect(proof.acceptance).toEqual({
          realHttpBoundaryExercised:
            true,
          bearerAuthenticationVerified:
            true,
          e164NormalizationVerified:
            true,
          payloadMinimizationVerified:
            true,
          successAcknowledgementVerified:
            true,
          remoteRejectionSanitized:
            true,
          invalidAcknowledgementRejected:
            true,
        });
      },
    );

    it(
      'records successful validation',
      () => {
        expect(proof.validation).toEqual({
          testSuitesPassed: 4,
          testsPassed: 40,
          typecheckPassed: true,
          buildPassed: true,
        });
      },
    );

    it(
      'binds every acceptance artifact by SHA-256',
      () => {
        expect(proof.artifacts.length).toBe(
          5,
        );

        for (const artifact of proof.artifacts) {
          const artifactPath = resolve(
            repositoryRoot,
            artifact.path,
          );

          expect(
            sha256(
              readFileSync(artifactPath),
            ),
          ).toBe(artifact.sha256);
        }
      },
    );

    it(
      'contains no secret-bearing evidence fields',
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
