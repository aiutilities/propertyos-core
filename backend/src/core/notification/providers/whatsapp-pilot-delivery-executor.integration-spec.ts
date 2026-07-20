import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  buildWhatsAppPilotDeliveryAuthorization,
  PHASE_14C_ACCEPTANCE_PROOF_SHA256,
  whatsappPilotMessageSha256,
} from './whatsapp-pilot-delivery-authorization';
import {
  sealWhatsAppPilotDeliveryExecutionRequest,
} from './whatsapp-pilot-delivery-execution-request';
import {
  evaluateWhatsAppPilotDeliveryExposure,
} from './whatsapp-pilot-delivery-exposure-policy';
import {
  WhatsAppPilotDeliveryExecutor,
  WhatsAppPilotDeliveryExecutorPorts,
  WhatsAppPilotDeliveryManualInvocation,
  WhatsAppPilotDeliverySecurityEvent,
  whatsappPilotInvocationEvidenceSha256,
} from './whatsapp-pilot-delivery-executor';
import {
  resolveWhatsAppWebhookConfiguration,
  whatsappWebhookConfigurationEvidenceSha256,
} from './whatsapp-webhook-configuration';

function harness(options?: {
  reservation?:
    | 'RESERVED'
    | 'ALREADY_COMPLETED'
    | 'CONFLICT';
  deliverySuccess?: boolean;
  deliveryThrows?: boolean;
  completionFails?: boolean;
}) {
  const message =
    'PropertyOS WhatsApp pilot delivery. No action is required.';

  const webhookConfiguration = {
    environmentClass:
      'PRODUCTION' as const,
    webhookUrl:
      'https://automation.example.com/propertyos/whatsapp',
    webhookToken:
      'phase-14d4-test-token-00000000000000',
    timeoutMs: '5000',
  };

  const configurationEvidence =
    whatsappWebhookConfigurationEvidenceSha256(
      resolveWhatsAppWebhookConfiguration(
        webhookConfiguration,
      ),
    );

  if (!configurationEvidence) {
    throw new Error(
      'TEST_CONFIGURATION_NOT_READY',
    );
  }

  const authorizationRequest = {
    schemaVersion: 1 as const,
    candidateGitCommit:
      'c26ae07e752d2447519bb21ebb6c13eaaaaea03a',
    phase14cAcceptanceProofSha256:
      PHASE_14C_ACCEPTANCE_PROOF_SHA256,
    environmentClass:
      'PILOT' as const,
    environmentId:
      'advaiths-nest-pilot',
    endpointUrl:
      webhookConfiguration.webhookUrl,
    recipient:
      '+919876543210',
    message,
    messageSha256:
      whatsappPilotMessageSha256(
        message,
      ),
    consentEvidenceId:
      'consent-2026-07-20-001',
    consentEvidenceSha256:
      'a'.repeat(64),
    consentRecordedAt:
      '2026-07-20T06:00:00.000Z',
    operatorId:
      'operator.anand',
    approverId:
      'approver.pilot',
    approvalId:
      'approval-14d-001',
    approvalEvidenceSha256:
      'b'.repeat(64),
    approvedAt:
      '2026-07-20T06:05:00.000Z',
    validFrom:
      '2026-07-20T06:10:00.000Z',
    expiresAt:
      '2026-07-20T07:10:00.000Z',
    deliveryLimit: 1 as const,
    explicitPilotDeliveryApproval:
      true,
  };

  const authorizationPlan =
    buildWhatsAppPilotDeliveryAuthorization(
      authorizationRequest,
    );

  if (
    !authorizationPlan
      .authorizationEvidenceSha256
  ) {
    throw new Error(
      'TEST_AUTHORIZATION_NOT_READY',
    );
  }

  const executionRequest = {
    schemaVersion: 1 as const,
    executionRequestId:
      'execution-14d-001',
    requestedAt:
      '2026-07-20T06:06:00.000Z',
    requestedBy:
      authorizationRequest.operatorId,
    executionApproverId:
      authorizationRequest.approverId,
    executionApprovalId:
      'execution-approval-14d-001',
    executionApprovedAt:
      '2026-07-20T06:07:00.000Z',
    executionApprovalEvidenceSha256:
      'c'.repeat(64),
    executionApprovalConfirmed:
      true,
    authorizationEvidenceSha256:
      authorizationPlan
        .authorizationEvidenceSha256,
    providerConfigurationEvidenceSha256:
      configurationEvidence,
    endpointIdentityReconfirmed:
      true,
    recipientConsentReconfirmed:
      true,
    messageContentReconfirmed:
      true,
    deliveryLimitReconfirmed:
      true,
    authorizationRequest,
    authorizationPlan,
  };

  const executionSeal =
    sealWhatsAppPilotDeliveryExecutionRequest(
      executionRequest,
    );

  const exposureRequest = {
    schemaVersion: 1 as const,
    reviewId:
      'exposure-review-14d-001',
    reviewedAt:
      '2026-07-20T06:11:00.000Z',
    reviewedBy:
      authorizationRequest.approverId,
    executionOperatorId:
      authorizationRequest.operatorId,
    endpointReachabilityEvidenceSha256:
      'e'.repeat(64),
    endpointReachabilityConfirmed:
      true,
    explicitExecutorExposureApproval:
      true,
    webhookConfiguration,
    executionRequest,
    executionSeal,
  };

  const exposureDecision =
    evaluateWhatsAppPilotDeliveryExposure(
      exposureRequest,
    );

  const invocation:
    WhatsAppPilotDeliveryManualInvocation =
    {
      invocationApprovalId:
        'invocation-approval-14d-001',
      approvedBy:
        exposureRequest.reviewedBy,
      operatorId:
        exposureRequest
          .executionOperatorId,
      authorizedAt:
        '2026-07-20T06:12:00.000Z',
      approvalEvidenceSha256: '',
      explicitInvocationApproval:
        true,
    };

  invocation.approvalEvidenceSha256 =
    whatsappPilotInvocationEvidenceSha256(
      exposureDecision,
      {
        invocationApprovalId:
          invocation
            .invocationApprovalId,
        approvedBy:
          invocation.approvedBy,
        operatorId:
          invocation.operatorId,
        authorizedAt:
          invocation.authorizedAt,
        explicitInvocationApproval:
          true,
      },
    );

  const events: string[] = [];

  const ports:
    WhatsAppPilotDeliveryExecutorPorts =
    {
      reserveDelivery:
        jest.fn(async () =>
          options?.reservation ??
          'RESERVED',
        ),
      deliver:
        jest.fn(async () => {
          if (options?.deliveryThrows) {
            throw new Error(
              'secret-provider-exception',
            );
          }

          return {
          success:
            options?.deliverySuccess ??
            true,
          providerName:
            'fake-whatsapp',
          providerMessageId:
            options?.deliverySuccess ===
            false
              ? undefined
              : 'fake-message-001',
          error:
            options?.deliverySuccess ===
            false
              ? 'simulated failure'
              : undefined,
          };
        }),
      completeDelivery:
        jest.fn(async () => {
          if (options?.completionFails) {
            throw new Error(
              'secret-persistence-failure',
            );
          }
        }),
      failDelivery:
        jest.fn(async () => undefined),
      recordAmbiguousDelivery:
        jest.fn(async () => undefined),
      recordSecurityEvent:
        jest.fn(
          async (
            event:
              WhatsAppPilotDeliverySecurityEvent,
          ) => {
            events.push(
              event.eventType,
            );
          },
        ),
    };

  return {
    exposureRequest,
    exposureDecision,
    invocation,
    ports,
    events,
    executor:
      new WhatsAppPilotDeliveryExecutor(
        ports,
      ),
  };
}

