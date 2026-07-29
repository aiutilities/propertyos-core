import {
  CommunicationEventPublisher,
  CommunicationProviderBootstrap,
  CommunicationTemplateStore,
  DeliveryStateStore,
  NoopCommunicationLogger,
} from '../index';

describe('ForgeOS communication runtime ports', () => {
  it('supports an event publisher implementation', async () => {
    const publisher: CommunicationEventPublisher = {
      async publish(input) {
        return {
          id: 'event-1',
          type: input.type,
          source: input.source,
          payload: input.payload ?? {},
          correlationId: input.correlationId,
        };
      },
    };

    await expect(
      publisher.publish({
        type: 'communication.sent',
        source: 'forgeos.communication',
        payload: {
          communicationId: 'communication-1',
        },
      }),
    ).resolves.toMatchObject({
      type: 'communication.sent',
      source: 'forgeos.communication',
    });
  });

  it('supports a delivery state store implementation', async () => {
    const store: DeliveryStateStore = {
      async updateDeliveryState(input) {
        return {
          id: input.communicationId,
          status: input.status,
          metadata: input.metadata,
        };
      },
    };

    await expect(
      store.updateDeliveryState({
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
  });

  it('supports a communication template store', () => {
    const templates = new Map<string, unknown>();

    const store: CommunicationTemplateStore = {
      register(template) {
        templates.set(template.key, template);
      },

      registerMany(items) {
        for (const item of items) {
          this.register(item);
        }
      },

      find() {
        return Array.from(templates.values()) as never;
      },
    };

    store.register({
      key: 'visitor.invited',
      version: '1.0.0',
      channel: 'WHATSAPP',
      body: 'Hello {{visitorName}}',
    });

    expect(store.find()).toHaveLength(1);
  });

  it('supports provider bootstrap implementations', () => {
    const bootstrap: CommunicationProviderBootstrap = {
      resolveProviders() {
        return {
          providers: [],
          warnings: [
            'No external provider configured',
          ],
        };
      },
    };

    expect(
      bootstrap.resolveProviders({
        environment: 'development',
      }),
    ).toEqual({
      providers: [],
      warnings: [
        'No external provider configured',
      ],
    });
  });

  it('provides a safe no-operation logger', () => {
    const logger = new NoopCommunicationLogger();

    expect(() => {
      logger.debug?.('debug');
      logger.info?.('info');
      logger.warn?.('warn');
      logger.error('error');
    }).not.toThrow();
  });
});
