export class AuditQueryDto {
  eventType?: string;
  source?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}
