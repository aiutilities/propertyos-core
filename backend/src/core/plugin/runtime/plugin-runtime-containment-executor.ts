import { createHash } from 'crypto';
import {
  RuntimeContainmentExecutionRequest,
  RuntimeContainmentExecutionRequestSeal,
  sealRuntimeContainmentExecutionRequest,
} from './plugin-runtime-containment-execution-request';

export interface RuntimeContainmentObservation {
  pluginId: string;
  installed: boolean;
  active: boolean;
  isolated: boolean;
  runtimeSnapshotSha256: string;
  unrelatedPluginStateSha256: string;
}

export interface RuntimeContainmentSecurityEvent {
  eventType:
    | 'CONTAINMENT_STARTED'
    | 'RUNTIME_ISOLATED'
    | 'RUNTIME_DEACTIVATED'
    | 'CONTAINMENT_COMPLETED'
    | 'CONTAINMENT_FAILED';
  pluginId: string;
  incidentId: string;
  executionRequestSha256: string;
  actorId: string;
  occurredAt: string;
  detail: string;
}

export interface RuntimeContainmentExecutorPorts {
  inspectRuntime(
    pluginId: string,
  ): Promise<RuntimeContainmentObservation>;

  isolateRuntime(input: {
    pluginId: string;
    incidentId: string;
    actorId: string;
  }): Promise<void>;

  deactivateRuntime(input: {
    pluginId: string;
    incidentId: string;
    actorId: string;
  }): Promise<void>;

  recordSecurityEvent(
    event: RuntimeContainmentSecurityEvent,
  ): Promise<void>;
}

export interface RuntimeContainmentManualInvocation {
  invocationApprovalId: string;
  approvedBy: string;
  operatorId: string;
  authorizedAt: string;
  approvalEvidenceSha256: string;
  explicitInvocationApproval: true;
}

export interface ExecuteRuntimeContainment {
  request: RuntimeContainmentExecutionRequest;
  seal: RuntimeContainmentExecutionRequestSeal;
  manualInvocation:
    RuntimeContainmentManualInvocation;
  executedAt: string;
}

export interface RuntimeContainmentExecutionResult {
  status: 'CONTAINED';
  scope:
    'PHASE_13E_APPROVED_RUNTIME_CONTAINMENT';
  pluginId: string;
  incidentId: string;
  executionRequestSha256: string;
  isolationPerformed: boolean;
  deactivationPerformed: true;
  targetInactiveVerified: true;
  unrelatedPluginStateUnchanged: true;
  automaticContainment: false;
  evidenceSha256: string;
}

