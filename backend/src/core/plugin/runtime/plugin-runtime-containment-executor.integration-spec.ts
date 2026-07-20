import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  buildRuntimeContainmentAuthorization,
  RuntimeContainmentAuthorizationRequest,
} from './plugin-runtime-containment-authorization';
import {
  RuntimeContainmentExecutionRequest,
  sealRuntimeContainmentExecutionRequest,
} from './plugin-runtime-containment-execution-request';
import {
  RuntimeContainmentExecutor,
  RuntimeContainmentExecutorPorts,
  RuntimeContainmentManualInvocation,
  RuntimeContainmentObservation,
  RuntimeContainmentSecurityEvent,
  runtimeContainmentInvocationEvidenceSha256,
} from './plugin-runtime-containment-executor';
import {
  assessRuntimeContainment,
  RuntimeContainmentAssessmentInput,
} from './plugin-runtime-containment-policy';

function authorizationRequest():
  RuntimeContainmentAuthorizationRequest {
  const assessmentInput:
    RuntimeContainmentAssessmentInput = {
    pluginId: 'propertyos.visitor',
    installed: true,
    active: true,
    installationProvenanceMatches: true,
    publicationStatus: 'REVOKED',
    publisherStatus: 'ACTIVE',
    signingKeyStatus: 'REVOKED',
    artifactIntegrity: 'MISMATCH',
    runtimeExploitEvidence: 'CONFIRMED',
    operationalCriticality: 'CRITICAL',
    automaticContainmentRequested: false,
  };

  return {
    assessmentInput,
    submittedAssessment:
      assessRuntimeContainment(
        assessmentInput,
      ),
    incidentId:
      'plugin-security-incident-001',
    incidentEvidenceSha256:
      'a'.repeat(64),
    runtimeSnapshotSha256:
      'b'.repeat(64),
    requestedAction:
      'ISOLATE_AND_DEACTIVATE_AFTER_EXPLICIT_APPROVAL',
    requestedBy: 'security-requester',
    approvedBy: 'security-approver',
    containmentOperatorId:
      'containment-operator',
    incidentOwnerId: 'incident-owner',
    recoveryOwnerId: 'recovery-owner',
    approvalId:
      'containment-approval-001',
    approvedAt:
      '2026-07-20T09:00:00.000Z',
    authorizationExpiresAt:
      '2026-07-20T10:00:00.000Z',
    justification:
      'Confirmed artifact mismatch and runtime exploit require coordinated containment.',
    explicitContainmentApproval: true,
  };
}

function executionRequest():
  RuntimeContainmentExecutionRequest {
  const authorization =
    authorizationRequest();
  const plan =
    buildRuntimeContainmentAuthorization(
      authorization,
    );

  if (!plan.authorizationEvidenceSha256) {
    throw new Error('Test authorization failed');
  }

  return {
    schemaVersion: 1,
    executionRequestId:
      'containment-execution-request-001',
    requestedAt:
      '2026-07-20T09:10:00.000Z',
    requestedBy:
      authorization.containmentOperatorId,
    pluginId: plan.pluginId,
    incidentId: plan.incidentId,
    requestedAction: plan.requestedAction,
    authorizationEvidenceSha256:
      plan.authorizationEvidenceSha256,
    incidentEvidenceSha256:
      authorization.incidentEvidenceSha256,
    runtimeSnapshotSha256:
      authorization.runtimeSnapshotSha256,
    unrelatedPluginBaselineSha256:
      'c'.repeat(64),
    recoveryPlanEvidenceSha256:
      'd'.repeat(64),
    runtimeStateReconfirmed: true,
    authorizationRequest: authorization,
    authorizationPlan: plan,
  };
}

