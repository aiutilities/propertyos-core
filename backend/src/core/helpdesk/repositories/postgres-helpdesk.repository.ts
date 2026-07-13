import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import {
  HelpdeskCategory,
  HelpdeskStatus,
  HelpdeskTicket,
  HelpdeskTicketDetails,
  HelpdeskTicketFilters,
  HelpdeskTicketHistory,
} from '../types/helpdesk.types';
import { HelpdeskRepository } from './helpdesk.repository';

@Injectable()
export class PostgresHelpdeskRepository
  implements HelpdeskRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(
    ticket: HelpdeskTicket,
  ): Promise<HelpdeskTicket> {
    const result = await this.pool.query(
      `
      INSERT INTO helpdesk_tickets (
        id,
        ticket_number,
        title,
        description,
        category_id,
        property_id,
        space_id,
        requester_person_id,
        assignee_person_id,
        priority,
        status,
        channel,
        response_due_at,
        resolution_due_at,
        first_responded_at,
        escalated_at,
        resolved_at,
        closed_at,
        resolution_summary,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,
        $12,$13,$14,$15,$16,$17,$18,$19,$20,$21
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
        ticket.requesterPersonId,
        ticket.assigneePersonId ?? null,
        ticket.priority,
        ticket.status,
        ticket.channel,
        ticket.responseDueAt ?? null,
        ticket.resolutionDueAt ?? null,
        ticket.firstRespondedAt ?? null,
        ticket.escalatedAt ?? null,
        ticket.resolvedAt ?? null,
        ticket.closedAt ?? null,
        ticket.resolutionSummary ?? null,
        ticket.createdAt,
        ticket.updatedAt,
      ],
    );

    return this.mapTicket(result.rows[0]);
  }

  async findById(
    id: string,
  ): Promise<HelpdeskTicket | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM helpdesk_tickets
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
  ): Promise<HelpdeskTicketDetails | null> {
    const ticket = await this.findById(id);

    if (!ticket) {
      return null;
    }

    const [
      category,
      history,
      comments,
      attachments,
      worklogs,
      feedback,
    ] = await Promise.all([
      this.findCategoryById(ticket.categoryId),
      this.getHistory(id),
      this.pool.query(
        `
        SELECT *
        FROM helpdesk_comments
        WHERE ticket_id = $1
        ORDER BY created_at ASC
        `,
        [id],
      ),
      this.pool.query(
        `
        SELECT *
        FROM helpdesk_attachments
        WHERE ticket_id = $1
        ORDER BY created_at ASC
        `,
        [id],
      ),
      this.pool.query(
        `
        SELECT *
        FROM helpdesk_worklogs
        WHERE ticket_id = $1
        ORDER BY worked_at ASC
        `,
        [id],
      ),
      this.pool.query(
        `
        SELECT *
        FROM helpdesk_feedback
        WHERE ticket_id = $1
        `,
        [id],
      ),
    ]);

    return {
      ...ticket,
      category: category ?? undefined,
      history,
      comments: comments.rows.map((row) => ({
        id: row.id,
        ticketId: row.ticket_id,
        authorPersonId: row.author_person_id,
        body: row.body,
        visibility: row.visibility,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      attachments: attachments.rows.map((row) => ({
        id: row.id,
        ticketId: row.ticket_id,
        commentId: row.comment_id ?? undefined,
        documentId: row.document_id,
        uploadedByPersonId: row.uploaded_by_person_id,
        createdAt: row.created_at,
      })),
      worklogs: worklogs.rows.map((row) => ({
        id: row.id,
        ticketId: row.ticket_id,
        personId: row.person_id,
        minutesSpent: Number(row.minutes_spent),
        description: row.description,
        workedAt: row.worked_at,
        createdAt: row.created_at,
      })),
      feedback: feedback.rows[0]
        ? {
            id: feedback.rows[0].id,
            ticketId: feedback.rows[0].ticket_id,
            submittedByPersonId:
              feedback.rows[0].submitted_by_person_id,
            rating: Number(feedback.rows[0].rating),
            comments:
              feedback.rows[0].comments ?? undefined,
            createdAt: feedback.rows[0].created_at,
          }
        : undefined,
    };
  }

  async findAll(
    filters: HelpdeskTicketFilters = {},
  ): Promise<HelpdeskTicket[]> {
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

    if (filters.requesterPersonId) {
      addCondition(
        'requester_person_id',
        filters.requesterPersonId,
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

    if (filters.channel) {
      addCondition('channel', filters.channel);
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
      FROM helpdesk_tickets
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
    input: Partial<HelpdeskTicket>,
  ): Promise<HelpdeskTicket | null> {
    const current = await this.findById(id);

    if (!current) {
      return null;
    }

    const merged: HelpdeskTicket = {
      ...current,
      ...input,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    };

    const result = await this.pool.query(
      `
      UPDATE helpdesk_tickets
      SET
        title = $2,
        description = $3,
        category_id = $4,
        property_id = $5,
        space_id = $6,
        requester_person_id = $7,
        assignee_person_id = $8,
        priority = $9,
        status = $10,
        channel = $11,
        response_due_at = $12,
        resolution_due_at = $13,
        first_responded_at = $14,
        escalated_at = $15,
        resolved_at = $16,
        closed_at = $17,
        resolution_summary = $18,
        updated_at = $19
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
        merged.requesterPersonId,
        merged.assigneePersonId ?? null,
        merged.priority,
        merged.status,
        merged.channel,
        merged.responseDueAt ?? null,
        merged.resolutionDueAt ?? null,
        merged.firstRespondedAt ?? null,
        merged.escalatedAt ?? null,
        merged.resolvedAt ?? null,
        merged.closedAt ?? null,
        merged.resolutionSummary ?? null,
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
  ): Promise<HelpdeskTicket | null> {
    const result = await this.pool.query(
      `
      UPDATE helpdesk_tickets
      SET
        assignee_person_id = $2,
        status = 'ASSIGNED',
        first_responded_at =
          COALESCE(first_responded_at, NOW()),
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
    status: HelpdeskStatus,
    timestamps: {
      firstRespondedAt?: Date;
      escalatedAt?: Date;
      resolvedAt?: Date;
      closedAt?: Date;
    } = {},
    resolutionSummary?: string,
  ): Promise<HelpdeskTicket | null> {
    const result = await this.pool.query(
      `
      UPDATE helpdesk_tickets
      SET
        status = $2,
        first_responded_at =
          COALESCE($3, first_responded_at),
        escalated_at =
          COALESCE($4, escalated_at),
        resolved_at =
          COALESCE($5, resolved_at),
        closed_at =
          COALESCE($6, closed_at),
        resolution_summary =
          COALESCE($7, resolution_summary),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        status,
        timestamps.firstRespondedAt ?? null,
        timestamps.escalatedAt ?? null,
        timestamps.resolvedAt ?? null,
        timestamps.closedAt ?? null,
        resolutionSummary ?? null,
      ],
    );

    return result.rows[0]
      ? this.mapTicket(result.rows[0])
      : null;
  }

  async addHistory(
    history: HelpdeskTicketHistory,
  ): Promise<HelpdeskTicketHistory> {
    const result = await this.pool.query(
      `
      INSERT INTO helpdesk_ticket_history (
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
  ): Promise<HelpdeskTicketHistory[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM helpdesk_ticket_history
      WHERE ticket_id = $1
      ORDER BY created_at ASC
      `,
      [ticketId],
    );

    return result.rows.map((row) =>
      this.mapHistory(row),
    );
  }

  async listCategories(): Promise<HelpdeskCategory[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM helpdesk_categories
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
  ): Promise<HelpdeskCategory | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM helpdesk_categories
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
    escalated: number;
    resolved: number;
    closed: number;
    responseBreached: number;
    resolutionBreached: number;
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
          WHERE status = 'ESCALATED'
        ) AS escalated,
        COUNT(*) FILTER (
          WHERE status = 'RESOLVED'
        ) AS resolved,
        COUNT(*) FILTER (
          WHERE status = 'CLOSED'
        ) AS closed,
        COUNT(*) FILTER (
          WHERE response_due_at < NOW()
            AND first_responded_at IS NULL
            AND status NOT IN (
              'RESOLVED',
              'CLOSED',
              'CANCELLED'
            )
        ) AS response_breached,
        COUNT(*) FILTER (
          WHERE resolution_due_at < NOW()
            AND status NOT IN (
              'RESOLVED',
              'CLOSED',
              'CANCELLED'
            )
        ) AS resolution_breached,
        COUNT(*) FILTER (
          WHERE priority = 'URGENT'
            AND status NOT IN (
              'CLOSED',
              'CANCELLED'
            )
        ) AS urgent
      FROM helpdesk_tickets
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
      escalated: Number(row.escalated ?? 0),
      resolved: Number(row.resolved ?? 0),
      closed: Number(row.closed ?? 0),
      responseBreached:
        Number(row.response_breached ?? 0),
      resolutionBreached:
        Number(row.resolution_breached ?? 0),
      urgent: Number(row.urgent ?? 0),
    };
  }

  private mapTicket(row: any): HelpdeskTicket {
    return {
      id: row.id,
      ticketNumber: row.ticket_number,
      title: row.title,
      description: row.description,
      categoryId: row.category_id,
      propertyId: row.property_id,
      spaceId: row.space_id ?? undefined,
      requesterPersonId: row.requester_person_id,
      assigneePersonId:
        row.assignee_person_id ?? undefined,
      priority: row.priority,
      status: row.status,
      channel: row.channel,
      responseDueAt: row.response_due_at ?? undefined,
      resolutionDueAt:
        row.resolution_due_at ?? undefined,
      firstRespondedAt:
        row.first_responded_at ?? undefined,
      escalatedAt: row.escalated_at ?? undefined,
      resolvedAt: row.resolved_at ?? undefined,
      closedAt: row.closed_at ?? undefined,
      resolutionSummary:
        row.resolution_summary ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapHistory(
    row: any,
  ): HelpdeskTicketHistory {
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

  private mapCategory(row: any): HelpdeskCategory {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description ?? undefined,
      defaultPriority: row.default_priority,
      responseSlaMinutes:
        Number(row.response_sla_minutes),
      resolutionSlaMinutes:
        Number(row.resolution_sla_minutes),
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
