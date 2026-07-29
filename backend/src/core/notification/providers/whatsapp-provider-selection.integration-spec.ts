import {
  describe,
  expect,
  it,
} from '@jest/globals';
import {
  currentWhatsAppEnvironmentClass,
  resolveWhatsAppProviderSelection,
} from './whatsapp-provider-selection';

describe(
  'Phase 14A WhatsApp provider selection',
  () => {
    it('uses mock by default in development', () => {
      const selection =
        resolveWhatsAppProviderSelection({
          environmentClass:
            'DEVELOPMENT',
        });

      expect(selection.status).toBe('READY');
      expect(selection.mode).toBe('MOCK');
      expect(selection.mockAllowed).toBe(true);
      expect(
        selection.realDeliveryConfigured,
      ).toBe(false);
    });

    it('uses mock by default in tests', () => {
      const selection =
        resolveWhatsAppProviderSelection({
          environmentClass: 'TEST',
        });

      expect(selection.status).toBe('READY');
      expect(selection.mode).toBe('MOCK');
      expect(selection.mockAllowed).toBe(true);
    });

    it('disables WhatsApp by default in production', () => {
      const selection =
        resolveWhatsAppProviderSelection({
          environmentClass:
            'PRODUCTION',
        });

      expect(selection.status).toBe('READY');
      expect(selection.mode).toBe(
        'DISABLED',
      );
      expect(selection.mockAllowed).toBe(
        false,
      );
      expect(
        selection.realDeliveryConfigured,
      ).toBe(false);
    });

    it('forbids explicit mock delivery in production', () => {
      const selection =
        resolveWhatsAppProviderSelection({
          environmentClass:
            'PRODUCTION',
          configuredProvider: 'mock',
        });

      expect(selection.status).toBe(
        'BLOCKED',
      );
      expect(selection.mockAllowed).toBe(
        false,
      );
      expect(selection.errors).toContain(
        'Mock WhatsApp delivery is forbidden in production',
      );
    });

    it('selects webhook delivery in production', () => {
      const selection =
        resolveWhatsAppProviderSelection({
          environmentClass:
            'PRODUCTION',
          configuredProvider: 'webhook',
        });

      expect(selection.status).toBe('READY');
      expect(selection.mode).toBe(
        'WEBHOOK',
      );
      expect(
        selection.realDeliveryConfigured,
      ).toBe(true);
    });

    it('accepts the WPPConnect alias', () => {
      const selection =
        resolveWhatsAppProviderSelection({
          environmentClass:
            'PRODUCTION',
          configuredProvider:
            'wppconnect',
        });

      expect(selection.status).toBe('READY');
      expect(selection.mode).toBe(
        'WEBHOOK',
      );
    });

    it('blocks unknown providers', () => {
      const selection =
        resolveWhatsAppProviderSelection({
          environmentClass:
            'DEVELOPMENT',
          configuredProvider:
            'unknown-provider',
        });

      expect(selection.status).toBe(
        'BLOCKED',
      );
      expect(selection.errors).toContain(
        'Unsupported WhatsApp provider: unknown-provider',
      );
    });

    it('maps Node environments deterministically', () => {
      expect(
        currentWhatsAppEnvironmentClass(
          'production',
        ),
      ).toBe('PRODUCTION');

      expect(
        currentWhatsAppEnvironmentClass(
          'test',
        ),
      ).toBe('TEST');

      expect(
        currentWhatsAppEnvironmentClass(
          'development',
        ),
      ).toBe('DEVELOPMENT');

      expect(
        currentWhatsAppEnvironmentClass(
          undefined,
        ),
      ).toBe('DEVELOPMENT');
    });
    it('selects Meta Cloud delivery in production', () => {
      const selection =
        resolveWhatsAppProviderSelection({
          environmentClass:
            'PRODUCTION',
          configuredProvider:
            'meta-cloud',
        });

      expect(selection.status).toBe(
        'READY',
      );

      expect(selection.mode).toBe(
        'META_CLOUD',
      );

      expect(
        selection.realDeliveryConfigured,
      ).toBe(true);
    });

  },
);
