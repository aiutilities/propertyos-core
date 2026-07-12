import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import {
  MaintenanceCategory,
  MaintenanceHistory,
  MaintenanceStatus,
  MaintenanceTicket,
  MaintenanceTicketDetails,
  MaintenanceTicketFilters,
} from '../types/maintenance.types';
import { MaintenanceRepository } from './maintenance.repository';

@Injectable()
export class PostgresMaintenanceRepository
  implements MaintenanceRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(
    ticket: MaintenanceTicket,
  ): Promise<MaintenanceTicket> {
    const result = await this.pool.query(
      `
      INSERT INTO maintenance_tickets (
        id,
        ticket_number,
        title,
        description,
        category_id,
        property_id,
        space_id,
        reporter_person_id,
        assignee_person_id,
        priority,
        status,
        sla_due_at,
        resolved_at,
        closed_at,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15,$16
      )
      RETURNING *
      `,
      [
        ticket.id,
        ticket.ticketNumber,
        ticket.title,
        ticket.description,
        ticket.categoryId,
        ticket.propertyId,
        ticket.spaceId ?? null,
        ticket.reporterPersonId,
        ticket.assigneePersonId ?? null,
        ticket.priority,
        ticket.status,
        ticket.slaDueAt ?? null,
        ticket.resolvedAt ?? null,
        ticket.closedAt ?? null,
        ticket.createdAt,
        ticket.updatedAt,
      ],
    );

    return this.mapTicket(result.rows[0]);
  }

  async findById(
    id: string,
  ): Promise<MaintenanceTicket | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM maintenance_tickets
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0]
      ? this.mapTicket(result.rows[0])
      : null;
  }

  async findDetailsById(
    id: string,
  ): Promise<MaintenanceTicketDetails | null> {
    const ticket = await this.findById(id);

    if (!ticket) {
      return null;
    }

    const [category, history] = await Promise.all([
      this.findCategoryById(ticket.categoryId),
      this.getHistory(id),
    ]);

    return {
      ...ticket,
      category: category ?? undefined,
      history,
    };
  }

  async findAll(
    filters: MaintenanceTicketFilters = {},
  ): Promise<MaintenanceTicket[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    const addCondition = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);
      conditions.push(`${column} = $${values.length}`);
    };

    if (filters.propertyId) {
      addCondition('property_id', filters.propertyId);
    }

    if (filters.spaceId) {
      addCondition('space_id', filters.spaceId);
    }

    if (filters.reporterPersonId) {
      addCondition(
        'reporter_person_id',
        filters.reporterPersonId,
      );
    }

    if (filters.assigneePersonId) {
      addCondition(
        'assignee_person_id',
        filters.assigneePersonId,
      );
    }

    if (filters.categoryId) {
      addCondition('category_id', filters.categoryId);
    }

    if (filters.priority) {
      addCondition('priority', filters.priority);
    }

    if (filters.status) {
      addCondition('status', filters.status);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      conditions.push(
        `(ticket_number ILIKE $${values.length}
          OR title ILIKE $${values.length}
          OR description ILIKE $${values.length})`,
      );
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(' AND ')}`
        : '';

    const result = await this.pool.query(
      `
      SELECT *
      FROM maintenance_tickets
      ${where}
      ORDER BY created_at DESC
      `,
      values,
    );

    return result.rows.map((row) =>
      this.mapTicket(row),
    );
  }

  async update(
    id: string,
    input: Partial<MaintenanceTicket>,
  ): Promise<MaintenanceTicket | null> {
    const current = await this.findById(id);

    if (!current) {
      return null;
    }

    const merged: MaintenanceTicket = {
      ...current,
      ...input,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    };

    const result = await this.pool.query(
      `
      UPDATE maintenance_tickets
      SET
        title = $2,
        description = $3,
        category_id = $4,
        property_id = $5,
        space_id = $6,
        reporter_person_id = $7,
        assignee_person_id = $8,
        priority = $9,
        status = $10,
        sla_due_at = $11,
        resolved_at = $12,
        closed_at = $13,
        updated_at = $14
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        merged.title,
        merged.description,
        merged.categoryId,
        merged.propertyId,
        merged.spaceId ?? null,
        merged.reporterPersonId,
        merged.assigneePersonId ?? null,
        merged.priority,
        merged.status,
        merged.slaDueAt ?? null,
        merged.resolvedAt ?? null,
        merged.closedAt ?? null,
        merged.updatedAt,
      ],
    );

    return result.rows[0]
      ? this.mapTicket(result.rows[0])
      : null;
  }

  async assign(
    id: string,
    assigneePersonId: string,
  ): Promise<MaintenanceTicket | null> {
    const result = await this.pool.query(
      `
      UPDATE maintenance_tickets
      SET
        assignee_person_id = $2,
        status = 'ASSIGNED',
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, assigneePersonId],
    );

    return result.rows[0]
      ? this.mapTicket(result.rows[0])
      : null;
  }

  async updateStatus(
    id: string,
    status: MaintenanceStatus,
    timestamps: {
      resolvedAt?: Date;
      closedAt?: Date;
    } = {},
  ): Promise<MaintenanceTicket | null> {
    const result = await this.pool.query(
      `
      UPDATE maintenance_tickets
      SET
        status = $2,
        resolved_at = COALESCE($3, resolved_at),
        closed_at = COALESCE($4, closed_at),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        status,
        timestamps.resolvedAt ?? null,
        timestamps.closedAt ?? null,
      ],
    );

    return result.rows[0]
      ? this.mapTicket(result.rows[0])
      : null;
  }

  async addHistory(
    history: MaintenanceHistory,
  ): Promise<MaintenanceHistory> {
    const result = await this.pool.query(
      `
      INSERT INTO maintenance_ticket_history (
        id,
        ticket_id,
        from_status,
        to_status,
        changed_by_person_id,
        remarks,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        history.id,
        history.ticketId,
        history.fromStatus ?? null,
        history.toStatus,
        history.changedByPersonId,
        history.remarks ?? null,
        history.createdAt,
      ],
    );

    return this.mapHistory(result.rows[0]);
  }

  async getHistory(
    ticketId: string,
  ): Promise<MaintenanceHistory[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM maintenance_ticket_history
      WHERE ticket_id = $1
      ORDER BY created_at ASC
      `,
      [ticketId],
    );

    return result.rows.map((row) =>
      this.mapHistory(row),
    );
  }

  async listCategories(): Promise<MaintenanceCategory[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM maintenance_categories
      WHERE is_active = TRUE
      ORDER BY name ASC
      `,
    );

    return result.rows.map((row) =>
      this.mapCategory(row),
    );
  }

  async findCategoryById(
    id: string,
  ): Promise<MaintenanceCategory | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM maintenance_categories
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0]
      ? this.mapCategory(result.rows[0])
      : null;
  }

  async getMetrics(
    propertyId?: string,
  ): Promise<{
    total: number;
    open: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    closed: number;
    overdue: number;
    urgent: number;
  }> {
    const result = await this.pool.query(
      `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE status = 'OPEN'
        ) AS open,
        COUNT(*) FILTER (
          WHERE status = 'ASSIGNED'
        ) AS assigned,
        COUNT(*) FILTER (
          WHERE status = 'IN_PROGRESS'
        ) AS in_progress,
        COUNT(*) FILTER (
          WHERE status = 'RESOLVED'
        ) AS resolved,
        COUNT(*) FILTER (
          WHERE status = 'CLOSED'
        ) AS closed,
        COUNT(*) FILTER (
          WHERE sla_due_at < NOW()
            AND status NOT IN (
              'RESOLVED',
              'CLOSED',
              'CANCELLED',
              'REJECTED'
            )
        ) AS overdue,
        COUNT(*) FILTER (
          WHERE priority = 'URGENT'
            AND status NOT IN (
              'CLOSED',
              'CANCELLED',
              'REJECTED'
            )
        ) AS urgent
      FROM maintenance_tickets
      WHERE ($1::uuid IS NULL OR property_id = $1)
      `,
      [propertyId ?? null],
    );

    const row = result.rows[0] ?? {};

    return {
      total: Number(row.total ?? 0),
      open: Number(row.open ?? 0),
      assigned: Number(row.assigned ?? 0),
      inProgress: Number(row.in_progress ?? 0),
      resolved: Number(row.resolved ?? 0),
      closed: Number(row.closed ?? 0),
      overdue: Number(row.overdue ?? 0),
      urgent: Number(row.urgent ?? 0),
    };
  }

  private mapTicket(row: any): MaintenanceTicket {
    return {
      id: row.id,
      ticketNumber: row.ticket_number,
      title: row.title,
      description: row.description,
      categoryId: row.category_id,
      propertyId: row.property_id,
      spaceId: row.space_id ?? undefined,
      reporterPersonId: row.reporter_person_id,
      assigneePersonId:
        row.assignee_person_id ?? undefined,
      priority: row.priority,
      status: row.status,
      slaDueAt: row.sla_due_at ?? undefined,
      resolvedAt: row.resolved_at ?? undefined,
      closedAt: row.closed_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapHistory(row: any): MaintenanceHistory {
    return {
      id: row.id,
      ticketId: row.ticket_id,
      fromStatus: row.from_status ?? undefined,
      toStatus: row.to_status,
      changedByPersonId: row.changed_by_person_id,
      remarks: row.remarks ?? undefined,
      createdAt: row.created_at,
    };
  }

  private mapCategory(row: any): MaintenanceCategory {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description ?? undefined,
      defaultSlaMinutes: Number(
        row.default_sla_minutes ?? 0,
      ),
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
