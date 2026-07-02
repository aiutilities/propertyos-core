export interface PropertyOSEvent<TPayload = Record<string, unknown>> {
  id: string;
  type: string;
  source: string;
  payload: TPayload;
  createdAt: Date;
}

export type EventHandler<TPayload = Record<string, unknown>> = (
  event: PropertyOSEvent<TPayload>,
) => void | Promise<void>;

export interface EventSubscription {
  eventType: string;
  handler: EventHandler;
}
