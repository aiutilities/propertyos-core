import {
  createHash,
} from 'crypto';
import {
  PluginPilotRolloutInput,
  PluginPilotRolloutPlan,
} from './plugin-pilot-rollout-plan';
import {
  PluginPublication,
  PluginPublicationStatus,
} from './plugin-publication-governance.types';

const SHA256_PATTERN =
  /^[a-f0-9]{64}$/;

export interface PilotRolloutAuthorization {
  approvalId: string;
  environmentClass:
    'ISOLATED' | 'STAGING';
  environmentId: string;
  approvedBy: string;
  operatorId: string;
  approvedAt: string;
  approvedEvidenceSha256: string;
  executionAuthorized: true;
  runtimeContainmentEnabled: false;
}

export interface PilotRuntimeSnapshot {
  pilotInstalled: boolean;
  pilotActive: boolean;
  unrelatedPluginCount: number;
  unrelatedStateSha256: string;
}

export interface PilotInstallationObservation {
  pluginId: string;
  version: string;
  publicationId: string;
  publisherId: string;
  keyId: string;
  artifactStorageObjectId: string;
  artifactSha256: string;
  integritySha256: string;
}

export interface PilotTrustObservation {
  publisherId: string;
  publisherStatus: 'ACTIVE';
  keyId: string;
  keyStatus: 'ACTIVE';
  keyFingerprintSha256: string;
}

export interface PilotSignatureObservation {
  valid: true;
  publisherId: string;
  keyId: string;
  artifactSha256: string;
  integritySha256: string;
}

export interface PluginPilotRolloutPorts {
  inspectTrust(
    input: PluginPilotRolloutInput,
  ): Promise<PilotTrustObservation>;

  verifyOfflineSignature(
    input: PluginPilotRolloutInput,
  ): Promise<PilotSignatureObservation>;

  admitStoredArtifact(input: {
    storageObjectId: string;
    actorId: string;
    metadata: Record<string, unknown>;
  }): Promise<PluginPublication>;

  transitionPublication(input: {
    publicationId: string;
    targetStatus:
      | 'APPROVED'
      | 'QUARANTINED'
      | 'REVOKED';
    actorId: string;
    reason: string;
    metadata: Record<string, unknown>;
  }): Promise<PluginPublication>;

  listApprovedPublications():
    Promise<PluginPublication[]>;

  installApprovedPublication(input: {
    publicationId: string;
    actorId: string;
    autoEnable: true;
    overwrite: false;
    metadata: Record<string, unknown>;
  }): Promise<unknown>;

  inspectInstallationProvenance(
    pluginId: string,
  ): Promise<PilotInstallationObservation>;

  inspectRuntime(
    pluginId: string,
  ): Promise<PilotRuntimeSnapshot>;
}

export interface ExecutePluginPilotRollout {
  plan: PluginPilotRolloutPlan;
  desired: PluginPilotRolloutInput;
  authorization:
    PilotRolloutAuthorization;
  artifactStorageObjectId: string;
}

export interface PluginPilotRolloutExecutionResult {
  status: 'COMPLETED';
  scope:
    'PHASE_13D_PILOT_PUBLICATION_LIFECYCLE';
  productionAllowed: false;
  runtimeContainmentTriggered: false;
  revocationBoundary:
    'DISTRIBUTION_ONLY';
  approvalId: string;
  publicationId: string;
  pluginId: string;
  version: string;
  finalPublicationStatus:
    'REVOKED';
  approvedDiscoveryVerified: true;
  quarantineRemovalVerified: true;
  releaseRestorationVerified: true;
  provenanceVerified: true;
  runtimeUnchangedAfterRevocation: true;
  unrelatedPluginStateUnchanged: true;
  evidenceSha256: string;
}

export class PluginPilotRolloutExecutor {
  constructor(
    private readonly ports:
      PluginPilotRolloutPorts,
  ) {}

