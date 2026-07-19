import {
  createHash,
} from 'crypto';

export interface PluginPilotRolloutInput {
  environmentClass: 'ISOLATED' | 'STAGING';
  environmentId: string;
  pluginId: string;
  pluginName: string;
  version: string;
  publisherId: 'propertyos';
  keyId: string;
  keyFingerprintSha256: string;
  artifactSha256: string;
  integritySha256: string;
  submitterId: string;
  approverId: string;
  installerId: string;
  securityOperatorId: string;
  evidenceTimestamp: string;
  expectedUnrelatedPluginCount: number;
  runtimeContainmentEnabled: false;
}

export interface PluginPilotRolloutPlan {
  status: 'READY' | 'BLOCKED';
  productionAllowed: false;
  executionAuthorized: false;
  publisherId: 'propertyos';
  revocationBoundary:
    'DISTRIBUTION_ONLY';
  expectedUnrelatedPluginCount: number;
  stages: string[];
  evidenceSha256: string | null;
  errors: string[];
}

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;
const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

export const PILOT_ROLLOUT_STAGES = [
  'VERIFY_TRUST_BOOTSTRAP',
  'VERIFY_OFFLINE_SIGNATURE',
  'ADMIT_STORED_ARTIFACT',
  'SUBMIT_PUBLICATION',
  'APPROVE_WITH_SEPARATE_ACTOR',
  'VERIFY_APPROVED_ONLY_DISCOVERY',
  'INSTALL_APPROVED_PUBLICATION',
  'VERIFY_PERSISTED_PROVENANCE',
  'QUARANTINE_PUBLICATION',
  'VERIFY_DISCOVERY_REMOVAL',
  'RELEASE_QUARANTINE',
  'VERIFY_DISCOVERY_RESTORATION',
  'REVOKE_DISTRIBUTION',
  'VERIFY_RUNTIME_UNCHANGED',
  'VERIFY_UNRELATED_PLUGIN_STATE',
] as const;

export function buildPluginPilotRolloutPlan(
  input: PluginPilotRolloutInput,
): PluginPilotRolloutPlan {
  const errors: string[] = [];

  if (
    input.environmentClass !== 'ISOLATED' &&
    input.environmentClass !== 'STAGING'
  ) {
    errors.push(
      'Production pilot rollout is forbidden',
    );
  }

  const identifiers = [
    input.environmentId,
    input.pluginId,
    input.keyId,
    input.submitterId,
    input.approverId,
    input.installerId,
    input.securityOperatorId,
  ];

  if (
    identifiers.some(
      (value) =>
        !IDENTIFIER_PATTERN.test(value),
    )
  ) {
    errors.push(
      'Pilot rollout identifier is invalid',
    );
  }

  if (!input.pluginName.trim()) {
    errors.push(
      'Pilot plugin name is required',
    );
  }

  if (
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(
      input.version,
    )
  ) {
    errors.push(
      'Pilot plugin version is invalid',
    );
  }

  if (input.publisherId !== 'propertyos') {
    errors.push(
      'Pilot publisher must be propertyos',
    );
  }

  for (
    const [label, digest]
    of [
      [
        'key fingerprint',
        input.keyFingerprintSha256,
      ],
      [
        'artifact',
        input.artifactSha256,
      ],
      [
        'integrity',
        input.integritySha256,
      ],
    ]
  ) {
    if (!SHA256_PATTERN.test(digest)) {
      errors.push(
        `Pilot ${label} SHA-256 is invalid`,
      );
    }
  }

  if (
    input.submitterId ===
    input.approverId
  ) {
    errors.push(
      'Pilot submitter and approver must be different',
    );
  }

  if (
    !Number.isFinite(
      Date.parse(
        input.evidenceTimestamp,
      ),
    )
  ) {
    errors.push(
      'Pilot evidence timestamp is invalid',
    );
  }

  if (
    !Number.isInteger(
      input.expectedUnrelatedPluginCount,
    ) ||
    input.expectedUnrelatedPluginCount < 0
  ) {
    errors.push(
      'Expected unrelated plugin count is invalid',
    );
  }

  if (input.runtimeContainmentEnabled) {
    errors.push(
      'Automatic runtime containment is outside Phase 13D',
    );
  }

  const status =
    errors.length === 0 ? 'READY' : 'BLOCKED';

  const evidenceSha256 =
    status === 'READY'
      ? createHash('sha256')
          .update(
            JSON.stringify({
              approverId:
                input.approverId,
              artifactSha256:
                input.artifactSha256,
              environmentClass:
                input.environmentClass,
              environmentId:
                input.environmentId,
              evidenceTimestamp:
                input.evidenceTimestamp,
              expectedUnrelatedPluginCount:
                input.expectedUnrelatedPluginCount,
              installerId:
                input.installerId,
              integritySha256:
                input.integritySha256,
              keyFingerprintSha256:
                input.keyFingerprintSha256,
              keyId:
                input.keyId,
              pluginId:
                input.pluginId,
              pluginName:
                input.pluginName,
              publisherId:
                input.publisherId,
              revocationBoundary:
                'DISTRIBUTION_ONLY',
              securityOperatorId:
                input.securityOperatorId,
              stages:
                PILOT_ROLLOUT_STAGES,
              submitterId:
                input.submitterId,
              version:
                input.version,
            }),
            'utf8',
          )
          .digest('hex')
      : null;

  return {
    status,
    productionAllowed: false,
    executionAuthorized: false,
    publisherId: 'propertyos',
    revocationBoundary:
      'DISTRIBUTION_ONLY',
    expectedUnrelatedPluginCount:
      input.expectedUnrelatedPluginCount,
    stages: [...PILOT_ROLLOUT_STAGES],
    evidenceSha256,
    errors,
  };
}
