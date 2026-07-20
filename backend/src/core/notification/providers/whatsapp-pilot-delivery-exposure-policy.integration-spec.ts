import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  buildWhatsAppPilotDeliveryAuthorization,
  PHASE_14C_ACCEPTANCE_PROOF_SHA256,
  WhatsAppPilotDeliveryAuthorizationRequest,
  whatsappPilotMessageSha256,
} from './whatsapp-pilot-delivery-authorization';
import {
  sealWhatsAppPilotDeliveryExecutionRequest,
  WhatsAppPilotDeliveryExecutionRequest,
} from './whatsapp-pilot-delivery-execution-request';
import {
  evaluateWhatsAppPilotDeliveryExposure,
  WhatsAppPilotDeliveryExposureRequest,
} from './whatsapp-pilot-delivery-exposure-policy';
import {
  resolveWhatsAppWebhookConfiguration,
  WhatsAppWebhookConfigurationInput,
  whatsappWebhookConfigurationEvidenceSha256,
} from './whatsapp-webhook-configuration';

describe(
  'Phase 14D3B WhatsApp pilot executor exposure policy',
  () => {
    function configurationInput():
      WhatsAppWebhookConfigurationInput {
      return {
        environmentClass:
          'PRODUCTION',
        webhookUrl:
          'https://automation.example.com/propertyos/whatsapp',
        webhookToken:
          'phase-14d3b-test-token-0000000000000',
        timeoutMs: '5000',
      };
    }

    function authorizationRequest():
      WhatsAppPilotDeliveryAuthorizationRequest {
      const message =
        'PropertyOS WhatsApp pilot delivery. No action is required.';

      return {
        schemaVersion: 1,
        candidateGitCommit:
          'ad787b79f622fd62e08a61b7ce927bb5f5b4f09d',
        phase14cAcceptanceProofSha256:
          PHASE_14C_ACCEPTANCE_PROOF_SHA256,
        environmentClass: 'PILOT',
        environmentId:
          'advaiths-nest-pilot',
        endpointUrl:
          'https://automation.example.com/propertyos/whatsapp',
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
        deliveryLimit: 1,
        explicitPilotDeliveryApproval:
          true,
      };
    }

    function validRequest():
      WhatsAppPilotDeliveryExposureRequest {
      const webhookConfiguration =
        configurationInput();

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

      const authorization =
        authorizationRequest();

      const authorizationPlan =
        buildWhatsAppPilotDeliveryAuthorization(
          authorization,
        );

      if (
        !authorizationPlan
          .authorizationEvidenceSha256
      ) {
        throw new Error(
          'TEST_AUTHORIZATION_NOT_READY',
        );
      }

      const executionRequest:
        WhatsAppPilotDeliveryExecutionRequest =
        {
          schemaVersion: 1,
          executionRequestId:
            'execution-14d-001',
          requestedAt:
            '2026-07-20T06:06:00.000Z',
          requestedBy:
            authorization.operatorId,
          executionApproverId:
            authorization.approverId,
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
          authorizationRequest:
            authorization,
          authorizationPlan,
        };

      const executionSeal =
        sealWhatsAppPilotDeliveryExecutionRequest(
          executionRequest,
        );

      return {
        schemaVersion: 1,
        reviewId:
          'exposure-review-14d-001',
        reviewedAt:
          '2026-07-20T06:11:00.000Z',
        reviewedBy:
          authorization.approverId,
        executionOperatorId:
          authorization.operatorId,
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
    }

    it(
      'marks a fully governed request eligible without exposing the executor',
      () => {
        const decision =
          evaluateWhatsAppPilotDeliveryExposure(
            validRequest(),
          );

        expect(decision).toMatchObject({
          status:
            'ELIGIBLE_FOR_EXPLICIT_PILOT_INVOCATION',
          exposureEligible: true,
          executorExposed: false,
          executorInvocationAuthorized:
            false,
          deliveryStarted: false,
          messageSent: false,
          externalNetworkContacted:
            false,
          databaseMutated: false,
          deliveryLimit: 1,
          errors: [],
        });

        expect(
          decision.exposureEvidenceSha256,
        ).toMatch(/^[a-f0-9]{64}$/);
      },
    );

    it(
      'recomputes the execution seal',
      () => {
        const request = validRequest();
        request.executionRequest
          .authorizationRequest.message +=
          ' altered';

        const decision =
          evaluateWhatsAppPilotDeliveryExposure(
            request,
          );

        expect(decision.errors).toContain(
          'WhatsApp pilot execution request is not validly sealed',
        );
      },
    );

    it(
      'rejects a substituted execution seal',
      () => {
        const request = validRequest();
        request.executionSeal
          .executionRequestSha256 =
          'f'.repeat(64);

        const decision =
          evaluateWhatsAppPilotDeliveryExposure(
            request,
          );

        expect(decision.errors).toContain(
          'Submitted WhatsApp pilot execution seal does not match recomputation',
        );
      },
    );

    it(
      'requires production-grade configuration',
      () => {
        const request = validRequest();
        request.webhookConfiguration
          .environmentClass =
          'DEVELOPMENT';

        const decision =
          evaluateWhatsAppPilotDeliveryExposure(
            request,
          );

        expect(decision.errors).toContain(
          'WhatsApp pilot exposure requires production-grade webhook configuration',
        );
      },
    );

    it.each([
      'webhookUrl',
      'webhookToken',
      'timeoutMs',
    ] as const)(
      'blocks changed provider configuration field %s',
      (field) => {
        const request = validRequest();

        request.webhookConfiguration[
          field
        ] =
          field === 'webhookUrl'
            ? 'https://automation.example.com/propertyos/changed'
            : field ===
                  'webhookToken'
              ? 'phase-14d3b-changed-token-00000000000'
              : '6000';

        const decision =
          evaluateWhatsAppPilotDeliveryExposure(
            request,
          );

        expect(decision.status).toBe(
          'BLOCKED',
        );
        expect(decision.errors).toContain(
          'WhatsApp provider configuration changed after execution-request sealing',
        );
      },
    );

    it(
      'requires approved actor separation',
      () => {
        const request = validRequest();
        request.reviewedBy =
          request.executionOperatorId;

        const decision =
          evaluateWhatsAppPilotDeliveryExposure(
            request,
          );

        expect(decision.errors).toContain(
          'WhatsApp pilot exposure actors do not match the approved separation',
        );
      },
    );

    it(
      'requires independent endpoint reachability evidence',
      () => {
        const request = validRequest();
        request
          .endpointReachabilityEvidenceSha256 =
          request.executionRequest
            .providerConfigurationEvidenceSha256;

        const decision =
          evaluateWhatsAppPilotDeliveryExposure(
            request,
          );

        expect(decision.errors).toContain(
          'WhatsApp pilot endpoint reachability evidence must be independently produced',
        );
      },
    );

    it(
      'requires confirmed endpoint reachability',
      () => {
        const request = validRequest();
        request
          .endpointReachabilityConfirmed =
          false;

        const decision =
          evaluateWhatsAppPilotDeliveryExposure(
            request,
          );

        expect(decision.errors).toContain(
          'WhatsApp pilot endpoint reachability must be confirmed',
        );
      },
    );

    it.each([
      '2026-07-20T06:09:59.999Z',
      '2026-07-20T07:10:00.000Z',
    ])(
      'blocks review outside the window at %s',
      (reviewedAt) => {
        const request = validRequest();
        request.reviewedAt =
          reviewedAt;

        const decision =
          evaluateWhatsAppPilotDeliveryExposure(
            request,
          );

        expect(decision.errors).toContain(
          'WhatsApp pilot exposure review is outside the authorization window',
        );
      },
    );

    it(
      'requires explicit exposure approval',
      () => {
        const request = validRequest();
        request
          .explicitExecutorExposureApproval =
          false;

        const decision =
          evaluateWhatsAppPilotDeliveryExposure(
            request,
          );

        expect(decision).toMatchObject({
          status: 'BLOCKED',
          exposureEligible: false,
          executorExposed: false,
          executorInvocationAuthorized:
            false,
          messageSent: false,
          externalNetworkContacted:
            false,
        });

        expect(decision.errors).toContain(
          'Explicit WhatsApp pilot executor exposure approval is required',
        );
      },
    );

    it(
      'does not expose token, recipient, or message content',
      () => {
        const request = validRequest();

        const serialized =
          JSON.stringify(
            evaluateWhatsAppPilotDeliveryExposure(
              request,
            ),
          );

        expect(serialized).not.toContain(
          request.webhookConfiguration
            .webhookToken!,
        );
        expect(serialized).not.toContain(
          request.executionRequest
            .authorizationRequest
            .recipient,
        );
        expect(serialized).not.toContain(
          request.executionRequest
            .authorizationRequest
            .message,
        );
      },
    );
  },
);