  async execute(
    request: ExecutePluginPilotRollout,
  ): Promise<
    PluginPilotRolloutExecutionResult
  > {
    this.assertAuthorized(request);

    const {
      desired,
      authorization,
    } = request;

    const initialRuntime =
      await this.ports.inspectRuntime(
        desired.pluginId,
      );

    this.assertRuntimeBaseline(
      initialRuntime,
      desired,
    );

    const trust =
      await this.ports.inspectTrust(
        desired,
      );

    this.assertTrust(
      trust,
      desired,
    );

    const signature =
      await this.ports
        .verifyOfflineSignature(
          desired,
        );

    this.assertSignature(
      signature,
      desired,
    );

    const publication =
      await this.ports
        .admitStoredArtifact({
          storageObjectId:
            request
              .artifactStorageObjectId,
          actorId:
            desired.submitterId,
          metadata:
            this.metadata(
              request,
              'ADMIT_STORED_ARTIFACT',
            ),
        });

    this.assertPublication(
      publication,
      desired,
      request.artifactStorageObjectId,
      'SUBMITTED',
    );

    const approved =
      await this.transition(
        publication.id,
        'APPROVED',
        desired.approverId,
        'Phase 13D pilot approval',
        request,
      );

    this.assertPublication(
      approved,
      desired,
      request.artifactStorageObjectId,
      'APPROVED',
    );

    await this.assertDiscovery(
      publication.id,
      true,
    );

    await this.ports
      .installApprovedPublication({
        publicationId:
          publication.id,
        actorId:
          desired.installerId,
        autoEnable: true,
        overwrite: false,
        metadata:
          this.metadata(
            request,
            'INSTALL_APPROVED_PUBLICATION',
          ),
      });

    const provenance =
      await this.ports
        .inspectInstallationProvenance(
          desired.pluginId,
        );

    this.assertProvenance(
      provenance,
      desired,
      publication.id,
      request.artifactStorageObjectId,
    );

    const installedRuntime =
      await this.ports.inspectRuntime(
        desired.pluginId,
      );

    if (
      !installedRuntime.pilotInstalled ||
      !installedRuntime.pilotActive
    ) {
      throw new Error(
        'PILOT_RUNTIME_NOT_ACTIVE_AFTER_INSTALL',
      );
    }

    this.assertUnrelatedState(
      initialRuntime,
      installedRuntime,
      desired,
    );

    const quarantined =
      await this.transition(
        publication.id,
        'QUARANTINED',
        desired.securityOperatorId,
        'Phase 13D pilot quarantine',
        request,
      );

    this.assertStatus(
      quarantined,
      'QUARANTINED',
    );

    await this.assertDiscovery(
      publication.id,
      false,
    );

    const released =
      await this.transition(
        publication.id,
        'APPROVED',
        desired.approverId,
        'Phase 13D pilot quarantine release',
        request,
      );

    this.assertStatus(
      released,
      'APPROVED',
    );

    await this.assertDiscovery(
      publication.id,
      true,
    );

    const revoked =
      await this.transition(
        publication.id,
        'REVOKED',
        desired.securityOperatorId,
        'Phase 13D pilot distribution revocation',
        request,
      );

    this.assertStatus(
      revoked,
      'REVOKED',
    );

    await this.assertDiscovery(
      publication.id,
      false,
    );

    const finalRuntime =
      await this.ports.inspectRuntime(
        desired.pluginId,
      );

    if (
      finalRuntime.pilotInstalled !==
        installedRuntime.pilotInstalled ||
      finalRuntime.pilotActive !==
        installedRuntime.pilotActive
    ) {
      throw new Error(
        'PILOT_RUNTIME_CHANGED_BY_DISTRIBUTION_REVOCATION',
      );
    }

    this.assertUnrelatedState(
      initialRuntime,
      finalRuntime,
      desired,
    );

    const evidenceSha256 =
      createHash('sha256')
        .update(
          JSON.stringify({
            approvalId:
              authorization.approvalId,
            approvedEvidenceSha256:
              authorization
                .approvedEvidenceSha256,
            environmentClass:
              authorization
                .environmentClass,
            environmentId:
              authorization
                .environmentId,
            finalPublicationStatus:
              'REVOKED',
            pluginId:
              desired.pluginId,
            publicationId:
              publication.id,
            revocationBoundary:
              'DISTRIBUTION_ONLY',
            runtimeContainmentTriggered:
              false,
            unrelatedStateSha256:
              finalRuntime
                .unrelatedStateSha256,
            version:
              desired.version,
          }),
          'utf8',
        )
        .digest('hex');

    return {
      status: 'COMPLETED',
      scope:
        'PHASE_13D_PILOT_PUBLICATION_LIFECYCLE',
      productionAllowed: false,
      runtimeContainmentTriggered:
        false,
      revocationBoundary:
        'DISTRIBUTION_ONLY',
      approvalId:
        authorization.approvalId,
      publicationId:
        publication.id,
      pluginId:
        desired.pluginId,
      version:
        desired.version,
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
      evidenceSha256,
    };
  }

