import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

import {
  EventBusStats,
  EventDeliveryFailure,
  EventHandler,
  EventPublishOptions,
  PropertyOSEvent,
} from '../types/event.types';

@Injectable()
export class EventBusService {
  private readonly handlers = new Map<string, EventHandler[]>();
  private readonly globalHandlers: EventHandler[] = [];
  private readonly deadLetters: EventDeliveryFailure[] = [];

  private stats: EventBusStats = {
    published: 0,
    delivered: 0,
    failed: 0,
    deadLetters: 0,
  };

  subscribe(eventType: string, handler: EventHandler): void {
    const existingHandlers = this.handlers.get(eventType) ?? [];
    existingHandlers.push(handler);
    this.handlers.set(eventType, existingHandlers);
  }

  subscribeAll(handler: EventHandler): void {
    this.globalHandlers.push(handler);
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const existingHandlers = this.handlers.get(eventType) ?? [];
    const filteredHandlers = existingHandlers.filter(
      (registeredHandler) => registeredHandler !== handler,
    );

    this.handlers.set(eventType, filteredHandlers);
  }

  async publish(
    type: string,
    source: string,
    payload: Record<string, unknown> = {},
    options: EventPublishOptions = {},
  ): Promise<PropertyOSEvent> {
    const event: PropertyOSEvent = {
      id: randomUUID(),
      type,
      source,
      payload,
      createdAt: new Date(),
      correlationId: options.correlationId ?? randomUUID(),
      causationId: options.causationId,
      metadata: options.metadata ?? {},
    };

    this.stats.published += 1;

    const handlers = this.handlers.get(type) ?? [];
    const allHandlers = [...handlers, ...this.globalHandlers];

    for (const handler of allHandlers) {
      await this.deliver(event, handler, options.maxRetries ?? 0);
    }

    return event;
  }

  getStats(): EventBusStats {
    return { ...this.stats };
  }

  listDeadLetters(): EventDeliveryFailure[] {
    return [...this.deadLetters];
  }

  clearDeadLetters(): void {
    this.deadLetters.length = 0;
    this.stats.deadLetters = 0;
  }

  private async deliver(
    event: PropertyOSEvent,
    handler: EventHandler,
    maxRetries: number,
  ): Promise<void> {
    const attempts = Math.max(maxRetries, 0) + 1;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        await handler(event);
        this.stats.delivered += 1;
        return;
      } catch (error) {
        this.stats.failed += 1;

        if (attempt >= attempts) {
          this.recordDeadLetter(event, handler, error, attempt);
          return;
        }
      }
    }
  }

  private recordDeadLetter(
    event: PropertyOSEvent,
    handler: EventHandler,
    error: unknown,
    attempt: number,
  ): void {
    this.deadLetters.push({
      id: randomUUID(),
      event,
      handlerName: handler.name || 'anonymous-handler',
      errorMessage:
        error instanceof Error ? error.message : 'Unknown event handler error',
      attempt,
      createdAt: new Date(),
    });

    this.stats.deadLetters = this.deadLetters.length;
  }
}
