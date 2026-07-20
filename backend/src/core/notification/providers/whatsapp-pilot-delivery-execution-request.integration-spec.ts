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

describe(
  'Phase 14D2 WhatsApp pilot delivery execution request',
  () => {
    function authorizationRequest():
      WhatsAppPilotDeliveryAuthorizationRequest {
      const message =
        'PropertyOS WhatsApp pilot delivery. No action is required.';

      return {
        schemaVersion: 1,
        candidateGitCommit:
          'a5ca29ee971d2e5d5ee8c3cf1a5d6eb4338ed923',
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
      WhatsAppPilotDeliveryExecutionRequest {
      const authorization =
        authorizationRequest();
      const plan =
        buildWhatsAppPilotDeliveryAuthorization(
          authorization,
        );

      if (
        !plan.authorizationEvidenceSha256
      ) {
        throw new Error(
          'TEST_AUTHORIZATION_NOT_READY',
        );
      }

      return {
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
          plan.authorizationEvidenceSha256,
        providerConfigurationEvidenceSha256:
          'd'.repeat(64),
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
        authorizationPlan: plan,
      };
    }

    it(
      'seals one delivery for separate executor review',
      () => {
        const seal =
          sealWhatsAppPilotDeliveryExecutionRequest(
            validRequest(),
          );

        expect(seal).toMatchObject({
          status:
            'SEALED_FOR_PILOT_EXECUTOR_REVIEW',
          executionRequestSealed:
            true,
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
          seal.executionRequestSha256,
        ).toMatch(/^[a-f0-9]{64}$/);
      },
    );

    it(
      'is deterministic for identical evidence',
      () => {
        const request = validRequest();

        const first =
          sealWhatsAppPilotDeliveryExecutionRequest(
            request,
          );
        const second =
          sealWhatsAppPilotDeliveryExecutionRequest(
            request,
          );

        expect(
          first.executionRequestSha256,
        ).toBe(
          second.executionRequestSha256,
        );
      },
    );

    it(
      'recomputes the underlying authorization',
      () => {
        const request = validRequest();
        request.authorizationRequest
          .message += ' altered';

        const seal =
          sealWhatsAppPilotDeliveryExecutionRequest(
            request,
          );

        expect(seal.status).toBe(
          'BLOCKED',
        );
        expect(seal.errors).toContain(
          'Underlying WhatsApp pilot authorization is invalid',
        );
      },
    );

    it(
      'rejects a substituted authorization plan',
      () => {
        const request = validRequest();
        request.authorizationPlan
          .messageSha256 =
          'e'.repeat(64);

        const seal =
          sealWhatsAppPilotDeliveryExecutionRequest(
            request,
          );

        expect(seal.errors).toContain(
          'Submitted WhatsApp pilot authorization plan does not match recomputation',
        );
      },
    );

    it(
      'requires matching authorization evidence',
      () => {
        const request = validRequest();
        request
          .authorizationEvidenceSha256 =
          'f'.repeat(64);

        const seal =
          sealWhatsAppPilotDeliveryExecutionRequest(
            request,
          );

        expect(seal.errors).toContain(
          'WhatsApp pilot authorization evidence digest does not match',
        );
      },
    );

    it(
      'requires the approved actor separation',
      () => {
        const request = validRequest();
        request.executionApproverId =
          request.requestedBy;

        const seal =
          sealWhatsAppPilotDeliveryExecutionRequest(
            request,
          );

        expect(seal.errors).toContain(
          'WhatsApp pilot execution actors do not match the approved separation',
        );
      },
    );

    it(
      'requires separate execution approval evidence',
      () => {
        const request = validRequest();
        request
          .executionApprovalEvidenceSha256 =
          'invalid';
        request
          .executionApprovalConfirmed =
          false;

        const seal =
          sealWhatsAppPilotDeliveryExecutionRequest(
            request,
          );

        expect(seal.status).toBe(
          'BLOCKED',
        );
        expect(
          seal.executionRequestSha256,
        ).toBeNull();
      },
    );

    it.each([
      'approvalEvidenceSha256',
      'consentEvidenceSha256',
    ] as const)(
      'rejects reuse of %s as execution approval evidence',
      (field) => {
        const request = validRequest();

        request
          .executionApprovalEvidenceSha256 =
          request.authorizationRequest[
            field
          ];

        const seal =
          sealWhatsAppPilotDeliveryExecutionRequest(
            request,
          );

        expect(seal.errors).toContain(
          'WhatsApp pilot execution approval evidence must be separate from authorization and consent evidence',
        );
      },
    );

    it.each([
      [
        'endpointIdentityReconfirmed',
        'WhatsApp pilot endpoint identity must be reconfirmed',
      ],
      [
        'recipientConsentReconfirmed',
        'WhatsApp pilot recipient consent must be reconfirmed',
      ],
      [
        'messageContentReconfirmed',
        'WhatsApp pilot message content must be reconfirmed',
      ],
      [
        'deliveryLimitReconfirmed',
        'WhatsApp pilot single-delivery limit must be reconfirmed',
      ],
    ] as const)(
      'requires %s',
      (field, error) => {
        const request = validRequest();
        request[field] = false;

        const seal =
          sealWhatsAppPilotDeliveryExecutionRequest(
            request,
          );

        expect(seal.errors).toContain(
          error,
        );
      },
    );

    it(
      'requires request and approval before the authorization window',
      () => {
        const request = validRequest();
        request.requestedAt =
          '2026-07-20T06:11:00.000Z';
        request.executionApprovedAt =
          '2026-07-20T06:12:00.000Z';

        const seal =
          sealWhatsAppPilotDeliveryExecutionRequest(
            request,
          );

        expect(seal.status).toBe(
          'BLOCKED',
        );
      },
    );

    it(
      'does not expose recipient or message content',
      () => {
        const request = validRequest();

        const serialized =
          JSON.stringify(
            sealWhatsAppPilotDeliveryExecutionRequest(
              request,
            ),
          );

        expect(serialized).not.toContain(
          request.authorizationRequest
            .recipient,
        );
        expect(serialized).not.toContain(
          request.authorizationRequest
            .message,
        );
      },
    );
  },
);