  private assertAuthorized(
    request: ExecutePluginPilotRollout,
  ): void {
    const {
      plan,
      desired,
      authorization,
      artifactStorageObjectId,
    } = request;

    if (
      plan.status !== 'READY' ||
      plan.executionAuthorized ||
      !plan.evidenceSha256
    ) {
      throw new Error(
        'PILOT_ROLLOUT_PLAN_NOT_READY',
      );
    }

    if (
      authorization
        .executionAuthorized !== true
    ) {
      throw new Error(
        'PILOT_ROLLOUT_EXPLICIT_AUTHORIZATION_REQUIRED',
      );
    }

    if (
      authorization.environmentClass !==
        desired.environmentClass ||
      authorization.environmentId !==
        desired.environmentId
    ) {
      throw new Error(
        'PILOT_ROLLOUT_ENVIRONMENT_MISMATCH',
      );
    }

    if (
      authorization
        .environmentClass !==
          'ISOLATED' &&
      authorization
        .environmentClass !==
          'STAGING'
    ) {
      throw new Error(
        'PILOT_ROLLOUT_PRODUCTION_FORBIDDEN',
      );
    }

    if (
      authorization.operatorId ===
        authorization.approvedBy
    ) {
      throw new Error(
        'PILOT_ROLLOUT_OPERATOR_APPROVER_SEPARATION_REQUIRED',
      );
    }

    if (
      authorization.operatorId !==
        desired.securityOperatorId
    ) {
      throw new Error(
        'PILOT_ROLLOUT_OPERATOR_MISMATCH',
      );
    }

    if (
      authorization
        .runtimeContainmentEnabled ||
      desired.runtimeContainmentEnabled
    ) {
      throw new Error(
        'PILOT_RUNTIME_CONTAINMENT_FORBIDDEN',
      );
    }

    if (
      authorization
        .approvedEvidenceSha256 !==
          plan.evidenceSha256
    ) {
      throw new Error(
        'PILOT_ROLLOUT_EVIDENCE_MISMATCH',
      );
    }

    if (
      !SHA256_PATTERN.test(
        authorization
          .approvedEvidenceSha256,
      ) ||
      !Number.isFinite(
        Date.parse(
          authorization.approvedAt,
        ),
      )
    ) {
      throw new Error(
        'PILOT_ROLLOUT_AUTHORIZATION_INVALID',
      );
    }

    if (
      !/^[a-f0-9-]{36}$/i.test(
        artifactStorageObjectId,
      )
    ) {
      throw new Error(
        'PILOT_ARTIFACT_STORAGE_OBJECT_ID_INVALID',
      );
    }
  }

  private assertRuntimeBaseline(
    runtime: PilotRuntimeSnapshot,
    desired: PluginPilotRolloutInput,
  ): void {
    if (
      runtime.pilotInstalled ||
      runtime.pilotActive
    ) {
      throw new Error(
        'PILOT_PLUGIN_ALREADY_PRESENT',
      );
    }

    if (
      runtime.unrelatedPluginCount !==
        desired
          .expectedUnrelatedPluginCount ||
      !SHA256_PATTERN.test(
        runtime.unrelatedStateSha256,
      )
    ) {
      throw new Error(
        'PILOT_UNRELATED_PLUGIN_BASELINE_MISMATCH',
      );
    }
  }

  private assertTrust(
    trust: PilotTrustObservation,
    desired: PluginPilotRolloutInput,
  ): void {
    if (
      trust.publisherId !==
        desired.publisherId ||
      trust.publisherStatus !==
        'ACTIVE' ||
      trust.keyId !==
        desired.keyId ||
      trust.keyStatus !==
        'ACTIVE' ||
      trust.keyFingerprintSha256 !==
        desired
          .keyFingerprintSha256
    ) {
      throw new Error(
        'PILOT_TRUST_BOOTSTRAP_MISMATCH',
      );
    }
  }

