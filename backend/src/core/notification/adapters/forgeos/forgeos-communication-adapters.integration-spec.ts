import {
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import {
  PropertyOSCommunicationEventPublisherAdapter,
  PropertyOSCommunicationLoggerAdapter,
  PropertyOSDeliveryStateStoreAdapter,
} from './index';

describe('PropertyOS ForgeOS communication adapters', () => {
  it('publishes ForgeOS events through EventBusService', async () => {
    const publish = jest.fn(
      async (
        _type: string,
        _source: string,
        _payload: Record<string, unknown>,
        _options: Record<string, unknown>,
      ) => ({
        id: 'event-1',
        type: 'communication.sent',
        source: 'forgeos.communication',
        payload: {
          communicationId: 'communication-1',
        },
        createdAt: new Date(
          '2026-07-29T05:30:00.000Z',
        ),
        correlationId: 'correlation-1',
        causationId: 'cause-1',
        metadata: {
          providerName: 'meta-whatsapp',
        },
      }),
    );

    const adapter =
      new PropertyOSCommunicationEventPublisherAdapter(
        { publish } as never,
      );

    await expect(
      adapter.publish({
        type: 'communication.sent',
        source: 'forgeos.communication',
        payload: {
          communicationId: 'communication-1',
        },
        correlationId: 'correlation-1',
        causationId: 'cause-1',
        metadata: {
          providerName: 'meta-whatsapp',
        },
      }),
    ).resolves.toMatchObject({
      id: 'event-1',
      type: 'communication.sent',
      occurredAt: '2026-07-29T05:30:00.000Z',
    });

    expect(publish).toHaveBeenCalledTimes(1);
  });

  it('updates PropertyOS notification delivery state', async () => {
    const updateDeliveryStatus = jest.fn(
      async (
        id: string,
        status: 'SENT' | 'FAILED',
        metadata: Record<string, unknown>,
      ) => ({
        id,
        channel: 'WHATSAPP' as const,
        recipient: '+919999999999',
        message: 'Test',
        status,
        metadata,
        createdAt: new Date(),
      }),
    );

    const adapter =
      new PropertyOSDeliveryStateStoreAdapter(
        { updateDeliveryStatus } as never,
      );

    await expect(
      adapter.updateDeliveryState({
        communicationId: 'communication-1',
        status: 'SENT',
        metadata: {
          providerName: 'meta-whatsapp',
        },
      }),
    ).resolves.toEqual({
      id: 'communication-1',
      status: 'SENT',
      metadata: {
        providerName: 'meta-whatsapp',
      },
    });

    expect(
      updateDeliveryStatus,
    ).toHaveBeenCalledWith(
      'communication-1',
      'SENT',
      {
        providerName: 'meta-whatsapp',
      },
    );
  });

  it('returns null for a missing notification', async () => {
    const updateDeliveryStatus = jest.fn(
      async (
        _id: string,
        _status: 'SENT' | 'FAILED',
        _metadata: Record<string, unknown>,
      ) => null,
    );

    const adapter =
      new PropertyOSDeliveryStateStoreAdapter(
        { updateDeliveryStatus } as never,
      );

    await expect(
      adapter.updateDeliveryState({
        communicationId: 'missing',
        status: 'FAILED',
      }),
    ).resolves.toBeNull();
  });

  it('provides a safe NestJS logger adapter', () => {
    const adapter =
      new PropertyOSCommunicationLoggerAdapter();

    expect(() => {
      adapter.debug('debug');
      adapter.info('info');
      adapter.warn('warn');
      adapter.error('error');
    }).not.toThrow();
  });
});
