export interface PublishCommunicationEventInput {
  type: string;
  source: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, unknown>;
}

export interface PublishedCommunicationEvent {
  id?: string;
  type: string;
  source: string;
  payload: Record<string, unknown>;
  occurredAt?: string;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, unknown>;
}

export interface CommunicationEventPublisher {
  publish(
    input: PublishCommunicationEventInput,
  ): Promise<PublishedCommunicationEvent | void>;
}
