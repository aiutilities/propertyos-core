import {
  createHash,
} from 'node:crypto';

import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  NotificationMessage,
} from '../types/notification.types';
import {
  PHASE_14C_ACCEPTANCE_PROOF_SHA256,
} from './whatsapp-pilot-delivery-authorization';
import type {
  WhatsAppWebhookConfiguration,
} from './whatsapp-webhook-configuration';
import type {
  WhatsAppWebhookNotificationProvider,
} from './whatsapp-webhook-notification.provider';
import {
  evaluateWhatsAppPilotIsolatedSubstitution,
  WhatsAppPilotIsolatedSubstitutionAdapter,
  WhatsAppPilotIsolatedSubstitutionRequest,
} from './whatsapp-pilot-isolated-substitution-adapter';

function sha256(
  value: string,
): string {
  return createHash('sha256')
    .update(value, 'utf8')
    .digest('hex');
}

function request():
  WhatsAppPilotIsolatedSubstitutionRequest {
  const authorizedEndpointUrl =
    'https://automation.example.com/propertyos/whatsapp';

  return {
    schemaVersion: 1,
    candidateGitCommit:
      'd92e95976ad35d8cebbd4bc6db881276528a7394',
    phase14cAcceptanceProofSha256:
      PHASE_14C_ACCEPTANCE_PROOF_SHA256,
    executionRequestSha256:
      'c'.repeat(64),
    exposureEvidenceSha256:
      'd'.repeat(64),
    substitutionReviewId:
      'phase-14d5-substitution-review-001',
    reviewedAt:
      '2026-07-20T07:15:00.000Z',
    reviewedBy:
      'phase-14d5-security-reviewer',
    executionOperatorId:
      'phase-14d5-execution-operator',
    authorizedEndpointUrl,
    authorizedEndpointUrlSha256:
      sha256(authorizedEndpointUrl),
    authorizedConfigurationEvidenceSha256:
      'a'.repeat(64),
    isolatedEndpointUrl:
      'http://127.0.0.1:43145/propertyos/whatsapp',
    isolatedEndpointReachabilityEvidenceSha256:
      'b'.repeat(64),
    explicitIsolatedSubstitutionApproval:
      true,
    externalNetworkAllowed: false,
  };
}

function configuration(
  webhookUrl:
    string = request().isolatedEndpointUrl,
): WhatsAppWebhookConfiguration {
  return {
    status: 'READY',
    scope:
      'PROPERTYOS_WHATSAPP_WEBHOOK_CONFIGURATION',
    environmentClass:
      'DEVELOPMENT',
    webhookUrl,
    webhookToken:
      'phase-14d5-isolated-token-000000000000',
    timeoutMs: 2000,
    errors: [],
  };
}

function notification():
  NotificationMessage {
  return {
    id: 'phase-14d5-notification-001',
    channel: 'WHATSAPP',
    recipient: '+919876543210',
    subject: 'Visitor arrival',
    message:
      'Your visitor has arrived at Advaith’s Nest.',
    status: 'PENDING',
    metadata: {},
    createdAt: new Date(
      '2026-07-20T07:16:00.000Z',
    ),
  };
}

function provider(
  webhookUrl?: string,
) {
  return {
    name: 'whatsapp-webhook',
    channel: 'WHATSAPP' as const,
    validateConfiguration:
      jest.fn(
        () =>
          configuration(webhookUrl),
      ),
    send:
      jest.fn(async () => ({
        success: true,
        providerName:
          'whatsapp-webhook',
        providerMessageId:
          'isolated-message-001',
      })),
  };
}

