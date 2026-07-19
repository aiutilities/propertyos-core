import {
  mkdtemp,
  mkdir,
  rm,
  writeFile,
} from 'fs/promises';
import {
  tmpdir,
} from 'os';
import {
  join,
} from 'path';
import {
  afterEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  FilePilotOfflineSignatureEvidenceReader,
} from './plugin-pilot-offline-signature-evidence';
import {
  PluginPilotRolloutInput,
} from './plugin-pilot-rollout-plan';

const DIGEST_A = 'a'.repeat(64);
const DIGEST_B = 'b'.repeat(64);
const DIGEST_C = 'c'.repeat(64);
const roots: string[] = [];

function desired():
  PluginPilotRolloutInput {
  return {
    environmentClass: 'ISOLATED',
    environmentId:
      'phase-13d4-isolated',
    pluginId:
      'propertyos.phase13d4-pilot',
    pluginName:
      'PropertyOS Phase 13D4 Pilot',
    version: '1.0.0',
    publisherId: 'propertyos',
    keyId: 'pilot-key-2026',
    keyFingerprintSha256:
      DIGEST_A,
    artifactSha256: DIGEST_B,
    integritySha256: DIGEST_C,
    submitterId: 'pilot-submitter',
    approverId: 'pilot-approver',
    installerId: 'pilot-installer',
    securityOperatorId:
      'pilot-security-operator',
    evidenceTimestamp:
      '2026-07-19T18:30:00.000Z',
    expectedUnrelatedPluginCount: 1,
    runtimeContainmentEnabled: false,
  };
}

function evidence() {
  const input = desired();

  return {
    environmentId:
      input.environmentId,
    pluginId: input.pluginId,
    version: input.version,
    publisherId:
      input.publisherId,
    keyId: input.keyId,
    keyFingerprintSha256:
      input.keyFingerprintSha256,
    artifactSha256:
      input.artifactSha256,
    integritySha256:
      input.integritySha256,
    verifiedAt:
      '2026-07-19T18:29:00.000Z',
    verifierId:
      'offline-verifier-01',
    valid: true,
  };
}

async function locations() {
  const root =
    await mkdtemp(
      join(
        tmpdir(),
        'propertyos-pilot-evidence-',
      ),
    );
  roots.push(root);

  const repository =
    join(root, 'repository');
  const offline =
    join(root, 'offline');

  await mkdir(repository);
  await mkdir(offline);

  return {
    root,
    repository,
    offline,
  };
}

afterEach(async () => {
  await Promise.all(
    roots.splice(0).map(
      (root) =>
        rm(root, {
          recursive: true,
          force: true,
        }),
    ),
  );
});

describe(
  'Phase 13D offline signature evidence reader',
  () => {
    it(
      'accepts matching public evidence outside the repository',
      async () => {
        const {
          repository,
          offline,
        } = await locations();
        const path =
          join(
            offline,
            'signature-evidence.json',
          );

        await writeFile(
          path,
          JSON.stringify(
            evidence(),
          ),
          'utf8',
        );

        const reader =
          new FilePilotOfflineSignatureEvidenceReader(
            path,
            repository,
          );

        await expect(
          reader.read(desired()),
        ).resolves.toEqual(
          evidence(),
        );
      },
    );

    it(
      'rejects evidence stored inside the repository',
      async () => {
        const {
          repository,
        } = await locations();
        const path =
          join(
            repository,
            'signature-evidence.json',
          );

        await writeFile(
          path,
          JSON.stringify(
            evidence(),
          ),
          'utf8',
        );

        const reader =
          new FilePilotOfflineSignatureEvidenceReader(
            path,
            repository,
          );

        await expect(
          reader.read(desired()),
        ).rejects.toThrow(
          'PILOT_OFFLINE_SIGNATURE_EVIDENCE_MUST_BE_OUTSIDE_REPOSITORY',
        );
      },
    );

    it(
      'rejects recursive private-key fields',
      async () => {
        const {
          repository,
          offline,
        } = await locations();
        const path =
          join(
            offline,
            'signature-evidence.json',
          );

        await writeFile(
          path,
          JSON.stringify({
            ...evidence(),
            metadata: {
              privateKey:
                'forbidden',
            },
          }),
          'utf8',
        );

        const reader =
          new FilePilotOfflineSignatureEvidenceReader(
            path,
            repository,
          );

        await expect(
          reader.read(desired()),
        ).rejects.toThrow(
          'PILOT_PRIVATE_KEY_FIELD_FORBIDDEN',
        );
      },
    );

    it(
      'rejects PEM private-key material in any value',
      async () => {
        const {
          repository,
          offline,
        } = await locations();
        const path =
          join(
            offline,
            'signature-evidence.json',
          );

        await writeFile(
          path,
          JSON.stringify({
            ...evidence(),
            note:
              '-----BEGIN PRIVATE KEY-----',
          }),
          'utf8',
        );

        const reader =
          new FilePilotOfflineSignatureEvidenceReader(
            path,
            repository,
          );

        await expect(
          reader.read(desired()),
        ).rejects.toThrow(
          'PILOT_PRIVATE_KEY_MATERIAL_FORBIDDEN',
        );
      },
    );

    it(
      'rejects evidence for a different artifact',
      async () => {
        const {
          repository,
          offline,
        } = await locations();
        const path =
          join(
            offline,
            'signature-evidence.json',
          );

        await writeFile(
          path,
          JSON.stringify({
            ...evidence(),
            artifactSha256:
              DIGEST_A,
          }),
          'utf8',
        );

        const reader =
          new FilePilotOfflineSignatureEvidenceReader(
            path,
            repository,
          );

        await expect(
          reader.read(desired()),
        ).rejects.toThrow(
          'PILOT_OFFLINE_SIGNATURE_EVIDENCE_INPUT_MISMATCH',
        );
      },
    );

    it(
      'rejects malformed JSON',
      async () => {
        const {
          repository,
          offline,
        } = await locations();
        const path =
          join(
            offline,
            'signature-evidence.json',
          );

        await writeFile(
          path,
          '{not-json',
          'utf8',
        );

        const reader =
          new FilePilotOfflineSignatureEvidenceReader(
            path,
            repository,
          );

        await expect(
          reader.read(desired()),
        ).rejects.toThrow(
          'PILOT_OFFLINE_SIGNATURE_EVIDENCE_JSON_INVALID',
        );
      },
    );
  },
);
