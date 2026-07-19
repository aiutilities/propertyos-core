import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  PluginPublication,
  PluginPublicationStatus,
} from './plugin-publication-governance.types';
import {
  PluginPilotRolloutExecutor,
  PluginPilotRolloutPorts,
} from './plugin-pilot-rollout-executor';
import {
  buildPluginPilotRolloutPlan,
  PluginPilotRolloutInput,
} from './plugin-pilot-rollout-plan';

const DIGEST_A = 'a'.repeat(64);
const DIGEST_B = 'b'.repeat(64);
const DIGEST_C = 'c'.repeat(64);
const DIGEST_D = 'd'.repeat(64);
const STORAGE_OBJECT_ID =
  '11111111-1111-4111-8111-111111111111';
const PUBLICATION_ID =
  '22222222-2222-4222-8222-222222222222';

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

function publication(
  input: PluginPilotRolloutInput,
  status: PluginPublicationStatus,
): PluginPublication {
  return {
    id: PUBLICATION_ID,
    pluginId: input.pluginId,
    pluginName: input.pluginName,
    version: input.version,
    publisherId: input.publisherId,
    keyId: input.keyId,
    artifactStorageObjectId:
      STORAGE_OBJECT_ID,
    artifactSha256:
      input.artifactSha256,
    integritySha256:
      input.integritySha256,
    status,
    submittedBy:
      input.submitterId,
    submittedAt:
      new Date(
        '2026-07-19T18:31:00.000Z',
      ),
    metadata: {},
    updatedAt:
      new Date(
        '2026-07-19T18:31:00.000Z',
      ),
  };
}

interface FakeOptions {
  provenanceArtifactSha256?: string;
  mutateRuntimeAfterRevocation?:
    boolean;
  mutateUnrelatedState?: boolean;
}

class FakePilotPorts
  implements PluginPilotRolloutPorts {
  readonly calls: string[] = [];
  installed = false;
  publicationStatus:
    PluginPublicationStatus =
      'SUBMITTED';
  runtimeInspectionCount = 0;

  constructor(
    private readonly input:
      PluginPilotRolloutInput,
    private readonly options:
      FakeOptions = {},
  ) {}

  async inspectTrust() {
    this.calls.push('inspectTrust');

    return {
      publisherId:
        this.input.publisherId,
      publisherStatus:
        'ACTIVE' as const,
      keyId: this.input.keyId,
      keyStatus: 'ACTIVE' as const,
      keyFingerprintSha256:
        this.input
          .keyFingerprintSha256,
    };
  }

  async verifyOfflineSignature() {
    this.calls.push(
      'verifyOfflineSignature',
    );

    return {
      valid: true as const,
      publisherId:
        this.input.publisherId,
      keyId: this.input.keyId,
      artifactSha256:
        this.input.artifactSha256,
      integritySha256:
        this.input.integritySha256,
    };
  }

  async admitStoredArtifact(
    request: {
      storageObjectId: string;
      actorId: string;
      metadata:
        Record<string, unknown>;
    },
  ) {
    this.calls.push(
      `admit:${request.actorId}`,
    );
    this.publicationStatus =
      'SUBMITTED';

    return publication(
      this.input,
      'SUBMITTED',
    );
  }

  async transitionPublication(
    request: {
      publicationId: string;
      targetStatus:
        | 'APPROVED'
        | 'QUARANTINED'
        | 'REVOKED';
      actorId: string;
      reason: string;
      metadata:
        Record<string, unknown>;
    },
  ) {
    this.calls.push(
      `transition:${request.targetStatus}:${request.actorId}`,
    );
    this.publicationStatus =
      request.targetStatus;

    return publication(
      this.input,
      request.targetStatus,
    );
  }

  async listMarketplacePublications() {
    this.calls.push(
      `discover:${this.publicationStatus}`,
    );

    return this.publicationStatus ===
      'APPROVED'
      ? [
          {
            publicationId:
              PUBLICATION_ID,
            pluginId:
              this.input.pluginId,
            version:
              this.input.version,
            publisherId:
              this.input.publisherId,
            artifactSha256:
              this.input.artifactSha256,
            integritySha256:
              this.input.integritySha256,
            verified: true as const,
          },
        ]
      : [];
  }

  async installApprovedPublication(
    request: {
      publicationId: string;
      actorId: string;
      autoEnable: true;
      overwrite: false;
      metadata:
        Record<string, unknown>;
    },
  ) {
    this.calls.push(
      `install:${request.actorId}`,
    );
    this.installed = true;

    return {
      installed: true,
    };
  }

  async inspectInstallationProvenance() {
    this.calls.push(
      'inspectProvenance',
    );

    return {
      pluginId:
        this.input.pluginId,
      version:
        this.input.version,
      publicationId:
        PUBLICATION_ID,
      publisherId:
        this.input.publisherId,
      keyId:
        this.input.keyId,
      artifactStorageObjectId:
        STORAGE_OBJECT_ID,
      artifactSha256:
        this.options
          .provenanceArtifactSha256 ??
        this.input.artifactSha256,
      integritySha256:
        this.input.integritySha256,
    };
  }

  async inspectRuntime() {
    this.runtimeInspectionCount += 1;
    this.calls.push(
      `runtime:${this.runtimeInspectionCount}`,
    );

    const finalInspection =
      this.runtimeInspectionCount === 3;

    return {
      pilotInstalled:
        this.installed,
      pilotActive:
        this.installed &&
        !(
          finalInspection &&
          this.options
            .mutateRuntimeAfterRevocation
        ),
      unrelatedPluginCount:
        this.input
          .expectedUnrelatedPluginCount,
      unrelatedStateSha256:
        finalInspection &&
        this.options
          .mutateUnrelatedState
          ? DIGEST_D
          : DIGEST_A,
    };
  }
}

