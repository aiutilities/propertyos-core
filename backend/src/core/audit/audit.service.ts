import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { AuditEventType, AuditLogEntry } from './audit.types';

@Injectable()
export class AuditService {
  private readonly logs: AuditLogEntry[] = [];

  record(
    eventType: AuditEventType,
    source: string,
    payload: Record<string, unknown> = {},
  ): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: randomUUID(),
      eventType,
      source,
      payload,
      createdAt: new Date(),
    };

    this.logs.push(entry);
    return entry;
  }

  list(): AuditLogEntry[] {
    return [...this.logs];
  }
}
