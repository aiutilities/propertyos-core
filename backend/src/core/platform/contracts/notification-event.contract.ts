import { DomainEvent } from './domain-event.contract';

export interface NotificationEvent<TPayload = unknown> extends DomainEvent<TPayload> {
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH' | 'IN_APP';
  recipient: string;
}
