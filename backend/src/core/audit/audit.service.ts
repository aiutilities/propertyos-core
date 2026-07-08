import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../database/postgres';
import { AuditEventType, AuditLogEntry } from './audit.types';

@Injectable()
export class AuditService {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async record(
    eventType: AuditEventType,
    source: string,
    payload: Record<string, unknown> = {},
  ): Promise<AuditLogEntry> {
    const result = await this.pool.query(
      `
      INSERT INTO audit_logs (
        id,
        event_type,
        source,
        payload,
        created_at
      )
      VALUES ($1,$2,$3,$4,NOW())
      RETURNING *
      `,
      [
        randomUUID(),
        eventType,
        source,
        JSON.stringify(payload),
      ],
    );

    return this.map(result.rows[0]);
  }

  async list(limit = 100): Promise<AuditLogEntry[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT $1
      `,
      [Math.min(Math.max(limit, 1), 500)],
    );

    return result.rows.map((row) => this.map(row));
  }

  async listByEntity(
    entityType: string,
    entityId: string,
    limit = 100,
  ): Promise<AuditLogEntry[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM audit_logs
      WHERE payload::text ILIKE $1
        AND payload::text ILIKE $2
      ORDER BY created_at DESC
      LIMIT $3
      `,
      [
        `%${entityType}%`,
        `%${entityId}%`,
        Math.min(Math.max(limit, 1), 500),
      ],
    );

    return result.rows.map((row) => this.map(row));
  }

  private map(row: any): AuditLogEntry {
    return {
      id: row.id,
      eventType: row.event_type,
      source: row.source,
      payload: row.payload ?? {},
      createdAt: row.created_at,
    };
  }
}