describe(
  'Phase 14D4 approved WhatsApp pilot delivery executor',
  () => {
    it(
      'delivers exactly once through fake ports',
      async () => {
        const test = harness();

        const result =
          await test.executor.execute({
            exposureRequest:
              test.exposureRequest,
            exposureDecision:
              test.exposureDecision,
            manualInvocation:
              test.invocation,
            executedAt:
              '2026-07-20T06:13:00.000Z',
          });

        expect(result).toMatchObject({
          status: 'DELIVERED',
          deliveryCount: 1,
          automaticDelivery: false,
          messageSent: true,
          databaseMutated: false,
        });

        expect(
          test.ports.deliver,
        ).toHaveBeenCalledTimes(1);
        expect(
          test.ports.completeDelivery,
        ).toHaveBeenCalledTimes(1);
        expect(
          test.ports.failDelivery,
        ).not.toHaveBeenCalled();

        expect(test.events).toEqual([
          'PILOT_DELIVERY_STARTED',
          'PILOT_DELIVERY_COMPLETED',
        ]);
      },
    );

    it.each([
      [
        'ALREADY_COMPLETED',
        'WHATSAPP_PILOT_DELIVERY_ALREADY_COMPLETED',
      ],
      [
        'CONFLICT',
        'WHATSAPP_PILOT_DELIVERY_RESERVATION_CONFLICT',
      ],
    ] as const)(
      'blocks reservation state %s before delivery',
      async (reservation, error) => {
        const test = harness({
          reservation,
        });

        await expect(
          test.executor.execute({
            exposureRequest:
              test.exposureRequest,
            exposureDecision:
              test.exposureDecision,
            manualInvocation:
              test.invocation,
            executedAt:
              '2026-07-20T06:13:00.000Z',
          }),
        ).rejects.toThrow(error);

        expect(
          test.ports.deliver,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects changed exposure evidence before reservation',
      async () => {
        const test = harness();

        test.exposureDecision
          .exposureEvidenceSha256 =
          'f'.repeat(64);

        await expect(
          test.executor.execute({
            exposureRequest:
              test.exposureRequest,
            exposureDecision:
              test.exposureDecision,
            manualInvocation:
              test.invocation,
            executedAt:
              '2026-07-20T06:13:00.000Z',
          }),
        ).rejects.toThrow(
          'WHATSAPP_PILOT_EXPOSURE_DECISION_MISMATCH',
        );

        expect(
          test.ports.reserveDelivery,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects invocation evidence tampering',
      async () => {
        const test = harness();

        test.invocation
          .approvalEvidenceSha256 =
          'f'.repeat(64);

        await expect(
          test.executor.execute({
            exposureRequest:
              test.exposureRequest,
            exposureDecision:
              test.exposureDecision,
            manualInvocation:
              test.invocation,
            executedAt:
              '2026-07-20T06:13:00.000Z',
          }),
        ).rejects.toThrow(
          'WHATSAPP_PILOT_INVOCATION_EVIDENCE_MISMATCH',
        );

        expect(
          test.ports.reserveDelivery,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'rejects operator substitution',
      async () => {
        const test = harness();

        test.invocation.operatorId =
          'different-operator';

        await expect(
          test.executor.execute({
            exposureRequest:
              test.exposureRequest,
            exposureDecision:
              test.exposureDecision,
            manualInvocation:
              test.invocation,
            executedAt:
              '2026-07-20T06:13:00.000Z',
          }),
        ).rejects.toThrow(
          'WHATSAPP_PILOT_INVOCATION_ACTOR_MISMATCH',
        );
      },
    );

    it(
      'rejects expired invocation',
      async () => {
        const test = harness();

        await expect(
          test.executor.execute({
            exposureRequest:
              test.exposureRequest,
            exposureDecision:
              test.exposureDecision,
            manualInvocation:
              test.invocation,
            executedAt:
              '2026-07-20T07:10:00.000Z',
          }),
        ).rejects.toThrow(
          'WHATSAPP_PILOT_INVOCATION_EXPIRED',
        );

        expect(
          test.ports.reserveDelivery,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'records failure without completing delivery',
      async () => {
        const test = harness({
          deliverySuccess: false,
        });

        await expect(
          test.executor.execute({
            exposureRequest:
              test.exposureRequest,
            exposureDecision:
              test.exposureDecision,
            manualInvocation:
              test.invocation,
            executedAt:
              '2026-07-20T06:13:00.000Z',
          }),
        ).rejects.toThrow(
          'WHATSAPP_PILOT_PROVIDER_DELIVERY_FAILED',
        );

        expect(
          test.ports.failDelivery,
        ).toHaveBeenCalledTimes(1);
        expect(
          test.ports.completeDelivery,
        ).not.toHaveBeenCalled();
        expect(test.events).toEqual([
          'PILOT_DELIVERY_STARTED',
          'PILOT_DELIVERY_FAILED',
        ]);
      },
    );

    it(
      'sanitizes provider exceptions before recording failure',
      async () => {
        const test = harness({
          deliveryThrows: true,
        });

        await expect(
          test.executor.execute({
            exposureRequest:
              test.exposureRequest,
            exposureDecision:
              test.exposureDecision,
            manualInvocation:
              test.invocation,
            executedAt:
              '2026-07-20T06:13:00.000Z',
          }),
        ).rejects.toThrow(
          'WHATSAPP_PILOT_PROVIDER_EXCEPTION',
        );

        expect(
          test.ports.failDelivery,
        ).toHaveBeenCalledWith(
          expect.objectContaining({
            failureCode:
              'WHATSAPP_PILOT_PROVIDER_EXCEPTION',
          }),
        );

        expect(
          JSON.stringify(
            (
              test.ports.failDelivery as
                jest.Mock
            ).mock.calls,
          ),
        ).not.toContain(
          'secret-provider-exception',
        );
      },
    );

    it(
      'requires reconciliation when provider confirmation cannot be persisted',
      async () => {
        const test = harness({
          completionFails: true,
        });

        await expect(
          test.executor.execute({
            exposureRequest:
              test.exposureRequest,
            exposureDecision:
              test.exposureDecision,
            manualInvocation:
              test.invocation,
            executedAt:
              '2026-07-20T06:13:00.000Z',
          }),
        ).rejects.toThrow(
          'WHATSAPP_PILOT_DELIVERY_COMPLETION_UNCONFIRMED',
        );

        expect(
          test.ports.deliver,
        ).toHaveBeenCalledTimes(1);
        expect(
          test.ports
            .recordAmbiguousDelivery,
        ).toHaveBeenCalledTimes(1);
        expect(
          test.ports.failDelivery,
        ).not.toHaveBeenCalled();

        expect(test.events).toEqual([
          'PILOT_DELIVERY_STARTED',
          'PILOT_DELIVERY_RECONCILIATION_REQUIRED',
        ]);
      },
    );

    it(
      'does not expose recipient, message, or provider message ID in result',
      async () => {
        const test = harness();

        const result =
          await test.executor.execute({
            exposureRequest:
              test.exposureRequest,
            exposureDecision:
              test.exposureDecision,
            manualInvocation:
              test.invocation,
            executedAt:
              '2026-07-20T06:13:00.000Z',
          });

        const serialized =
          JSON.stringify(result);

        expect(serialized).not.toContain(
          test.exposureRequest
            .executionRequest
            .authorizationRequest
            .recipient,
        );
        expect(serialized).not.toContain(
          test.exposureRequest
            .executionRequest
            .authorizationRequest
            .message,
        );
        expect(serialized).not.toContain(
          'fake-message-001',
        );
      },
    );
  },
);
