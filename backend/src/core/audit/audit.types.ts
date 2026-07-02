export type AuditEventType =
  | 'VISITOR_INVITED'
  | 'VISITOR_CHECKED_IN'
  | 'VISITOR_CHECKED_OUT'
  | 'GATE_ENTRY_RECORDED'
  | 'RESIDENT_ADDED'
  | 'SECURITY_USER_CREATED'
  | 'PLUGIN_INSTALLED'
  | 'PLUGIN_ACTIVATED'
  | 'PLUGIN_DEACTIVATED'
  | 'USER_CREATED'
  | 'ROLE_CHANGED'
  | 'NOTIFICATION_SENT';

export interface AuditLogEntry {
  id: string;
  eventType: AuditEventType;
  source: string;
  payload: Record<string, unknown>;
  createdAt: Date;
}
