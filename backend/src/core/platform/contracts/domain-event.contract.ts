import { PlatformEvent } from './platform-event.contract';

export interface DomainEvent<TPayload = unknown> extends PlatformEvent<TPayload> {
  aggregateId?: string;
  aggregateType?: string;
}
