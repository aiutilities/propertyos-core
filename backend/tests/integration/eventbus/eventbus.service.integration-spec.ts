import { EventBusService } from '../../../src/core/eventbus/services/eventbus.service';

describe('EventBusService', () => {
  let eventBus: EventBusService;

  beforeEach(() => {
    eventBus = new EventBusService();
  });

  it('publishes events to matching subscribers', async () => {
    const handler = jest.fn();

    eventBus.subscribe('test.created', handler);

    const event = await eventBus.publish('test.created', 'eventbus.test', {
      entityId: 'entity-1',
    });

    expect(event.id).toBeDefined();
    expect(event.type).toBe('test.created');
    expect(event.source).toBe('eventbus.test');
    expect(event.payload).toEqual({ entityId: 'entity-1' });
    expect(event.correlationId).toBeDefined();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('publishes events to global subscribers', async () => {
    const globalHandler = jest.fn();

    eventBus.subscribeAll(globalHandler);

    const event = await eventBus.publish('test.global', 'eventbus.test');

    expect(globalHandler).toHaveBeenCalledTimes(1);
    expect(globalHandler).toHaveBeenCalledWith(event);
  });

  it('continues delivery when one handler fails', async () => {
    const failingHandler = jest.fn(() => {
      throw new Error('handler failed');
    });
    const successfulHandler = jest.fn();

    eventBus.subscribe('test.failure', failingHandler);
    eventBus.subscribe('test.failure', successfulHandler);

    await eventBus.publish('test.failure', 'eventbus.test');

    expect(failingHandler).toHaveBeenCalledTimes(1);
    expect(successfulHandler).toHaveBeenCalledTimes(1);

    const stats = eventBus.getStats();
    expect(stats.published).toBe(1);
    expect(stats.delivered).toBe(1);
    expect(stats.failed).toBe(1);
    expect(stats.deadLetters).toBe(1);

    const deadLetters = eventBus.listDeadLetters();
    expect(deadLetters).toHaveLength(1);
    expect(deadLetters[0].event.type).toBe('test.failure');
    expect(deadLetters[0].errorMessage).toBe('handler failed');
  });

  it('retries failed handlers before dead lettering', async () => {
    const failingHandler = jest.fn(() => {
      throw new Error('retry failed');
    });

    eventBus.subscribe('test.retry', failingHandler);

    await eventBus.publish('test.retry', 'eventbus.test', {}, { maxRetries: 2 });

    expect(failingHandler).toHaveBeenCalledTimes(3);

    const stats = eventBus.getStats();
    expect(stats.published).toBe(1);
    expect(stats.delivered).toBe(0);
    expect(stats.failed).toBe(3);
    expect(stats.deadLetters).toBe(1);

    expect(eventBus.listDeadLetters()[0].attempt).toBe(3);
  });

  it('supports unsubscribe', async () => {
    const handler = jest.fn();

    eventBus.subscribe('test.unsubscribe', handler);
    eventBus.unsubscribe('test.unsubscribe', handler);

    await eventBus.publish('test.unsubscribe', 'eventbus.test');

    expect(handler).not.toHaveBeenCalled();
  });

  it('clears dead letters', async () => {
    eventBus.subscribe('test.deadletter.clear', () => {
      throw new Error('boom');
    });

    await eventBus.publish('test.deadletter.clear', 'eventbus.test');

    expect(eventBus.listDeadLetters()).toHaveLength(1);

    eventBus.clearDeadLetters();

    expect(eventBus.listDeadLetters()).toHaveLength(0);
    expect(eventBus.getStats().deadLetters).toBe(0);
  });
});
