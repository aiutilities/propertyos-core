import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/postgres';
import { EventDeliveryFailure, PropertyOSEvent } from '../types/event.types';
import { EventBusRepository } from './eventbus.repository';

@Injectable()
export class PostgresEventBusRepository implements EventBusRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async saveEvent(event: PropertyOSEvent): Promise<PropertyOSEvent> {
    const result = await this.pool.query(
      `
      INSERT INTO eventbus_events (
        id, event_type, source, payload, correlation_id, causation_id, metadata, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      ON CONFLICT (id) DO UPDATE SET
        event_type = EXCLUDED.event_type,
        source = EXCLUDED.source,
        payload = EXCLUDED.payload,
        correlation_id = EXCLUDED.correlation_id,
        causation_id = EXCLUDED.causation_id,
        metadata = EXCLUDED.metadata
      RETURNING *
      `,
      [
        event.id,
        event.type,
        event.source,
        JSON.stringify(event.payload ?? {}),
        event.correlationId,
        event.causationId ?? null,
        JSON.stringify(event.metadata ?? {}),
        event.createdAt,
      ],
    );

    return this.mapEvent(result.rows[0]);
  }

  async listEvents(filters: {
    type?: string;
    source?: string;
    correlationId?: string;
    limit?: number;
  } = {}): Promise<PropertyOSEvent[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (filters.type) {
      values.push(filters.type);
      clauses.push(`event_type = $${values.length}`);
    }

    if (filters.source) {
      values.push(filters.source);
      clauses.push(`source = $${values.length}`);
    }

    if (filters.correlationId) {
      values.push(filters.correlationId);
      clauses.push(`correlation_id = $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const limitParam = `$${values.length}`;

    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const result = await this.pool.query(
      `
      SELECT *
      FROM eventbus_events
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${limitParam}
      `,
      values,
    );

    return result.rows.map((row) => this.mapEvent(row));
  }

  async saveDeadLetter(
    failure: EventDeliveryFailure,
  ): Promise<EventDeliveryFailure> {
    const result = await this.pool.query(
      `
      INSERT INTO eventbus_dead_letters (
        id, event_id, event_snapshot, handler_name, error_message, attempt, created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        failure.id,
        failure.event.id,
        JSON.stringify(failure.event),
        failure.handlerName,
        failure.errorMessage,
        failure.attempt,
        failure.createdAt,
      ],
    );

    return this.mapDeadLetter(result.rows[0]);
  }

  async listDeadLetters(): Promise<EventDeliveryFailure[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM eventbus_dead_letters
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapDeadLetter(row));
  }

  async clearDeadLetters(): Promise<void> {
    await this.pool.query(`DELETE FROM eventbus_dead_letters`);
  }

  private mapEvent(row: any): PropertyOSEvent {
    return {
      id: row.id,
      type: row.event_type,
      source: row.source,
      payload:
        typeof row.payload === 'string'
          ? JSON.parse(row.payload)
          : row.payload ?? {},
      createdAt: new Date(row.created_at),
      correlationId: row.correlation_id,
      causationId: row.causation_id ?? undefined,
      metadata:
        typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata ?? {},
    };
  }

  private mapDeadLetter(row: any): EventDeliveryFailure {
    const event =
      typeof row.event_snapshot === 'string'
        ? JSON.parse(row.event_snapshot)
        : row.event_snapshot;

    return {
      id: row.id,
      event: {
        ...event,
        createdAt: new Date(event.createdAt),
      },
      handlerName: row.handler_name,
      errorMessage: row.error_message,
      attempt: Number(row.attempt),
      createdAt: new Date(row.created_at),
    };
  }
}
