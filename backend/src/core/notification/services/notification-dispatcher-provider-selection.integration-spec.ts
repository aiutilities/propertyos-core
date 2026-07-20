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

    function restoreEnvironment(
      name: 'NODE_ENV' | 'WHATSAPP_PROVIDER',
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
  },
);
