export interface PlatformEvent<TPayload = unknown> {
  id: string;
  name: string;
  source: string;
  occurredAt: Date;
  payload: TPayload;
  metadata?: Record<string, unknown>;
}
