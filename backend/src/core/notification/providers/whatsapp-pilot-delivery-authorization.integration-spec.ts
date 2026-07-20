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

describe(
  'Phase 14D1 WhatsApp pilot delivery authorization',
  () => {
    function validRequest():
      WhatsAppPilotDeliveryAuthorizationRequest {
      const message =
        'PropertyOS WhatsApp pilot delivery. No action is required.';

      return {
        schemaVersion: 1,
        candidateGitCommit:
          '01688e078f6494efa202643f1be4565c5d6d427d',
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

    it(
      'authorizes one separately executed pilot delivery',
      () => {
        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            validRequest(),
          );

        expect(plan).toMatchObject({
          status:
            'AUTHORIZED_FOR_SEPARATE_PILOT_EXECUTION',
          authorizationValid: true,
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
          plan.authorizationEvidenceSha256,
        ).toMatch(/^[a-f0-9]{64}$/);
        expect(
          plan.endpointUrlSha256,
        ).toMatch(/^[a-f0-9]{64}$/);
        expect(
          plan.recipientSha256,
        ).toMatch(/^[a-f0-9]{64}$/);
      },
    );

    it(
      'is deterministic for identical evidence',
      () => {
        const request = validRequest();

        const first =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );
        const second =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(
          first.authorizationEvidenceSha256,
        ).toBe(
          second.authorizationEvidenceSha256,
        );
      },
    );

    it(
      'binds the exact message content',
      () => {
        const request = validRequest();
        request.message += ' altered';

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.status).toBe(
          'BLOCKED',
        );
        expect(plan.errors).toContain(
          'WhatsApp pilot message digest does not match its content',
        );
      },
    );

    it(
      'binds the Phase 14C acceptance proof',
      () => {
        const request = validRequest();
        request
          .phase14cAcceptanceProofSha256 =
          'c'.repeat(64);

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.errors).toContain(
          'Phase 14C isolated acceptance proof does not match',
        );
      },
    );

    it(
      'requires international E.164 recipient format',
      () => {
        const request = validRequest();
        request.recipient =
          '9876543210';

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.errors).toContain(
          'WhatsApp pilot recipient must use international E.164 format',
        );
      },
    );

    it(
      'binds the complete canonical endpoint URL',
      () => {
        const firstRequest =
          validRequest();
        const secondRequest =
          validRequest();

        secondRequest.endpointUrl =
          'https://automation.example.com/propertyos/another-path';

        const first =
          buildWhatsAppPilotDeliveryAuthorization(
            firstRequest,
          );
        const second =
          buildWhatsAppPilotDeliveryAuthorization(
            secondRequest,
          );

        expect(
          first.endpointHost,
        ).toBe(second.endpointHost);

        expect(
          first.endpointUrlSha256,
        ).not.toBe(
          second.endpointUrlSha256,
        );

        expect(
          first.authorizationEvidenceSha256,
        ).not.toBe(
          second.authorizationEvidenceSha256,
        );
      },
    );

    it(
      'forbids endpoint query parameters',
      () => {
        const request = validRequest();
        request.endpointUrl =
          'https://automation.example.com/propertyos/whatsapp?token=forbidden';

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.status).toBe(
          'BLOCKED',
        );
        expect(plan.errors).toContain(
          'Pilot WhatsApp endpoint must not contain query parameters',
        );
      },
    );

    it(
      'requires explicit recipient consent evidence',
      () => {
        const request = validRequest();
        request.consentEvidenceId = '';
        request.consentEvidenceSha256 =
          'invalid';

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.status).toBe(
          'BLOCKED',
        );
        expect(
          plan.authorizationEvidenceSha256,
        ).toBeNull();
      },
    );

    it(
      'blocks operator and approver reuse',
      () => {
        const request = validRequest();
        request.approverId =
          request.operatorId;

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.errors).toContain(
          'WhatsApp pilot operator and approver must be different',
        );
      },
    );

    it(
      'requires HTTPS without embedded credentials',
      () => {
        const request = validRequest();
        request.endpointUrl =
          'http://user:password@example.com/webhook';

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.errors).toContain(
          'Pilot WhatsApp endpoint must use HTTPS',
        );
        expect(plan.errors).toContain(
          'Pilot WhatsApp endpoint must not contain credentials',
        );
      },
    );

    it(
      'permits exactly one delivery',
      () => {
        const request = validRequest();

        (
          request as {
            deliveryLimit: number;
          }
        ).deliveryLimit = 2;

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.errors).toContain(
          'WhatsApp pilot authorization permits exactly one delivery',
        );
      },
    );

    it(
      'limits authorization to one hour',
      () => {
        const request = validRequest();
        request.expiresAt =
          '2026-07-20T07:10:00.001Z';

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.errors).toContain(
          'WhatsApp pilot authorization may not exceed one hour',
        );
      },
    );

    it(
      'requires consent before approval',
      () => {
        const request = validRequest();
        request.consentRecordedAt =
          '2026-07-20T06:06:00.000Z';

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.errors).toContain(
          'WhatsApp recipient consent must precede approval',
        );
      },
    );

    it(
      'requires approval before the window',
      () => {
        const request = validRequest();
        request.approvedAt =
          '2026-07-20T06:11:00.000Z';

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.errors).toContain(
          'WhatsApp pilot approval must precede the authorization window',
        );
      },
    );

    it(
      'requires explicit live-delivery approval',
      () => {
        const request = validRequest();
        request
          .explicitPilotDeliveryApproval =
          false;

        const plan =
          buildWhatsAppPilotDeliveryAuthorization(
            request,
          );

        expect(plan.errors).toContain(
          'Explicit WhatsApp pilot delivery approval is required',
        );
        expect(plan).toMatchObject({
          status: 'BLOCKED',
          executorExposed: false,
          deliveryStarted: false,
          messageSent: false,
          externalNetworkContacted:
            false,
        });
      },
    );

    it(
      'does not expose the recipient or message in the plan',
      () => {
        const request = validRequest();

        const serialized =
          JSON.stringify(
            buildWhatsAppPilotDeliveryAuthorization(
              request,
            ),
          );

        expect(serialized).not.toContain(
          request.recipient,
        );
        expect(serialized).not.toContain(
          request.message,
        );
      },
    );
  },
);
