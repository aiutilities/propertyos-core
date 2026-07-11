import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/postgres';
import { VisitorRepositoryPort } from './visitor-repository.interface';

@Injectable()
export class PostgresVisitorRepository implements VisitorRepositoryPort {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async findVisitorByMobile(mobile: string) {
    const result = await this.pool.query(
      `
      SELECT *
      FROM visitors
      WHERE mobile = $1
      AND deleted_at IS NULL
      LIMIT 1
      `,
      [mobile],
    );

    return result.rows[0] ? this.mapVisitor(result.rows[0]) : null;
  }

  async createVisitor(data: Record<string, unknown>) {
    const result = await this.pool.query(
      `
      INSERT INTO visitors (
        id, full_name, mobile, email, metadata, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        data.id,
        data.fullName,
        data.mobile,
        data.email ?? null,
        data.metadata ?? null,
        data.createdAt ?? new Date(),
        data.updatedAt ?? new Date(),
      ],
    );

    return this.mapVisitor(result.rows[0]);
  }

  async createVisit(data: Record<string, unknown>) {
    const result = await this.pool.query(
      `
      INSERT INTO visits (
        id,
        visitor_id,
        property_id,
        host_person_id,
        visit_date,
        visit_purpose,
        status,
        metadata,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
      `,
      [
        data.id,
        data.visitorId,
        data.propertyId,
        data.hostPersonId,
        data.visitDate,
        data.visitPurpose ?? null,
        data.status,
        data.metadata ?? null,
        data.createdAt ?? new Date(),
        data.updatedAt ?? new Date(),
      ],
    );

    return this.mapVisit(result.rows[0]);
  }

  async updateVisitStatus(
    visitId: string,
    status: string,
    updates: Record<string, unknown> = {},
  ) {
    const result = await this.pool.query(
      `
      UPDATE visits
      SET
        status = $2,
        approved_at = COALESCE($3, approved_at),
        rejected_at = COALESCE($4, rejected_at),
        arrived_at = COALESCE($5, arrived_at),
        checked_in_at = COALESCE($6, checked_in_at),
        checked_out_at = COALESCE($7, checked_out_at),
        cancelled_at = COALESCE($8, cancelled_at),
        expired_at = COALESCE($9, expired_at),
        notes = COALESCE($10, notes),
        metadata = COALESCE($11, metadata),
        updated_at = NOW()
      WHERE id = $1
      AND deleted_at IS NULL
      RETURNING *
      `,
      [
        visitId,
        status,
        updates.approvedAt ?? null,
        updates.rejectedAt ?? null,
        updates.arrivedAt ?? null,
        updates.checkedInAt ?? null,
        updates.checkedOutAt ?? null,
        updates.cancelledAt ?? null,
        updates.expiredAt ?? null,
        updates.reason ?? updates.remarks ?? updates.notes ?? null,
        updates.metadata ?? null,
      ],
    );

    return result.rows[0] ? this.mapVisit(result.rows[0]) : null;
  }

  async createQrPass(data: Record<string, unknown>) {
    const result = await this.pool.query(
      `
      INSERT INTO visitor_qr_passes (
        id, visit_id, qr_token, expires_at, generated_at, scanned_at, status, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        data.id,
        data.visitId,
        data.qrToken,
        data.expiresAt,
        data.generatedAt ?? new Date(),
        data.scannedAt ?? null,
        data.status,
        data.metadata ?? null,
      ],
    );

    return this.mapQrPass(result.rows[0]);
  }

  async findQrPassByToken(qrToken: string) {
    const result = await this.pool.query(
      `
      SELECT *
      FROM visitor_qr_passes
      WHERE qr_token = $1
      LIMIT 1
      `,
      [qrToken],
    );

    return result.rows[0] ? this.mapQrPass(result.rows[0]) : null;
  }

  async findHostNotificationContact(
    hostPersonId: string,
  ): Promise<Record<string, unknown>> {
    const result = await this.pool.query(
      `
      SELECT
        id,
        display_name,
        email,
        phone
      FROM persons
      WHERE id = $1
      LIMIT 1
      `,
      [hostPersonId],
    );

    const person = result.rows[0];

    if (!person) {
      return {};
    }

    return {
      hostPersonId: person.id,
      hostName: person.display_name,
      hostEmail: person.email ?? undefined,
      hostMobile: person.phone ?? undefined,
    };
  }

  async findVisitById(visitId: string) {
    const result = await this.pool.query(
      `
      SELECT
        v.*,
        vr.full_name AS visitor_full_name,
        vr.mobile AS visitor_mobile,
        vr.email AS visitor_email
      FROM visits v
      INNER JOIN visitors vr
        ON vr.id = v.visitor_id
      WHERE v.id = $1
      AND v.deleted_at IS NULL
      LIMIT 1
      `,
      [visitId],
    );

    return result.rows[0]
      ? this.mapVisitWithVisitor(result.rows[0])
      : null;
  }

  async listVisits(filters: Record<string, unknown>) {
    const conditions = ['v.deleted_at IS NULL'];
    const values: unknown[] = [];

    if (filters.propertyId) {
      values.push(filters.propertyId);
      conditions.push(`v.property_id = $${values.length}`);
    }

    if (filters.status) {
      values.push(filters.status);
      conditions.push(`v.status = $${values.length}`);
    }

    if (filters.hostPersonId) {
      values.push(filters.hostPersonId);
      conditions.push(`v.host_person_id = $${values.length}`);
    }

    const whereClause = conditions.join(' AND ');

    const result = await this.pool.query(
      `
      SELECT
        v.*,
        vr.full_name AS visitor_full_name,
        vr.mobile AS visitor_mobile,
        vr.email AS visitor_email
      FROM visits v
      INNER JOIN visitors vr
        ON vr.id = v.visitor_id
      WHERE ${whereClause}
      ORDER BY v.created_at DESC
      `,
      values,
    );

    return {
      items: result.rows.map((row) => this.mapVisitWithVisitor(row)),
      total: result.rowCount,
      filters,
    };
  }


  async searchVisits(query: string, limit = 25) {
    const normalizedQuery = `%${query.trim()}%`;

    const result = await this.pool.query(
      `
      SELECT
        v.*,
        vr.full_name AS visitor_full_name,
        vr.mobile AS visitor_mobile,
        vr.email AS visitor_email
      FROM visits v
      INNER JOIN visitors vr
        ON vr.id = v.visitor_id
      WHERE v.deleted_at IS NULL
      AND (
        vr.full_name ILIKE $1
        OR vr.mobile ILIKE $1
        OR COALESCE(vr.email, '') ILIKE $1
        OR COALESCE(v.visit_purpose, '') ILIKE $1
        OR v.status ILIKE $1
      )
      ORDER BY v.created_at DESC
      LIMIT $2
      `,
      [normalizedQuery, limit],
    );

    return result.rows.map((row) => this.mapVisitWithVisitor(row));
  }

  async createStatusHistory(data: Record<string, unknown>) {
    const result = await this.pool.query(
      `
      INSERT INTO visitor_status_history (
        id,
        visit_id,
        previous_status,
        new_status,
        changed_by_person_id,
        change_reason,
        metadata,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        data.id,
        data.visitId,
        data.previousStatus ?? null,
        data.newStatus,
        data.changedByPersonId ?? null,
        data.changeReason ?? null,
        data.metadata ?? null,
        data.createdAt ?? new Date(),
      ],
    );

    return this.mapStatusHistory(result.rows[0]);
  }

  async getVisitHistory(visitId: string) {
    const result = await this.pool.query(
      `
      SELECT *
      FROM visitor_status_history
      WHERE visit_id = $1
      ORDER BY created_at ASC
      `,
      [visitId],
    );

    return {
      visitId,
      items: result.rows.map((row) => this.mapStatusHistory(row)),
    };
  }

  async getSettings(propertyId?: string) {
    const result = await this.pool.query(
      `
      SELECT *
      FROM visitor_plugin_settings
      WHERE (
        ($1::uuid IS NULL AND property_id IS NULL)
        OR property_id = $1::uuid
      )
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [propertyId ?? null],
    );

    if (!result.rows[0]) {
      return {
        propertyId,
        settings: null,
      };
    }

    return this.mapSettings(result.rows[0]);
  }

  async updateSettings(
    propertyId: string | undefined,
    settings: Record<string, unknown>,
  ) {
    const existing = await this.getSettings(propertyId);

    if ('id' in existing && existing.id) {
      const result = await this.pool.query(
        `
        UPDATE visitor_plugin_settings
        SET settings = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [existing.id, settings],
      );

      return this.mapSettings(result.rows[0]);
    }

    const result = await this.pool.query(
      `
      INSERT INTO visitor_plugin_settings (id, property_id, settings)
      VALUES (gen_random_uuid(), $1, $2)
      RETURNING *
      `,
      [propertyId ?? null, settings],
    );

    return this.mapSettings(result.rows[0]);
  }

  private mapVisitor(row: any) {
    return {
      id: row.id,
      fullName: row.full_name,
      mobile: row.mobile,
      email: row.email ?? undefined,
      metadata: row.metadata ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  }

  private mapVisit(row: any) {
    return {
      id: row.id,
      visitorId: row.visitor_id,
      propertyId: row.property_id,
      hostPersonId: row.host_person_id,
      visitDate: row.visit_date,
      visitPurpose: row.visit_purpose ?? undefined,
      status: row.status,
      approvedAt: row.approved_at ?? undefined,
      rejectedAt: row.rejected_at ?? undefined,
      arrivedAt: row.arrived_at ?? undefined,
      checkedInAt: row.checked_in_at ?? undefined,
      checkedOutAt: row.checked_out_at ?? undefined,
      cancelledAt: row.cancelled_at ?? undefined,
      expiredAt: row.expired_at ?? undefined,
      notes: row.notes ?? undefined,
      metadata: row.metadata ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at ?? undefined,
    };
  }

  private mapVisitWithVisitor(row: any) {
    return {
      ...this.mapVisit(row),
      visitor: {
        fullName: row.visitor_full_name,
        mobile: row.visitor_mobile,
        email: row.visitor_email ?? undefined,
      },
    };
  }

  private mapQrPass(row: any) {
    return {
      id: row.id,
      visitId: row.visit_id,
      qrToken: row.qr_token,
      expiresAt: row.expires_at,
      generatedAt: row.generated_at,
      scannedAt: row.scanned_at ?? undefined,
      status: row.status,
      metadata: row.metadata ?? undefined,
    };
  }

  private mapStatusHistory(row: any) {
    return {
      id: row.id,
      visitId: row.visit_id,
      previousStatus: row.previous_status ?? undefined,
      newStatus: row.new_status,
      changedByPersonId: row.changed_by_person_id ?? undefined,
      changeReason: row.change_reason ?? undefined,
      metadata: row.metadata ?? undefined,
      createdAt: row.created_at,
    };
  }

  private mapSettings(row: any) {
    return {
      id: row.id,
      propertyId: row.property_id ?? undefined,
      settings: row.settings,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
