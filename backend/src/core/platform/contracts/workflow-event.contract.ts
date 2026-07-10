import { DomainEvent } from './domain-event.contract';

export interface WorkflowEvent<TPayload = unknown> extends DomainEvent<TPayload> {
  workflowInstanceId: string;
  workflowDefinitionId?: string;
  fromState?: string;
  toState?: string;
  transition?: string;
}
