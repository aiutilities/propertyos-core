import { EventDeliveryFailure, PropertyOSEvent } from '../types/event.types';
import { EventBusRepository } from './eventbus.repository';

export class InMemoryEventBusRepository implements EventBusRepository {
  private readonly events: PropertyOSEvent[] = [];
  private readonly deadLetters: EventDeliveryFailure[] = [];

  async saveEvent(event: PropertyOSEvent): Promise<PropertyOSEvent> {
    this.events.push(event);
    return event;
  }

  async listEvents(filters: {
    type?: string;
    source?: string;
    correlationId?: string;
    limit?: number;
  } = {}): Promise<PropertyOSEvent[]> {
    return this.events
      .filter((event) => !filters.type || event.type === filters.type)
      .filter((event) => !filters.source || event.source === filters.source)
      .filter(
        (event) =>
          !filters.correlationId || event.correlationId === filters.correlationId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, filters.limit ?? 100);
  }

  async saveDeadLetter(
    failure: EventDeliveryFailure,
  ): Promise<EventDeliveryFailure> {
    this.deadLetters.push(failure);
    return failure;
  }

  async listDeadLetters(): Promise<EventDeliveryFailure[]> {
    return [...this.deadLetters].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async clearDeadLetters(): Promise<void> {
    this.deadLetters.length = 0;
  }
}
