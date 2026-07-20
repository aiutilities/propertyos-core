import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  DEFAULT_WHATSAPP_WEBHOOK_TIMEOUT_MS,
  resolveWhatsAppWebhookConfiguration,
} from './whatsapp-webhook-configuration';

describe(
  'Phase 14B1 WhatsApp webhook configuration',
  () => {
    it(
      'accepts a secure production configuration',
      () => {
        const configuration =
          resolveWhatsAppWebhookConfiguration({
            environmentClass:
              'PRODUCTION',
            webhookUrl:
              'https://automation.example.com/propertyos/whatsapp',
            webhookToken:
              'phase-14b-test-token-00000000000000000000',
            timeoutMs: '12000',
          });

        expect(configuration).toMatchObject({
          status: 'READY',
          environmentClass:
            'PRODUCTION',
          webhookUrl:
            'https://automation.example.com/propertyos/whatsapp',
          webhookToken:
            'phase-14b-test-token-00000000000000000000',
          timeoutMs: 12000,
          errors: [],
        });
      },
    );

    it(
      'uses the deterministic default timeout',
      () => {
        const configuration =
          resolveWhatsAppWebhookConfiguration({
            environmentClass:
              'DEVELOPMENT',
            webhookUrl:
              'http://127.0.0.1:5678/webhook/whatsapp',
            webhookToken:
              'development-token-00000000000000000000',
          });

        expect(configuration.status).toBe(
          'READY',
        );
        expect(
          configuration.timeoutMs,
        ).toBe(
          DEFAULT_WHATSAPP_WEBHOOK_TIMEOUT_MS,
        );
      },
    );

    it(
      'requires HTTPS in production',
      () => {
        const configuration =
          resolveWhatsAppWebhookConfiguration({
            environmentClass:
              'PRODUCTION',
            webhookUrl:
              'http://automation.example.com/webhook',
            webhookToken:
              'test-token-00000000000000000000000',
          });

        expect(configuration.status).toBe(
          'BLOCKED',
        );
        expect(configuration.errors).toContain(
          'WhatsApp webhook URL must use HTTPS in production',
        );
      },
    );

    it('requires a webhook URL', () => {
      const configuration =
        resolveWhatsAppWebhookConfiguration({
          environmentClass:
            'PRODUCTION',
          webhookToken: 'test-token-00000000000000000000000',
        });

      expect(configuration.status).toBe(
        'BLOCKED',
      );
      expect(configuration.errors).toContain(
        'WhatsApp webhook URL is required',
      );
    });

    it('requires an authentication token', () => {
      const configuration =
        resolveWhatsAppWebhookConfiguration({
          environmentClass:
            'PRODUCTION',
          webhookUrl:
            'https://automation.example.com/webhook',
        });

      expect(configuration.status).toBe(
        'BLOCKED',
      );
      expect(configuration.errors).toContain(
        'WhatsApp webhook token is required',
      );
    });

    it(
      'rejects an authentication token shorter than 32 characters',
      () => {
        const configuration =
          resolveWhatsAppWebhookConfiguration({
            environmentClass:
              'PRODUCTION',
            webhookUrl:
              'https://automation.example.com/webhook',
            webhookToken: 'too-short',
          });

        expect(configuration.status).toBe(
          'BLOCKED',
        );
        expect(configuration.errors).toContain(
          'WhatsApp webhook token must contain at least 32 characters',
        );
        expect(
          configuration.errors.join(' '),
        ).not.toContain('too-short');
      },
    );

    it(
      'rejects URL-embedded credentials',
      () => {
        const configuration =
          resolveWhatsAppWebhookConfiguration({
            environmentClass:
              'PRODUCTION',
            webhookUrl:
              'https://user:password@automation.example.com/webhook',
            webhookToken: 'test-token-00000000000000000000000',
          });

        expect(configuration.status).toBe(
          'BLOCKED',
        );
        expect(configuration.errors).toContain(
          'WhatsApp webhook URL must not contain credentials',
        );
      },
    );

    it('rejects URL fragments', () => {
      const configuration =
        resolveWhatsAppWebhookConfiguration({
          environmentClass:
            'PRODUCTION',
          webhookUrl:
            'https://automation.example.com/webhook#secret',
          webhookToken: 'test-token-00000000000000000000000',
        });

      expect(configuration.status).toBe(
        'BLOCKED',
      );
      expect(configuration.errors).toContain(
        'WhatsApp webhook URL must not contain a fragment',
      );
    });

    it.each([
      '99',
      '60001',
      '1000.5',
      'not-a-number',
    ])(
      'rejects invalid timeout %s',
      (timeoutMs) => {
        const configuration =
          resolveWhatsAppWebhookConfiguration({
            environmentClass:
              'PRODUCTION',
            webhookUrl:
              'https://automation.example.com/webhook',
            webhookToken:
              'test-token-00000000000000000000000',
            timeoutMs,
          });

        expect(configuration.status).toBe(
          'BLOCKED',
        );
        expect(configuration.errors).toContain(
          'WhatsApp webhook timeout must be an integer between 100 and 60000 milliseconds',
        );
      },
    );

    it(
      'does not disclose the token in validation errors',
      () => {
        const secret =
          'must-never-appear-in-errors';

        const configuration =
          resolveWhatsAppWebhookConfiguration({
            environmentClass:
              'PRODUCTION',
            webhookUrl: 'not-a-url',
            webhookToken: secret,
            timeoutMs: 'invalid',
          });

        expect(
          configuration.errors.join(' '),
        ).not.toContain(secret);
      },
    );
  },
);
