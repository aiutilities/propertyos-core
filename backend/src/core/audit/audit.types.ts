export type AuditEventType = string;

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  source: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}