  private assertSignature(
    signature:
      PilotSignatureObservation,
    desired: PluginPilotRolloutInput,
  ): void {
    if (
      signature.valid !== true ||
      signature.publisherId !==
        desired.publisherId ||
      signature.keyId !==
        desired.keyId ||
      signature.artifactSha256 !==
        desired.artifactSha256 ||
      signature.integritySha256 !==
        desired.integritySha256
    ) {
      throw new Error(
        'PILOT_OFFLINE_SIGNATURE_MISMATCH',
      );
    }
  }

  private assertPublication(
    publication: PluginPublication,
    desired: PluginPilotRolloutInput,
    storageObjectId: string,
    status: PluginPublicationStatus,
  ): void {
    if (
      publication.pluginId !==
        desired.pluginId ||
      publication.pluginName !==
        desired.pluginName ||
      publication.version !==
        desired.version ||
      publication.publisherId !==
        desired.publisherId ||
      publication.keyId !==
        desired.keyId ||
      publication
        .artifactStorageObjectId !==
          storageObjectId ||
      publication.artifactSha256 !==
        desired.artifactSha256 ||
      publication.integritySha256 !==
        desired.integritySha256 ||
      publication.status !== status ||
      publication.submittedBy !==
        desired.submitterId
    ) {
      throw new Error(
        'PILOT_PUBLICATION_IDENTITY_MISMATCH',
      );
    }
  }

  private assertProvenance(
    provenance:
      PilotInstallationObservation,
    desired: PluginPilotRolloutInput,
    publicationId: string,
    storageObjectId: string,
  ): void {
    if (
      provenance.pluginId !==
        desired.pluginId ||
      provenance.version !==
        desired.version ||
      provenance.publicationId !==
        publicationId ||
      provenance.publisherId !==
        desired.publisherId ||
      provenance.keyId !==
        desired.keyId ||
      provenance
        .artifactStorageObjectId !==
          storageObjectId ||
      provenance.artifactSha256 !==
        desired.artifactSha256 ||
      provenance.integritySha256 !==
        desired.integritySha256
    ) {
      throw new Error(
        'PILOT_INSTALLATION_PROVENANCE_MISMATCH',
      );
    }
  }

  private assertUnrelatedState(
    initial: PilotRuntimeSnapshot,
    current: PilotRuntimeSnapshot,
    desired: PluginPilotRolloutInput,
  ): void {
    if (
      current.unrelatedPluginCount !==
        desired
          .expectedUnrelatedPluginCount ||
      current.unrelatedPluginCount !==
        initial.unrelatedPluginCount ||
      current.unrelatedStateSha256 !==
        initial.unrelatedStateSha256
    ) {
      throw new Error(
        'PILOT_UNRELATED_PLUGIN_STATE_CHANGED',
      );
    }
  }

  private async assertDiscovery(
    publicationId: string,
    expected: boolean,
  ): Promise<void> {
    const approved =
      await this.ports
        .listApprovedPublications();

    const discovered =
      approved.some(
        (publication) =>
          publication.id ===
          publicationId,
      );

    if (discovered !== expected) {
      throw new Error(
        expected
          ? 'PILOT_PUBLICATION_NOT_DISCOVERABLE'
          : 'PILOT_PUBLICATION_STILL_DISCOVERABLE',
      );
    }
  }

  private async transition(
    publicationId: string,
    targetStatus:
      | 'APPROVED'
      | 'QUARANTINED'
      | 'REVOKED',
    actorId: string,
    reason: string,
    request: ExecutePluginPilotRollout,
  ): Promise<PluginPublication> {
    return await this.ports
      .transitionPublication({
        publicationId,
        targetStatus,
        actorId,
        reason,
        metadata:
          this.metadata(
            request,
            targetStatus,
          ),
      });
  }

  private assertStatus(
    publication: PluginPublication,
    expected: PluginPublicationStatus,
  ): void {
    if (
      publication.status !==
        expected
    ) {
      throw new Error(
        `PILOT_PUBLICATION_STATUS_MISMATCH:${expected}`,
      );
    }
  }

  private metadata(
    request: ExecutePluginPilotRollout,
    stage: string,
  ): Record<string, unknown> {
    return {
      phase: '13D4',
      pilot: true,
      stage,
      approvalId:
        request.authorization.approvalId,
      planEvidenceSha256:
        request.plan.evidenceSha256,
      environmentClass:
        request.authorization
          .environmentClass,
      environmentId:
        request.authorization
          .environmentId,
    };
  }
}