function request(
  input: PluginPilotRolloutInput,
) {
  const plan =
    buildPluginPilotRolloutPlan(
      input,
    );

  if (!plan.evidenceSha256) {
    throw new Error(
      'Expected ready test plan',
    );
  }

  return {
    plan,
    desired: input,
    artifactStorageObjectId:
      STORAGE_OBJECT_ID,
    authorization: {
      approvalId:
        'pilot-approval-001',
      environmentClass:
        input.environmentClass,
      environmentId:
        input.environmentId,
      approvedBy:
        'deployment-approver',
      operatorId:
        input.securityOperatorId,
      approvedAt:
        '2026-07-19T18:32:00.000Z',
      approvedEvidenceSha256:
        plan.evidenceSha256,
      executionAuthorized:
        true as const,
      runtimeContainmentEnabled:
        false as const,
    },
  };
}

describe(
  'Phase 13D pilot rollout executor',
  () => {
    it(
      'executes the governed lifecycle in order',
      async () => {
        const input = desired();
        const ports =
          new FakePilotPorts(input);
        const executor =
          new PluginPilotRolloutExecutor(
            ports,
          );

        const result =
          await executor.execute(
            request(input),
          );

        expect(result).toMatchObject({
          status: 'COMPLETED',
          productionAllowed: false,
          runtimeContainmentTriggered:
            false,
          revocationBoundary:
            'DISTRIBUTION_ONLY',
          publicationId:
            PUBLICATION_ID,
          pluginId: input.pluginId,
          version: input.version,
          finalPublicationStatus:
            'REVOKED',
          approvedDiscoveryVerified:
            true,
          quarantineRemovalVerified:
            true,
          releaseRestorationVerified:
            true,
          provenanceVerified: true,
          runtimeUnchangedAfterRevocation:
            true,
          unrelatedPluginStateUnchanged:
            true,
        });

        expect(
          result.evidenceSha256,
        ).toMatch(/^[a-f0-9]{64}$/);

        expect(ports.calls).toEqual([
          'runtime:1',
          'inspectTrust',
          'verifyOfflineSignature',
          'admit:pilot-submitter',
          'transition:APPROVED:pilot-approver',
          'discover:APPROVED',
          'install:pilot-installer',
          'inspectProvenance',
          'runtime:2',
          'transition:QUARANTINED:pilot-security-operator',
          'discover:QUARANTINED',
          'transition:APPROVED:pilot-approver',
          'discover:APPROVED',
          'transition:REVOKED:pilot-security-operator',
          'discover:REVOKED',
          'runtime:3',
        ]);
      },
    );

    it(
      'is deterministic for identical observations',
      async () => {
        const input = desired();

        const first =
          await new PluginPilotRolloutExecutor(
            new FakePilotPorts(input),
          ).execute(request(input));

        const second =
          await new PluginPilotRolloutExecutor(
            new FakePilotPorts(input),
          ).execute(request(input));

        expect(
          first.evidenceSha256,
        ).toBe(
          second.evidenceSha256,
        );
      },
    );

    it(
      'rejects altered evidence before any port call',
      async () => {
        const input = desired();
        const ports =
          new FakePilotPorts(input);
        const value = request(input);

        value.authorization
          .approvedEvidenceSha256 =
            DIGEST_D;

        await expect(
          new PluginPilotRolloutExecutor(
            ports,
          ).execute(value),
        ).rejects.toThrow(
          'PILOT_ROLLOUT_EVIDENCE_MISMATCH',
        );

        expect(ports.calls).toEqual([]);
      },
    );

    it(
      'requires operator and approver separation before side effects',
      async () => {
        const input = desired();
        const ports =
          new FakePilotPorts(input);
        const value = request(input);

        value.authorization.operatorId =
          value.authorization.approvedBy;

        await expect(
          new PluginPilotRolloutExecutor(
            ports,
          ).execute(value),
        ).rejects.toThrow(
          'PILOT_ROLLOUT_OPERATOR_APPROVER_SEPARATION_REQUIRED',
        );

        expect(ports.calls).toEqual([]);
      },
    );

    it(
      'rejects untrusted installation provenance',
      async () => {
        const input = desired();
        const ports =
          new FakePilotPorts(
            input,
            {
              provenanceArtifactSha256:
                DIGEST_D,
            },
          );

        await expect(
          new PluginPilotRolloutExecutor(
            ports,
          ).execute(
            request(input),
          ),
        ).rejects.toThrow(
          'PILOT_INSTALLATION_PROVENANCE_MISMATCH',
        );
      },
    );

    it(
      'detects runtime containment after distribution revocation',
      async () => {
        const input = desired();
        const ports =
          new FakePilotPorts(
            input,
            {
              mutateRuntimeAfterRevocation:
                true,
            },
          );

        await expect(
          new PluginPilotRolloutExecutor(
            ports,
          ).execute(
            request(input),
          ),
        ).rejects.toThrow(
          'PILOT_RUNTIME_CHANGED_BY_DISTRIBUTION_REVOCATION',
        );
      },
    );

    it(
      'detects unrelated plugin state changes',
      async () => {
        const input = desired();
        const ports =
          new FakePilotPorts(
            input,
            {
              mutateUnrelatedState:
                true,
            },
          );

        await expect(
          new PluginPilotRolloutExecutor(
            ports,
          ).execute(
            request(input),
          ),
        ).rejects.toThrow(
          'PILOT_UNRELATED_PLUGIN_STATE_CHANGED',
        );
      },
    );
  },
);