function harness(options?: {
  failDeactivate?: boolean;
  changeUnrelatedState?: boolean;
  finalPluginId?: string;
}) {
  const request = executionRequest();
  const seal =
    sealRuntimeContainmentExecutionRequest(
      request,
    );

  let observation:
    RuntimeContainmentObservation = {
    pluginId: request.pluginId,
    installed: true,
    active: true,
    isolated: false,
    runtimeSnapshotSha256:
      request.runtimeSnapshotSha256,
    unrelatedPluginStateSha256:
      request.unrelatedPluginBaselineSha256,
  };

  const events: string[] = [];

  const ports:
    RuntimeContainmentExecutorPorts = {
    inspectRuntime:
      jest.fn(async () => observation),
    isolateRuntime:
      jest.fn(async () => {
        observation = {
          ...observation,
          isolated: true,
        };
      }),
    deactivateRuntime:
      jest.fn(async () => {
        if (options?.failDeactivate) {
          throw new Error(
            'simulated deactivation failure',
          );
        }

        observation = {
          ...observation,
          pluginId:
            options?.finalPluginId ??
            observation.pluginId,
          active: false,
          runtimeSnapshotSha256:
            'e'.repeat(64),
          unrelatedPluginStateSha256:
            options?.changeUnrelatedState
              ? 'f'.repeat(64)
              : observation
                  .unrelatedPluginStateSha256,
        };
      }),
    recordSecurityEvent:
      jest.fn(
        async (
          event:
            RuntimeContainmentSecurityEvent,
        ) => {
          events.push(event.eventType);
        },
      ),
  };

  const invocation:
    RuntimeContainmentManualInvocation = {
    invocationApprovalId:
      'containment-invocation-approval-001',
    approvedBy:
      request.authorizationRequest.approvedBy,
    operatorId:
      request.authorizationRequest
        .containmentOperatorId,
    authorizedAt:
      '2026-07-20T09:15:00.000Z',
    approvalEvidenceSha256: '',
    explicitInvocationApproval: true,
  };

  invocation.approvalEvidenceSha256 =
    runtimeContainmentInvocationEvidenceSha256(
      seal,
      {
        invocationApprovalId:
          invocation.invocationApprovalId,
        approvedBy: invocation.approvedBy,
        operatorId: invocation.operatorId,
        authorizedAt: invocation.authorizedAt,
        explicitInvocationApproval: true,
      },
    );

  return {
    request,
    seal,
    invocation,
    ports,
    events,
    executor:
      new RuntimeContainmentExecutor(ports),
    observation: () => observation,
  };
}

