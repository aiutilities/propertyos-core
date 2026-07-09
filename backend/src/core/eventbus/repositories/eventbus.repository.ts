import { EventDeliveryFailure, PropertyOSEvent } from '../types/event.types';

export const EVENTBUS_REPOSITORY = Symbol('EVENTBUS_REPOSITORY');

export interface EventBusRepository {
  saveEvent(event: PropertyOSEvent): Promise<PropertyOSEvent>;
  listEvents(filters?: {
    type?: string;
    source?: string;
    correlationId?: string;
    limit?: number;
  }): Promise<PropertyOSEvent[]>;
  saveDeadLetter(failure: EventDeliveryFailure): Promise<EventDeliveryFailure>;
  listDeadLetters(): Promise<EventDeliveryFailure[]>;
  clearDeadLetters(): Promise<void>;
}
