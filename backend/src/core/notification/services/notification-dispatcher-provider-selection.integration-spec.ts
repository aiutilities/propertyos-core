import {
  afterEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

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
          inAppProvider as never,
        );

      return {
        subject,
        registry,
        mockWhatsAppProvider,
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
      'fails closed while the selected real provider is not yet implemented',
      () => {
        process.env.NODE_ENV = 'production';
        process.env.WHATSAPP_PROVIDER =
          'webhook';

        const {
          subject,
          registry,
        } = createSubject();

        expect(() =>
          subject.onModuleInit(),
        ).toThrow(
          'WHATSAPP_WEBHOOK_PROVIDER_NOT_IMPLEMENTED',
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
