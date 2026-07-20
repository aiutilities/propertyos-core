import {
  mkdtempSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  afterEach,
  describe,
  expect,
  it,
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
  RuntimeContainmentManualInvocation,
  runtimeContainmentInvocationEvidenceSha256,
} from './plugin-runtime-containment-executor';
import {
  IsolatedRuntimeContainmentAdapter,
  IsolatedRuntimeState,
} from './plugin-runtime-containment-isolated-adapter';
import {
  assessRuntimeContainment,
  RuntimeContainmentAssessmentInput,
} from './plugin-runtime-containment-policy';

const roots: string[] = [];

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, {
      recursive: true,
      force: true,
    });
  }
});

describe(
  'Phase 13E isolated runtime containment exercise',
  () => {
    it('proves the full approved containment lifecycle', async () => {
      const root = mkdtempSync(
        join(
          tmpdir(),
          'propertyos-containment-exercise-',
        ),
      );
      roots.push(root);

      const sourceRuntimeRoot =
        join(root, 'source-runtime');
      const isolatedRuntimeRoot =
        join(root, 'isolated-runtime');

      mkdirSync(sourceRuntimeRoot);
      mkdirSync(isolatedRuntimeRoot);

      const adapter =
        new IsolatedRuntimeContainmentAdapter({
          environmentClass: 'ISOLATED',
          environmentId:
            'phase-13e5b-exercise',
          sourceRuntimeRoot,
          isolatedRuntimeRoot,
        });

      const initialState:
        IsolatedRuntimeState = {
        schemaVersion: 1,
        environmentClass: 'ISOLATED',
        environmentId:
          'phase-13e5b-exercise',
        plugins: [
          {
            pluginId:
              'propertyos.visitor',
            installed: true,
            active: true,
            isolated: false,
            version: '1.0.0',
          },
          {
            pluginId:
              'propertyos.helpdesk',
            installed: true,
            active: true,
            isolated: false,
            version: '2.0.0',
          },
        ],
      };

      adapter.initialize(initialState);

      const targetBefore =
        await adapter.inspectRuntime(
          'propertyos.visitor',
        );
      const unrelatedBefore =
        await adapter.inspectRuntime(
          'propertyos.helpdesk',
        );

      const assessmentInput:
        RuntimeContainmentAssessmentInput = {
        pluginId:
          'propertyos.visitor',
        installed: true,
        active: true,
        installationProvenanceMatches:
          true,
        publicationStatus: 'REVOKED',
        publisherStatus: 'ACTIVE',
        signingKeyStatus: 'REVOKED',
        artifactIntegrity: 'MISMATCH',
        runtimeExploitEvidence:
          'CONFIRMED',
        operationalCriticality:
          'CRITICAL',
        automaticContainmentRequested:
          false,
      };

      const assessment =
        assessRuntimeContainment(
          assessmentInput,
        );

      expect(assessment.status).toBe(
        'ASSESSED',
      );
      expect(
        assessment.containmentRecommended,
      ).toBe(true);
      expect(
        assessment.automaticContainmentAllowed,
      ).toBe(false);

      const authorizationRequest:
        RuntimeContainmentAuthorizationRequest = {
        assessmentInput,
        submittedAssessment: assessment,
        incidentId:
          'phase-13e5b-incident',
        incidentEvidenceSha256:
          'a'.repeat(64),
        runtimeSnapshotSha256:
          targetBefore
            .runtimeSnapshotSha256,
        requestedAction:
          'ISOLATE_AND_DEACTIVATE_AFTER_EXPLICIT_APPROVAL',
        requestedBy:
          'security-requester',
        approvedBy:
          'security-approver',
        containmentOperatorId:
          'containment-operator',
        incidentOwnerId:
          'incident-owner',
        recoveryOwnerId:
          'recovery-owner',
        approvalId:
          'phase-13e5b-approval',
        approvedAt:
          '2026-07-20T11:00:00.000Z',
        authorizationExpiresAt:
          '2026-07-20T12:00:00.000Z',
        justification:
          'Isolated exercise confirms approved containment of a compromised runtime.',
        explicitContainmentApproval:
          true,
      };

      const authorizationPlan =
        buildRuntimeContainmentAuthorization(
          authorizationRequest,
        );

      expect(authorizationPlan.status)
        .toBe(
          'AUTHORIZED_FOR_SEPARATE_CONTAINMENT_EXECUTION',
        );

      if (
        !authorizationPlan
          .authorizationEvidenceSha256
      ) {
        throw new Error(
          'Exercise authorization evidence missing',
        );
      }

      const executionRequest:
        RuntimeContainmentExecutionRequest = {
        schemaVersion: 1,
        executionRequestId:
          'phase-13e5b-execution-request',
        requestedAt:
          '2026-07-20T11:10:00.000Z',
        requestedBy:
          authorizationRequest
            .containmentOperatorId,
        pluginId:
          authorizationPlan.pluginId,
        incidentId:
          authorizationPlan.incidentId,
        requestedAction:
          authorizationPlan.requestedAction,
        authorizationEvidenceSha256:
          authorizationPlan
            .authorizationEvidenceSha256,
        incidentEvidenceSha256:
          authorizationRequest
            .incidentEvidenceSha256,
        runtimeSnapshotSha256:
          targetBefore
            .runtimeSnapshotSha256,
        unrelatedPluginBaselineSha256:
          targetBefore
            .unrelatedPluginStateSha256,
        recoveryPlanEvidenceSha256:
          'b'.repeat(64),
        runtimeStateReconfirmed: true,
        authorizationRequest,
        authorizationPlan,
      };

      const seal =
        sealRuntimeContainmentExecutionRequest(
          executionRequest,
        );

      expect(seal.status).toBe(
        'SEALED_FOR_CONTAINMENT_EXECUTOR_REVIEW',
      );

      const manualInvocation:
        RuntimeContainmentManualInvocation = {
        invocationApprovalId:
          'phase-13e5b-invocation',
        approvedBy:
          authorizationRequest.approvedBy,
        operatorId:
          authorizationRequest
            .containmentOperatorId,
        authorizedAt:
          '2026-07-20T11:15:00.000Z',
        approvalEvidenceSha256: '',
        explicitInvocationApproval: true,
      };

      manualInvocation
        .approvalEvidenceSha256 =
        runtimeContainmentInvocationEvidenceSha256(
          seal,
          {
            invocationApprovalId:
              manualInvocation
                .invocationApprovalId,
            approvedBy:
              manualInvocation.approvedBy,
            operatorId:
              manualInvocation.operatorId,
            authorizedAt:
              manualInvocation.authorizedAt,
            explicitInvocationApproval:
              true,
          },
        );

      const executor =
        new RuntimeContainmentExecutor(
          adapter,
        );

      const result =
        await executor.execute({
          request: executionRequest,
          seal,
          manualInvocation,
          executedAt:
            '2026-07-20T11:20:00.000Z',
        });

      const targetAfter =
        await adapter.inspectRuntime(
          'propertyos.visitor',
        );
      const unrelatedAfter =
        await adapter.inspectRuntime(
          'propertyos.helpdesk',
        );
      const events =
        adapter.readAuditEvents();

      expect(result.status).toBe(
        'CONTAINED',
      );
      expect(result.automaticContainment)
        .toBe(false);
      expect(result.isolationPerformed)
        .toBe(true);
      expect(result.deactivationPerformed)
        .toBe(true);
      expect(result.targetInactiveVerified)
        .toBe(true);
      expect(
        result.unrelatedPluginStateUnchanged,
      ).toBe(true);
      expect(result.evidenceSha256)
        .toMatch(/^[a-f0-9]{64}$/);

      expect(targetBefore.active).toBe(true);
      expect(targetBefore.isolated).toBe(
        false,
      );
      expect(targetAfter.active).toBe(false);
      expect(targetAfter.isolated).toBe(true);

      expect(
        unrelatedAfter.runtimeSnapshotSha256,
      ).toBe(
        unrelatedBefore.runtimeSnapshotSha256,
      );
      expect(unrelatedAfter.active).toBe(true);
      expect(unrelatedAfter.isolated).toBe(
        false,
      );

      expect(
        events.map(
          (event) => event.eventType,
        ),
      ).toEqual([
        'CONTAINMENT_STARTED',
        'RUNTIME_ISOLATED',
        'RUNTIME_DEACTIVATED',
        'CONTAINMENT_COMPLETED',
      ]);

      expect(readdirSync(sourceRuntimeRoot))
        .toEqual([]);
    });
  },
);
