import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../database/postgres';
import {
  AuditEventType,
  AuditLogEntry,
  AuditLogListQuery,
} from './audit.types';

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
      [randomUUID(), eventType, source, JSON.stringify(payload)],
    );

    return this.map(result.rows[0]);
  }

  async list(query: AuditLogListQuery = {}): Promise<AuditLogEntry[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (query.eventType) {
      values.push(query.eventType);
      clauses.push(`event_type = $${values.length}`);
    }

    if (query.source) {
      values.push(query.source);
      clauses.push(`source = $${values.length}`);
    }

    if (query.entityType) {
      values.push(`%${query.entityType}%`);
      clauses.push(`payload::text ILIKE $${values.length}`);
    }

    if (query.entityId) {
      values.push(`%${query.entityId}%`);
      clauses.push(`payload::text ILIKE $${values.length}`);
    }

    const limit = this.normalizeLimit(query.limit);
    const offset = this.normalizeOffset(query.offset);

    values.push(limit);
    const limitIndex = values.length;

    values.push(offset);
    const offsetIndex = values.length;

    const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';

    const result = await this.pool.query(
      `
      SELECT *
      FROM audit_logs
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
      `,
      values,
    );

    return result.rows.map((row) => this.map(row));
  }

  async listByEntity(
    entityType: string,
    entityId: string,
    limit = 100,
  ): Promise<AuditLogEntry[]> {
    return this.list({
      entityType,
      entityId,
      limit,
    });
  }

  private normalizeLimit(limit?: number): number {
    if (!limit || limit < 1) {
      return 100;
    }

    return Math.min(limit, 500);
  }

  private normalizeOffset(offset?: number): number {
    if (!offset || offset < 0) {
      return 0;
    }

    return offset;
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