describe(
  'Phase 14D5A isolated WhatsApp endpoint substitution',
  () => {
    it(
      'authorizes an explicitly reviewed loopback substitution',
      () => {
        const decision =
          evaluateWhatsAppPilotIsolatedSubstitution(
            request(),
          );

        expect(decision).toMatchObject({
          status:
            'READY_FOR_ISOLATED_EXECUTOR_EXERCISE',
          substitutionAllowed: true,
          environment:
            'ISOLATED_LOOPBACK',
          networkBoundary:
            'LOOPBACK_ONLY',
          externalNetworkAllowed:
            false,
          liveWhatsAppContacted:
            false,
          applicationWired: false,
          databaseMutated: false,
          errors: [],
        });

        expect(
          decision
            .substitutionEvidenceSha256,
        ).toMatch(/^[a-f0-9]{64}$/);
      },
    );

    it(
      'delegates delivery only after substitution validation',
      async () => {
        const webhook = provider();

        const adapter =
          new WhatsAppPilotIsolatedSubstitutionAdapter(
            webhook as unknown as
              WhatsAppWebhookNotificationProvider,
            request(),
          );

        const result =
          await adapter.send(
            notification(),
          );

        expect(result).toMatchObject({
          success: true,
          providerName:
            'whatsapp-webhook',
          providerMessageId:
            'isolated-message-001',
        });

        expect(
          webhook.send,
        ).toHaveBeenCalledTimes(1);
      },
    );

    it(
      'blocks a non-loopback isolated endpoint',
      () => {
        const invalid = {
          ...request(),
          isolatedEndpointUrl:
            'https://external.example.com/whatsapp',
        };

        const decision =
          evaluateWhatsAppPilotIsolatedSubstitution(
            invalid,
          );

        expect(decision.status).toBe(
          'BLOCKED',
        );
        expect(decision.errors).toContain(
          'Isolated WhatsApp endpoint must use a literal loopback address',
        );
      },
    );

    it(
      'blocks localhost aliases in favor of a literal loopback address',
      () => {
        const invalid = {
          ...request(),
          isolatedEndpointUrl:
            'http://localhost:43145/propertyos/whatsapp',
        };

        const decision =
          evaluateWhatsAppPilotIsolatedSubstitution(
            invalid,
          );

        expect(decision.errors).toContain(
          'Isolated WhatsApp endpoint must use a literal loopback address',
        );
      },
    );

    it(
      'blocks an authorized endpoint digest mismatch',
      () => {
        const invalid = {
          ...request(),
          authorizedEndpointUrlSha256:
            'c'.repeat(64),
        };

        const decision =
          evaluateWhatsAppPilotIsolatedSubstitution(
            invalid,
          );

        expect(decision.errors).toContain(
          'Authorized WhatsApp endpoint digest does not match',
        );
      },
    );

    it(
      'requires separate reviewer and operator identities',
      () => {
        const base = request();

        const decision =
          evaluateWhatsAppPilotIsolatedSubstitution({
            ...base,
            reviewedBy:
              base.executionOperatorId,
          });

        expect(decision.errors).toContain(
          'Isolated substitution reviewer and execution operator must be different',
        );
      },
    );

    it(
      'requires explicit substitution approval',
      () => {
        const decision =
          evaluateWhatsAppPilotIsolatedSubstitution({
            ...request(),
            explicitIsolatedSubstitutionApproval:
              false,
          });

        expect(decision.errors).toContain(
          'Explicit isolated endpoint substitution approval is required',
        );
      },
    );

    it(
      'binds the substitution to the accepted Phase 14C proof',
      () => {
        const decision =
          evaluateWhatsAppPilotIsolatedSubstitution({
            ...request(),
            phase14cAcceptanceProofSha256:
              'e'.repeat(64),
          });

        expect(decision.status).toBe(
          'BLOCKED',
        );
        expect(decision.errors).toContain(
          'Phase 14C isolated acceptance proof does not match',
        );
      },
    );

    it.each([
      [
        'executionRequestSha256',
        'Isolated substitution execution-request evidence is invalid',
      ],
      [
        'exposureEvidenceSha256',
        'Isolated substitution exposure evidence is invalid',
      ],
    ] as const)(
      'requires valid %s binding',
      (field, error) => {
        const decision =
          evaluateWhatsAppPilotIsolatedSubstitution({
            ...request(),
            [field]: 'invalid',
          });

        expect(decision.status).toBe(
          'BLOCKED',
        );
        expect(decision.errors).toContain(
          error,
        );
      },
    );

    it(
      'blocks provider configuration drift before delivery',
      async () => {
        const webhook = provider(
          'http://127.0.0.1:43146/propertyos/whatsapp',
        );

        const adapter =
          new WhatsAppPilotIsolatedSubstitutionAdapter(
            webhook as unknown as
              WhatsAppWebhookNotificationProvider,
            request(),
          );

        const result =
          await adapter.send(
            notification(),
          );

        expect(result).toMatchObject({
          success: false,
          providerName:
            'whatsapp-pilot-isolated-substitution',
          error:
            'WHATSAPP_PILOT_ISOLATED_SUBSTITUTION_BLOCKED',
        });

        expect(
          webhook.send,
        ).not.toHaveBeenCalled();
      },
    );
  },
);