describe(
  'Phase 13E approved runtime containment executor',
  () => {
    it('isolates then deactivates using fake ports', async () => {
      const test = harness();

      const result =
        await test.executor.execute({
          request: test.request,
          seal: test.seal,
          manualInvocation:
            test.invocation,
          executedAt:
            '2026-07-20T09:20:00.000Z',
        });

      expect(result.status).toBe('CONTAINED');
      expect(result.isolationPerformed).toBe(true);
      expect(result.deactivationPerformed).toBe(true);
      expect(result.targetInactiveVerified)
        .toBe(true);
      expect(result.unrelatedPluginStateUnchanged)
        .toBe(true);
      expect(result.automaticContainment)
        .toBe(false);
      expect(test.observation().active).toBe(false);
      expect(test.observation().isolated).toBe(true);
      expect(test.events).toEqual([
        'CONTAINMENT_STARTED',
        'RUNTIME_ISOLATED',
        'RUNTIME_DEACTIVATED',
        'CONTAINMENT_COMPLETED',
      ]);
    });

    it('rejects a tampered execution seal before inspection', async () => {
      const test = harness();

      test.seal.executionRequestSha256 =
        'f'.repeat(64);

      await expect(
        test.executor.execute({
          request: test.request,
          seal: test.seal,
          manualInvocation:
            test.invocation,
          executedAt:
            '2026-07-20T09:20:00.000Z',
        }),
      ).rejects.toThrow(
        'RUNTIME_CONTAINMENT_SEAL_MISMATCH',
      );

      expect(test.ports.inspectRuntime)
        .not.toHaveBeenCalled();
    });

    it('rejects invocation evidence tampering', async () => {
      const test = harness();

      test.invocation.approvalEvidenceSha256 =
        'f'.repeat(64);

      await expect(
        test.executor.execute({
          request: test.request,
          seal: test.seal,
          manualInvocation:
            test.invocation,
          executedAt:
            '2026-07-20T09:20:00.000Z',
        }),
      ).rejects.toThrow(
        'RUNTIME_CONTAINMENT_INVOCATION_EVIDENCE_MISMATCH',
      );
    });

    it('rejects operator substitution', async () => {
      const test = harness();
      test.invocation.operatorId =
        'different-operator';

      await expect(
        test.executor.execute({
          request: test.request,
          seal: test.seal,
          manualInvocation:
            test.invocation,
          executedAt:
            '2026-07-20T09:20:00.000Z',
        }),
      ).rejects.toThrow(
        'RUNTIME_CONTAINMENT_INVOCATION_ACTOR_MISMATCH',
      );
    });

    it('rejects invocation approval before the sealed request', async () => {
      const test = harness();

      test.invocation.authorizedAt =
        '2026-07-20T09:05:00.000Z';

      test.invocation.approvalEvidenceSha256 =
        runtimeContainmentInvocationEvidenceSha256(
          test.seal,
          {
            invocationApprovalId:
              test.invocation
                .invocationApprovalId,
            approvedBy:
              test.invocation.approvedBy,
            operatorId:
              test.invocation.operatorId,
            authorizedAt:
              test.invocation.authorizedAt,
            explicitInvocationApproval: true,
          },
        );

      await expect(
        test.executor.execute({
          request: test.request,
          seal: test.seal,
          manualInvocation:
            test.invocation,
          executedAt:
            '2026-07-20T09:20:00.000Z',
        }),
      ).rejects.toThrow(
        'RUNTIME_CONTAINMENT_INVOCATION_EXPIRED',
      );

      expect(test.ports.inspectRuntime)
        .not.toHaveBeenCalled();
    });

    it('rejects expired invocation', async () => {
      const test = harness();

      await expect(
        test.executor.execute({
          request: test.request,
          seal: test.seal,
          manualInvocation:
            test.invocation,
          executedAt:
            '2026-07-20T10:00:00.000Z',
        }),
      ).rejects.toThrow(
        'RUNTIME_CONTAINMENT_INVOCATION_EXPIRED',
      );
    });

    it('rejects changed runtime baseline before action', async () => {
      const test = harness();

      (
        test.ports.inspectRuntime as
          jest.MockedFunction<
            RuntimeContainmentExecutorPorts[
              'inspectRuntime'
            ]
          >
      ).mockResolvedValueOnce({
        ...test.observation(),
        runtimeSnapshotSha256:
          'f'.repeat(64),
      });

      await expect(
        test.executor.execute({
          request: test.request,
          seal: test.seal,
          manualInvocation:
            test.invocation,
          executedAt:
            '2026-07-20T09:20:00.000Z',
        }),
      ).rejects.toThrow(
        'RUNTIME_CONTAINMENT_BASELINE_CHANGED',
      );

      expect(test.ports.isolateRuntime)
        .not.toHaveBeenCalled();
    });

    it('keeps runtime isolated when deactivation fails', async () => {
      const test = harness({
        failDeactivate: true,
      });

      await expect(
        test.executor.execute({
          request: test.request,
          seal: test.seal,
          manualInvocation:
            test.invocation,
          executedAt:
            '2026-07-20T09:20:00.000Z',
        }),
      ).rejects.toThrow(
        'simulated deactivation failure',
      );

      expect(test.observation().isolated).toBe(true);
      expect(test.observation().active).toBe(true);
      expect(test.events).toContain(
        'CONTAINMENT_FAILED',
      );
    });

    it('rejects a final observation for another plugin', async () => {
      const test = harness({
        finalPluginId: 'propertyos.unrelated',
      });

      await expect(
        test.executor.execute({
          request: test.request,
          seal: test.seal,
          manualInvocation:
            test.invocation,
          executedAt:
            '2026-07-20T09:20:00.000Z',
        }),
      ).rejects.toThrow(
        'RUNTIME_CONTAINMENT_FINAL_STATE_INVALID',
      );

      expect(test.events).toContain(
        'CONTAINMENT_FAILED',
      );
    });

    it('detects unrelated plugin state change', async () => {
      const test = harness({
        changeUnrelatedState: true,
      });

      await expect(
        test.executor.execute({
          request: test.request,
          seal: test.seal,
          manualInvocation:
            test.invocation,
          executedAt:
            '2026-07-20T09:20:00.000Z',
        }),
      ).rejects.toThrow(
        'RUNTIME_CONTAINMENT_UNRELATED_STATE_CHANGED',
      );

      expect(test.events).toContain(
        'CONTAINMENT_FAILED',
      );
    });
  },
);
