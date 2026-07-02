import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  EventHandler,
  PropertyOSEvent,
} from '../types/event.types';

@Injectable()
export class EventBusService {
  private readonly handlers = new Map<string, EventHandler[]>();
  private readonly globalHandlers: EventHandler[] = [];

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
  ): Promise<PropertyOSEvent> {
    const event: PropertyOSEvent = {
      id: randomUUID(),
      type,
      source,
      payload,
      createdAt: new Date(),
    };

    const handlers = this.handlers.get(type) ?? [];
    const allHandlers = [...handlers, ...this.globalHandlers];

    for (const handler of allHandlers) {
      await handler(event);
    }

    return event;
  }
}
