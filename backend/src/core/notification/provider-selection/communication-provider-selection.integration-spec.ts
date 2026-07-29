import {
  describe,
  expect,
  it,
} from '@jest/globals';

import {
  currentCommunicationEnvironmentClass,
  resolveEmailCommunicationProvider,
  resolveSmsCommunicationProvider,
  resolveWhatsAppCommunicationProvider,
} from './index';

describe(
  'PropertyOS communication provider selection',
  () => {
    it(
      'defaults WhatsApp to mock outside production',
      () => {
        expect(
          resolveWhatsAppCommunicationProvider({
            environmentClass:
              'DEVELOPMENT',
          }),
        ).toMatchObject({
          status: 'READY',
          channel:
            'WHATSAPP',
          provider:
            'MOCK',
          enabled: true,
          mockAllowed:
            true,
          realDeliveryConfigured:
            false,
        });
      },
    );

    it(
      'defaults WhatsApp to disabled in production',
      () => {
        expect(
          resolveWhatsAppCommunicationProvider({
            environmentClass:
              'PRODUCTION',
          }),
        ).toMatchObject({
          status: 'READY',
          provider:
            'DISABLED',
          enabled: false,
        });
      },
    );

    it(
      'selects Meta Cloud as real WhatsApp delivery',
      () => {
        expect(
          resolveWhatsAppCommunicationProvider({
            environmentClass:
              'PRODUCTION',
            configuredProvider:
              'meta-cloud',
          }),
        ).toMatchObject({
          status: 'READY',
          provider:
            'META_CLOUD',
          enabled: true,
          realDeliveryConfigured:
            true,
        });
      },
    );

    it(
      'preserves webhook and WPPConnect aliases',
      () => {
        expect(
          resolveWhatsAppCommunicationProvider({
            environmentClass:
              'PRODUCTION',
            configuredProvider:
              'webhook',
          }).provider,
        ).toBe('WEBHOOK');

        expect(
          resolveWhatsAppCommunicationProvider({
            environmentClass:
              'PRODUCTION',
            configuredProvider:
              'wppconnect',
          }).provider,
        ).toBe('WEBHOOK');
      },
    );

    it(
      'forbids production mock WhatsApp',
      () => {
        expect(
          resolveWhatsAppCommunicationProvider({
            environmentClass:
              'PRODUCTION',
            configuredProvider:
              'mock',
          }),
        ).toMatchObject({
          status:
            'BLOCKED',
          mockAllowed:
            false,
        });
      },
    );

    it(
      'defaults email to disabled',
      () => {
        expect(
          resolveEmailCommunicationProvider({
            environmentClass:
              'PRODUCTION',
          }),
        ).toMatchObject({
          status: 'READY',
          channel: 'EMAIL',
          provider:
            'DISABLED',
          enabled: false,
          realDeliveryConfigured:
            false,
        });
      },
    );

    it(
      'selects MailerSend',
      () => {
        expect(
          resolveEmailCommunicationProvider({
            environmentClass:
              'PRODUCTION',
            configuredProvider:
              'mailersend',
          }),
        ).toMatchObject({
          status: 'READY',
          provider:
            'MAILERSEND',
          enabled: true,
          realDeliveryConfigured:
            true,
        });
      },
    );

    it(
      'blocks unsupported providers',
      () => {
        expect(
          resolveWhatsAppCommunicationProvider({
            environmentClass:
              'DEVELOPMENT',
            configuredProvider:
              'unknown',
          }).status,
        ).toBe('BLOCKED');

        expect(
          resolveEmailCommunicationProvider({
            environmentClass:
              'DEVELOPMENT',
            configuredProvider:
              'unknown',
          }).status,
        ).toBe('BLOCKED');
      },
    );

    it(
      'maps Node environments deterministically',
      () => {
        expect(
          currentCommunicationEnvironmentClass(
            'production',
          ),
        ).toBe('PRODUCTION');

        expect(
          currentCommunicationEnvironmentClass(
            'test',
          ),
        ).toBe('TEST');

        expect(
          currentCommunicationEnvironmentClass(
            undefined,
          ),
        ).toBe('DEVELOPMENT');
      },
    );
    it(
      'defaults SMS to disabled',
      () => {
        expect(
          resolveSmsCommunicationProvider({
            environmentClass:
              'PRODUCTION',
          }),
        ).toMatchObject({
          status: 'READY',
          channel: 'SMS',
          provider:
            'DISABLED',
          enabled: false,
          realDeliveryConfigured:
            false,
        });
      },
    );

    it(
      'selects Fast2SMS',
      () => {
        expect(
          resolveSmsCommunicationProvider({
            environmentClass:
              'PRODUCTION',
            configuredProvider:
              'fast2sms',
          }),
        ).toMatchObject({
          status: 'READY',
          provider:
            'FAST2SMS',
          enabled: true,
          realDeliveryConfigured:
            true,
        });
      },
    );

    it(
      'blocks unsupported SMS provider',
      () => {
        expect(
          resolveSmsCommunicationProvider({
            environmentClass:
              'DEVELOPMENT',
            configuredProvider:
              'unknown-sms-provider',
          }).status,
        ).toBe('BLOCKED');
      },
    );

  },
);
