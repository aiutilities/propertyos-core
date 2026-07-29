import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  NotificationDispatcherService,
} from './notification-dispatcher.service';

function createSubject(options?: {
  providerSuccess?: boolean;
  providerThrows?: boolean;
}) {
  const provider = {
    name: 'mock-whatsapp',
    channel: 'WHATSAPP' as const,

    async send() {
      if (options?.providerThrows) {
        throw new Error(
          'Provider unavailable',
        );
      }

      return {
        success:
          options?.providerSuccess ??
          true,
        providerName:
          'mock-whatsapp',
        providerMessageId:
          'message-1',
        error:
          options?.providerSuccess === false
            ? 'Provider rejected request'
            : undefined,
      };
    },
  };

  const registry = {
    list: jest.fn(
      () => [provider],
    ),
    register: jest.fn(),
  };

  const updateDeliveryStatus =
    jest.fn(
      async (
        id: string,
        status: 'SENT' | 'FAILED',
        metadata:
          Record<string, unknown>,
      ) => ({
        id,
        channel:
          'WHATSAPP' as const,
        recipient:
          '+919999999999',
        message:
          'Visitor arrived',
        status,
        metadata,
        createdAt:
          new Date(
            '2026-07-29T06:30:00.000Z',
          ),
      }),
    );

  const publish = jest.fn(
    async (
      type: string,
      source: string,
      payload:
        Record<string, unknown>,
      _options:
        Record<string, unknown>,
    ) => ({
      id: 'event-1',
      type,
      source,
      payload,
      createdAt:
        new Date(
          '2026-07-29T06:30:00.000Z',
        ),
      correlationId:
        'correlation-1',
      metadata: {},
    }),
  );

  const subject =
    new NotificationDispatcherService(
      registry as never,
      {
        updateDeliveryStatus,
      } as never,
      {
        publish,
      } as never,
      {} as never,
      {} as never,
      {} as never,
    );

  return {
    subject,
    provider,
    updateDeliveryStatus,
    publish,
  };
}

describe(
  'NotificationDispatcherService ForgeOS compatibility',
  () => {
    it(
      'delegates successful delivery to ForgeOS',
      async () => {
        const fixture =
          createSubject();

        await expect(
          fixture.subject.dispatch({
            id: 'notification-1',
            channel: 'WHATSAPP',
            recipient:
              '+919999999999',
            message:
              'Visitor arrived',
            status: 'PENDING',
            metadata: {},
            createdAt:
              new Date(
                '2026-07-29T06:29:00.000Z',
              ),
          }),
        ).resolves.toMatchObject({
          id: 'notification-1',
          status: 'SENT',
        });

        expect(
          fixture.updateDeliveryStatus,
        ).toHaveBeenCalledWith(
          'notification-1',
          'SENT',
          expect.objectContaining({
            providerName:
              'mock-whatsapp',
          }),
        );

        expect(
          fixture.publish,
        ).toHaveBeenCalledWith(
          'notification.sent',
          'core.notification.dispatcher',
          expect.objectContaining({
            notificationId:
              'notification-1',
          }),
          expect.any(Object),
        );
      },
    );

    it(
      'preserves failed delivery behavior',
      async () => {
        const fixture =
          createSubject({
            providerSuccess: false,
          });

        await expect(
          fixture.subject.dispatch({
            id: 'notification-2',
            channel: 'WHATSAPP',
            recipient:
              '+919999999999',
            message:
              'Visitor arrived',
            status: 'PENDING',
            metadata: {},
            createdAt:
              new Date(
                '2026-07-29T06:29:00.000Z',
              ),
          }),
        ).resolves.toMatchObject({
          id: 'notification-2',
          status: 'FAILED',
        });

        expect(
          fixture.publish,
        ).toHaveBeenCalledWith(
          'notification.failed',
          'core.notification.dispatcher',
          expect.objectContaining({
            notificationId:
              'notification-2',
          }),
          expect.any(Object),
        );
      },
    );

    it(
      'preserves thrown-provider failure behavior',
      async () => {
        const fixture =
          createSubject({
            providerThrows: true,
          });

        await expect(
          fixture.subject.dispatch({
            id: 'notification-3',
            channel: 'WHATSAPP',
            recipient:
              '+919999999999',
            message:
              'Visitor arrived',
            status: 'PENDING',
            metadata: {},
            createdAt:
              new Date(
                '2026-07-29T06:29:00.000Z',
              ),
          }),
        ).resolves.toMatchObject({
          id: 'notification-3',
          status: 'FAILED',
        });
      },
    );
  },
);
