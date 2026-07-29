import {
  afterEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import type { WhatsAppWebhookConfiguration } from '../providers/whatsapp-webhook-configuration';

import { NotificationDispatcherService } from './notification-dispatcher.service';

describe(
  'Phase 14A notification dispatcher provider selection',
  () => {
    const originalNodeEnvironment =
      process.env.NODE_ENV;
    const originalWhatsAppProvider =
      process.env.WHATSAPP_PROVIDER;
    const originalMetaGraphApiVersion =
      process.env.WHATSAPP_META_GRAPH_API_VERSION;
    const originalMetaPhoneNumberId =
      process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    const originalMetaAccessToken =
      process.env.WHATSAPP_META_ACCESS_TOKEN;
    const originalMetaTimeout =
      process.env.WHATSAPP_META_TIMEOUT_MS;
    const originalMetaPreview =
      process.env.WHATSAPP_META_PREVIEW_URL;

    const originalEmailProvider =
      process.env.EMAIL_PROVIDER;

    const originalMailerSendApiToken =
      process.env.MAILERSEND_API_TOKEN;

    const originalMailerSendFromEmail =
      process.env.MAILERSEND_FROM_EMAIL;

    const originalMailerSendFromName =
      process.env.MAILERSEND_FROM_NAME;

    const originalMailerSendReplyToEmail =
      process.env.MAILERSEND_REPLY_TO_EMAIL;

    const originalMailerSendReplyToName =
      process.env.MAILERSEND_REPLY_TO_NAME;

    const originalMailerSendTimeout =
      process.env.MAILERSEND_TIMEOUT_MS;

    const originalMailerSendTrackClicks =
      process.env.MAILERSEND_TRACK_CLICKS;

    const originalMailerSendTrackOpens =
      process.env.MAILERSEND_TRACK_OPENS;

    const originalMailerSendTrackContent =
      process.env.MAILERSEND_TRACK_CONTENT;

    const originalSmsProvider =
      process.env.SMS_PROVIDER;

    const originalFast2SmsApiKey =
      process.env.FAST2SMS_API_KEY;

    const originalFast2SmsSenderId =
      process.env.FAST2SMS_SENDER_ID;

    const originalFast2SmsTimeout =
      process.env.FAST2SMS_TIMEOUT_MS;

    const originalFast2SmsDetails =
      process.env.FAST2SMS_INCLUDE_SMS_DETAILS;

    type EnvironmentVariable =
      | 'NODE_ENV'
      | 'WHATSAPP_PROVIDER'
      | 'WHATSAPP_META_GRAPH_API_VERSION'
      | 'WHATSAPP_META_PHONE_NUMBER_ID'
      | 'WHATSAPP_META_ACCESS_TOKEN'
      | 'WHATSAPP_META_TIMEOUT_MS'
      | 'WHATSAPP_META_PREVIEW_URL'
      | 'EMAIL_PROVIDER'
      | 'MAILERSEND_API_TOKEN'
      | 'MAILERSEND_FROM_EMAIL'
      | 'MAILERSEND_FROM_NAME'
      | 'MAILERSEND_REPLY_TO_EMAIL'
      | 'MAILERSEND_REPLY_TO_NAME'
      | 'MAILERSEND_TIMEOUT_MS'
      | 'MAILERSEND_TRACK_CLICKS'
      | 'MAILERSEND_TRACK_OPENS'
      | 'MAILERSEND_TRACK_CONTENT'
      | 'SMS_PROVIDER'
      | 'FAST2SMS_API_KEY'
      | 'FAST2SMS_SENDER_ID'
      | 'FAST2SMS_TIMEOUT_MS'
      | 'FAST2SMS_INCLUDE_SMS_DETAILS';

    function restoreEnvironment(
      name: EnvironmentVariable,
      value: string | undefined,
    ): void {
      if (value === undefined) {
        delete process.env[name];
        return;
      }

      process.env[name] = value;
    }

    afterEach(() => {
      restoreEnvironment(
        'NODE_ENV',
        originalNodeEnvironment,
      );
      restoreEnvironment(
        'WHATSAPP_PROVIDER',
        originalWhatsAppProvider,
      );
      restoreEnvironment(
        'EMAIL_PROVIDER',
        originalEmailProvider,
      );
      restoreEnvironment(
        'MAILERSEND_API_TOKEN',
        originalMailerSendApiToken,
      );
      restoreEnvironment(
        'MAILERSEND_FROM_EMAIL',
        originalMailerSendFromEmail,
      );
      restoreEnvironment(
        'MAILERSEND_FROM_NAME',
        originalMailerSendFromName,
      );
      restoreEnvironment(
        'MAILERSEND_REPLY_TO_EMAIL',
        originalMailerSendReplyToEmail,
      );
      restoreEnvironment(
        'MAILERSEND_REPLY_TO_NAME',
        originalMailerSendReplyToName,
      );
      restoreEnvironment(
        'MAILERSEND_TIMEOUT_MS',
        originalMailerSendTimeout,
      );
      restoreEnvironment(
        'MAILERSEND_TRACK_CLICKS',
        originalMailerSendTrackClicks,
      );
      restoreEnvironment(
        'MAILERSEND_TRACK_OPENS',
        originalMailerSendTrackOpens,
      );
      restoreEnvironment(
        'MAILERSEND_TRACK_CONTENT',
        originalMailerSendTrackContent,
      );
      restoreEnvironment(
        'SMS_PROVIDER',
        originalSmsProvider,
      );
      restoreEnvironment(
        'FAST2SMS_API_KEY',
        originalFast2SmsApiKey,
      );
      restoreEnvironment(
        'FAST2SMS_SENDER_ID',
        originalFast2SmsSenderId,
      );
      restoreEnvironment(
        'FAST2SMS_TIMEOUT_MS',
        originalFast2SmsTimeout,
      );
      restoreEnvironment(
        'FAST2SMS_INCLUDE_SMS_DETAILS',
        originalFast2SmsDetails,
      );
      jest.restoreAllMocks();
    });

    function createSubject() {
      const registry = {
        register: jest.fn(),
      };

      const mockWhatsAppProvider = {
        name: 'mock-whatsapp',
        channel: 'WHATSAPP',
        send: jest.fn(),
      };

      const webhookWhatsAppProvider = {
        name: 'whatsapp-webhook',
        channel: 'WHATSAPP',
        send: jest.fn(),
        validateConfiguration:
          jest.fn(
            (): WhatsAppWebhookConfiguration => ({
              status: 'READY',
              scope:
                'PROPERTYOS_WHATSAPP_WEBHOOK_CONFIGURATION',
              environmentClass:
                'PRODUCTION',
              webhookUrl:
                'https://automation.example.com/propertyos/whatsapp',
              webhookToken:
                'phase-14b3-test-token-000000000000',
              timeoutMs: 5000,
              errors: [],
            }),
          ),
      };

      const inAppProvider = {
        name: 'in-app',
        channel: 'IN_APP',
        send: jest.fn(),
      };

      const subject =
        new NotificationDispatcherService(
          registry as never,
          {} as never,
          {} as never,
          mockWhatsAppProvider as never,
          webhookWhatsAppProvider as never,
          inAppProvider as never,
        );

      return {
        subject,
        registry,
        mockWhatsAppProvider,
        webhookWhatsAppProvider,
        inAppProvider,
      };
    }

    it(
      'registers mock WhatsApp and in-app providers in development by default',
      () => {
        process.env.NODE_ENV = 'development';
        delete process.env.WHATSAPP_PROVIDER;

        const {
          subject,
          registry,
          mockWhatsAppProvider,
          inAppProvider,
        } = createSubject();

        subject.onModuleInit();

        expect(
          registry.register.mock.calls,
        ).toEqual([
          [mockWhatsAppProvider],
          [inAppProvider],
        ]);
      },
    );

    it(
      'does not register mock WhatsApp in unconfigured production',
      () => {
        process.env.NODE_ENV = 'production';
        delete process.env.WHATSAPP_PROVIDER;

        const {
          subject,
          registry,
          inAppProvider,
        } = createSubject();

        subject.onModuleInit();

        expect(
          registry.register.mock.calls,
        ).toEqual([[inAppProvider]]);
      },
    );

    it(
      'fails closed when mock WhatsApp is explicitly configured in production',
      () => {
        process.env.NODE_ENV = 'production';
        process.env.WHATSAPP_PROVIDER =
          'mock';

        const {
          subject,
          registry,
        } = createSubject();

        expect(() =>
          subject.onModuleInit(),
        ).toThrow(
          'WHATSAPP_PROVIDER_SELECTION_BLOCKED: Mock WhatsApp delivery is forbidden in production',
        );

        expect(
          registry.register,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'registers the validated webhook and in-app providers in production',
      () => {
        process.env.NODE_ENV = 'production';
        process.env.WHATSAPP_PROVIDER =
          'webhook';

        const {
          subject,
          registry,
          webhookWhatsAppProvider,
          inAppProvider,
        } = createSubject();

        subject.onModuleInit();

        expect(
          webhookWhatsAppProvider
            .validateConfiguration,
        ).toHaveBeenCalledTimes(1);

        expect(
          registry.register.mock.calls,
        ).toEqual([
          [webhookWhatsAppProvider],
          [inAppProvider],
        ]);
      },
    );

    it(
      'fails closed without partial registration when webhook configuration is blocked',
      () => {
        process.env.NODE_ENV = 'production';
        process.env.WHATSAPP_PROVIDER =
          'webhook';

        const {
          subject,
          registry,
          webhookWhatsAppProvider,
        } = createSubject();

        webhookWhatsAppProvider
          .validateConfiguration
          .mockReturnValue({
            status: 'BLOCKED',
            scope:
              'PROPERTYOS_WHATSAPP_WEBHOOK_CONFIGURATION',
            environmentClass:
              'PRODUCTION',
            timeoutMs: 10000,
            errors: [
              'WhatsApp webhook URL is required',
              'WhatsApp webhook token is required',
            ],
          });

        expect(() =>
          subject.onModuleInit(),
        ).toThrow(
          'WHATSAPP_WEBHOOK_CONFIGURATION_BLOCKED: WhatsApp webhook URL is required; WhatsApp webhook token is required',
        );

        expect(
          registry.register,
        ).not.toHaveBeenCalled();
      },
    );

    it(
      'fails closed for an unknown provider without registering partial state',
      () => {
        process.env.NODE_ENV = 'development';
        process.env.WHATSAPP_PROVIDER =
          'unknown-provider';

        const {
          subject,
          registry,
        } = createSubject();

        expect(() =>
          subject.onModuleInit(),
        ).toThrow(
          'WHATSAPP_PROVIDER_SELECTION_BLOCKED: Unsupported WhatsApp provider: unknown-provider',
        );

        expect(
          registry.register,
        ).not.toHaveBeenCalled();
      },
    );
    it(
      'registers validated Meta Cloud delivery in production',
      () => {
        process.env.NODE_ENV =
          'production';

        process.env.WHATSAPP_PROVIDER =
          'meta-cloud';

        process.env
          .WHATSAPP_META_GRAPH_API_VERSION =
          'v99.0';

        process.env
          .WHATSAPP_META_PHONE_NUMBER_ID =
          '123456789012345';

        process.env
          .WHATSAPP_META_ACCESS_TOKEN =
          'meta-test-token-00000000000000000000';

        const {
          subject,
        } = createSubject();

        expect(
          () =>
            subject.onModuleInit(),
        ).not.toThrow();
      },
    );

    it(
      'fails closed when Meta Cloud configuration is blocked',
      () => {
        process.env.NODE_ENV =
          'production';

        process.env.WHATSAPP_PROVIDER =
          'meta-cloud';

        delete process.env
          .WHATSAPP_META_GRAPH_API_VERSION;

        delete process.env
          .WHATSAPP_META_PHONE_NUMBER_ID;

        delete process.env
          .WHATSAPP_META_ACCESS_TOKEN;

        const {
          subject,
        } = createSubject();

        expect(
          () =>
            subject.onModuleInit(),
        ).toThrow(
          'WHATSAPP_META_CONFIGURATION_BLOCKED',
        );
      },
    );

    it(
      'registers validated MailerSend delivery',
      () => {
        process.env.EMAIL_PROVIDER =
          'mailersend';

        process.env.MAILERSEND_API_TOKEN =
          'mailersend-test-token-0000000000000000';

        process.env.MAILERSEND_FROM_EMAIL =
          'notifications@example.com';

        process.env.MAILERSEND_FROM_NAME =
          'PropertyOS';

        const {
          subject,
        } = createSubject();

        expect(
          () =>
            subject.onModuleInit(),
        ).not.toThrow();
      },
    );

    it(
      'fails closed when MailerSend configuration is blocked',
      () => {
        process.env.EMAIL_PROVIDER =
          'mailersend';

        delete process.env
          .MAILERSEND_API_TOKEN;

        delete process.env
          .MAILERSEND_FROM_EMAIL;

        const {
          subject,
        } = createSubject();

        expect(
          () =>
            subject.onModuleInit(),
        ).toThrow(
          'MAILERSEND_CONFIGURATION_BLOCKED',
        );
      },
    );

    it(
      'fails closed for unsupported email provider',
      () => {
        process.env.EMAIL_PROVIDER =
          'unknown-email-provider';

        const {
          subject,
        } = createSubject();

        expect(
          () =>
            subject.onModuleInit(),
        ).toThrow(
          'EMAIL_PROVIDER_SELECTION_BLOCKED',
        );
      },
    );

    it(
      'registers validated Fast2SMS delivery',
      () => {
        process.env.SMS_PROVIDER =
          'fast2sms';

        process.env.FAST2SMS_API_KEY =
          'fast2sms-test-key-00000000000000000000';

        process.env.FAST2SMS_SENDER_ID =
          'COGZDL';

        const {
          subject,
        } = createSubject();

        expect(
          () =>
            subject.onModuleInit(),
        ).not.toThrow();
      },
    );

    it(
      'fails closed when Fast2SMS configuration is blocked',
      () => {
        process.env.SMS_PROVIDER =
          'fast2sms';

        delete process.env
          .FAST2SMS_API_KEY;

        delete process.env
          .FAST2SMS_SENDER_ID;

        const {
          subject,
        } = createSubject();

        expect(
          () =>
            subject.onModuleInit(),
        ).toThrow(
          'FAST2SMS_CONFIGURATION_BLOCKED',
        );
      },
    );

    it(
      'fails closed for unsupported SMS provider',
      () => {
        process.env.SMS_PROVIDER =
          'unknown-sms-provider';

        const {
          subject,
        } = createSubject();

        expect(
          () =>
            subject.onModuleInit(),
        ).toThrow(
          'SMS_PROVIDER_SELECTION_BLOCKED',
        );
      },
    );

  },
);
