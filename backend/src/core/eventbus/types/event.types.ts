export interface PropertyOSEvent<TPayload = Record<string, unknown>> {
  id: string;
  type: string;
  source: string;
  payload: TPayload;
  createdAt: Date;
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, unknown>;
}

export type EventHandler<TPayload = Record<string, unknown>> = (
  event: PropertyOSEvent<TPayload>,
) => void | Promise<void>;

export interface EventSubscription {
  eventType: string;
  handler: EventHandler;
}

export interface EventPublishOptions {
  correlationId?: string;
  causationId?: string;
  metadata?: Record<string, unknown>;
  maxRetries?: number;
}

export interface EventDeliveryFailure {
  id: string;
  event: PropertyOSEvent;
  handlerName: string;
  errorMessage: string;
  attempt: number;
  createdAt: Date;
}

export interface EventBusStats {
  published: number;
  delivered: number;
  failed: number;
  deadLetters: number;
}