const IDENTIFIER_PATTERN =
  /^[a-z0-9][a-z0-9._-]{0,149}$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function validTimestamp(value: string): boolean {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

export function runtimeContainmentInvocationEvidenceSha256(
  seal: RuntimeContainmentExecutionRequestSeal,
  invocation: Omit<
    RuntimeContainmentManualInvocation,
    'approvalEvidenceSha256'
  >,
): string {
  return createHash('sha256')
    .update(
      JSON.stringify({
        approvedBy: invocation.approvedBy,
        authorizedAt: invocation.authorizedAt,
        executionRequestSha256:
          seal.executionRequestSha256,
        invocationApprovalId:
          invocation.invocationApprovalId,
        operatorId: invocation.operatorId,
      }),
      'utf8',
    )
    .digest('hex');
}

export class RuntimeContainmentExecutor {
  constructor(
    private readonly ports:
      RuntimeContainmentExecutorPorts,
  ) {}

  async execute(
    input: ExecuteRuntimeContainment,
  ): Promise<RuntimeContainmentExecutionResult> {
    const recomputedSeal =
      sealRuntimeContainmentExecutionRequest(
        input.request,
      );

    this.assertInvocationAuthorized(
      input,
      recomputedSeal,
    );

    const executionRequestSha256 =
      recomputedSeal.executionRequestSha256!;

    let isolationPerformed = false;

    try {
      const before =
        await this.ports.inspectRuntime(
          input.request.pluginId,
        );

      this.assertBaseline(input, before);

      await this.ports.recordSecurityEvent({
        eventType: 'CONTAINMENT_STARTED',
        pluginId: input.request.pluginId,
        incidentId: input.request.incidentId,
        executionRequestSha256,
        actorId:
          input.manualInvocation.operatorId,
        occurredAt: input.executedAt,
        detail:
          'Approved runtime containment started',
      });

      if (
        input.request.requestedAction ===
        'ISOLATE_AND_DEACTIVATE_AFTER_EXPLICIT_APPROVAL'
      ) {
        await this.ports.isolateRuntime({
          pluginId: input.request.pluginId,
          incidentId: input.request.incidentId,
          actorId:
            input.manualInvocation.operatorId,
        });

        isolationPerformed = true;

        await this.ports.recordSecurityEvent({
          eventType: 'RUNTIME_ISOLATED',
          pluginId: input.request.pluginId,
          incidentId: input.request.incidentId,
          executionRequestSha256,
          actorId:
            input.manualInvocation.operatorId,
          occurredAt: input.executedAt,
          detail:
            'Compromised runtime access isolated',
        });
      }

      await this.ports.deactivateRuntime({
        pluginId: input.request.pluginId,
        incidentId: input.request.incidentId,
        actorId:
          input.manualInvocation.operatorId,
      });

      await this.ports.recordSecurityEvent({
        eventType: 'RUNTIME_DEACTIVATED',
        pluginId: input.request.pluginId,
        incidentId: input.request.incidentId,
        executionRequestSha256,
        actorId:
          input.manualInvocation.operatorId,
        occurredAt: input.executedAt,
        detail:
          'Compromised runtime deactivated',
      });

      const after =
        await this.ports.inspectRuntime(
          input.request.pluginId,
        );

      if (
        after.pluginId !==
          input.request.pluginId ||
        !after.installed ||
        after.active ||
        (
          isolationPerformed &&
          !after.isolated
        )
      ) {
        throw new Error(
          'RUNTIME_CONTAINMENT_FINAL_STATE_INVALID',
        );
      }

      if (
        after.unrelatedPluginStateSha256 !==
        input.request
          .unrelatedPluginBaselineSha256
      ) {
        throw new Error(
          'RUNTIME_CONTAINMENT_UNRELATED_STATE_CHANGED',
        );
      }

      const evidenceSha256 =
        createHash('sha256')
          .update(
            JSON.stringify({
              afterRuntimeSnapshotSha256:
                after.runtimeSnapshotSha256,
              executionRequestSha256,
              incidentId:
                input.request.incidentId,
              isolationPerformed,
              operatorId:
                input.manualInvocation.operatorId,
              pluginId: input.request.pluginId,
              unrelatedPluginStateSha256:
                after.unrelatedPluginStateSha256,
            }),
            'utf8',
          )
          .digest('hex');

      await this.ports.recordSecurityEvent({
        eventType: 'CONTAINMENT_COMPLETED',
        pluginId: input.request.pluginId,
        incidentId: input.request.incidentId,
        executionRequestSha256,
        actorId:
          input.manualInvocation.operatorId,
        occurredAt: input.executedAt,
        detail:
          `Containment evidence ${evidenceSha256}`,
      });

      return {
        status: 'CONTAINED',
        scope:
          'PHASE_13E_APPROVED_RUNTIME_CONTAINMENT',
        pluginId: input.request.pluginId,
        incidentId: input.request.incidentId,
        executionRequestSha256,
        isolationPerformed,
        deactivationPerformed: true,
        targetInactiveVerified: true,
        unrelatedPluginStateUnchanged: true,
        automaticContainment: false,
        evidenceSha256,
      };
    } catch (error) {
      await this.ports.recordSecurityEvent({
        eventType: 'CONTAINMENT_FAILED',
        pluginId: input.request.pluginId,
        incidentId: input.request.incidentId,
        executionRequestSha256,
        actorId:
          input.manualInvocation.operatorId,
        occurredAt: input.executedAt,
        detail:
          isolationPerformed
            ? 'Containment failed after isolation; runtime remains isolated'
            : 'Containment failed before isolation completed',
      });

      throw error;
    }
  }

  private assertInvocationAuthorized(
    input: ExecuteRuntimeContainment,
    recomputedSeal:
      RuntimeContainmentExecutionRequestSeal,
  ): void {
    if (
      recomputedSeal.status !==
        'SEALED_FOR_CONTAINMENT_EXECUTOR_REVIEW' ||
      !recomputedSeal.executionRequestSealed ||
      !recomputedSeal.executionRequestSha256
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_REQUEST_NOT_SEALED',
      );
    }

    if (
      input.seal.status !==
        recomputedSeal.status ||
      input.seal.executionRequestSha256 !==
        recomputedSeal.executionRequestSha256
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_SEAL_MISMATCH',
      );
    }

    const invocation =
      input.manualInvocation;

    for (const identifier of [
      invocation.invocationApprovalId,
      invocation.approvedBy,
      invocation.operatorId,
    ]) {
      if (!IDENTIFIER_PATTERN.test(identifier)) {
        throw new Error(
          'RUNTIME_CONTAINMENT_INVOCATION_IDENTIFIER_INVALID',
        );
      }
    }

    if (
      invocation.approvedBy !==
        input.request.authorizationRequest
          .approvedBy ||
      invocation.operatorId !==
        input.request.authorizationRequest
          .containmentOperatorId ||
      invocation.approvedBy ===
        invocation.operatorId
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_INVOCATION_ACTOR_MISMATCH',
      );
    }

    if (!invocation.explicitInvocationApproval) {
      throw new Error(
        'RUNTIME_CONTAINMENT_INVOCATION_APPROVAL_REQUIRED',
      );
    }

    if (
      !validTimestamp(invocation.authorizedAt) ||
      !validTimestamp(input.executedAt)
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_INVOCATION_TIMESTAMP_INVALID',
      );
    }

    const authorizedAt =
      Date.parse(invocation.authorizedAt);
    const requestedAt =
      Date.parse(input.request.requestedAt);
    const executedAt =
      Date.parse(input.executedAt);
    const expiresAt =
      Date.parse(
        input.request.authorizationRequest
          .authorizationExpiresAt,
      );

    if (
      authorizedAt < requestedAt ||
      authorizedAt > executedAt ||
      executedAt >= expiresAt
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_INVOCATION_EXPIRED',
      );
    }

    const expectedEvidence =
      runtimeContainmentInvocationEvidenceSha256(
        recomputedSeal,
        {
          invocationApprovalId:
            invocation.invocationApprovalId,
          approvedBy: invocation.approvedBy,
          operatorId: invocation.operatorId,
          authorizedAt: invocation.authorizedAt,
          explicitInvocationApproval: true,
        },
      );

    if (
      !SHA256_PATTERN.test(
        invocation.approvalEvidenceSha256,
      ) ||
      invocation.approvalEvidenceSha256 !==
        expectedEvidence
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_INVOCATION_EVIDENCE_MISMATCH',
      );
    }
  }

  private assertBaseline(
    input: ExecuteRuntimeContainment,
    observation: RuntimeContainmentObservation,
  ): void {
    if (
      observation.pluginId !==
        input.request.pluginId ||
      !observation.installed ||
      !observation.active ||
      observation.isolated
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_BASELINE_INVALID',
      );
    }

    if (
      observation.runtimeSnapshotSha256 !==
        input.request.runtimeSnapshotSha256 ||
      observation.unrelatedPluginStateSha256 !==
        input.request
          .unrelatedPluginBaselineSha256
    ) {
      throw new Error(
        'RUNTIME_CONTAINMENT_BASELINE_CHANGED',
      );
    }
  }
}
