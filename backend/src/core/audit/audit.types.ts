export type AuditEventType = string;

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  source: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditLogListQuery {
  eventType?: string;
  source?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}
