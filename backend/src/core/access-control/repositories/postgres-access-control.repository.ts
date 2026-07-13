import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";

import { POSTGRES_POOL } from "../../../database/postgres";
import {
  AccessDecision,
  AccessEvent,
  AccessEventFilters,
  AccessGrant,
  AccessGrantFilters,
  AccessGrantStatus,
  AccessMetrics,
  AccessPoint,
  AccessPointFilters,
  AccessPointStatus,
  AccessSubjectType,
} from "../types/access-control.types";
import { AccessControlRepository } from "./access-control.repository";

@Injectable()
export class PostgresAccessControlRepository implements AccessControlRepository {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async createAccessPoint(accessPoint: AccessPoint): Promise<AccessPoint> {
    const result = await this.pool.query(
      `
      INSERT INTO access_points (
        id,
        property_id,
        zone_id,
        space_id,
        code,
        normalized_code,
        name,
        description,
        access_point_type,
        direction,
        status,
        controller_provider,
        controller_reference,
        requires_anti_passback,
        metadata,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,$17
      )
      RETURNING *
      `,
      [
        accessPoint.id,
        accessPoint.propertyId,
        accessPoint.zoneId ?? null,
        accessPoint.spaceId ?? null,
        accessPoint.code,
        accessPoint.normalizedCode,
        accessPoint.name,
        accessPoint.description ?? null,
        accessPoint.accessPointType,
        accessPoint.direction,
        accessPoint.status,
        accessPoint.controllerProvider ?? null,
        accessPoint.controllerReference ?? null,
        accessPoint.requiresAntiPassback,
        accessPoint.metadata ? JSON.stringify(accessPoint.metadata) : null,
        accessPoint.createdAt,
        accessPoint.updatedAt,
      ],
    );

    return this.mapAccessPoint(result.rows[0]);
  }

  async findAccessPointById(id: string): Promise<AccessPoint | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM access_points
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ? this.mapAccessPoint(result.rows[0]) : null;
  }

  async findAccessPointByCode(
    propertyId: string,
    normalizedCode: string,
  ): Promise<AccessPoint | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM access_points
      WHERE property_id = $1
        AND normalized_code = $2
      LIMIT 1
      `,
      [propertyId, normalizedCode],
    );

    return result.rows[0] ? this.mapAccessPoint(result.rows[0]) : null;
  }

  async listAccessPoints(
    filters: AccessPointFilters = {},
  ): Promise<AccessPoint[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    const equal = (column: string, value: unknown) => {
      values.push(value);
      clauses.push(`${column} = $${values.length}`);
    };

    if (filters.propertyId) {
      equal("property_id", filters.propertyId);
    }

    if (filters.zoneId) {
      equal("zone_id", filters.zoneId);
    }

    if (filters.spaceId) {
      equal("space_id", filters.spaceId);
    }

    if (filters.accessPointType) {
      equal("access_point_type", filters.accessPointType);
    }

    if (filters.status) {
      equal("status", filters.status);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      const parameter = `$${values.length}`;

      clauses.push(
        `(
          code ILIKE ${parameter}
          OR normalized_code ILIKE ${parameter}
          OR name ILIKE ${parameter}
          OR description ILIKE ${parameter}
          OR controller_provider ILIKE ${parameter}
          OR controller_reference ILIKE ${parameter}
        )`,
      );
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

    const result = await this.pool.query(
      `
      SELECT *
      FROM access_points
      ${where}
      ORDER BY created_at DESC
      `,
      values,
    );

    return result.rows.map((row) => this.mapAccessPoint(row));
  }

  async updateAccessPoint(
    id: string,
    input: Partial<AccessPoint>,
  ): Promise<AccessPoint | null> {
    const current = await this.findAccessPointById(id);

    if (!current) {
      return null;
    }

    const merged: AccessPoint = {
      ...current,
      ...input,
      id: current.id,
      propertyId: current.propertyId,
      code: current.code,
      normalizedCode: current.normalizedCode,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    };

    const result = await this.pool.query(
      `
      UPDATE access_points
      SET
        zone_id = $2,
        space_id = $3,
        name = $4,
        description = $5,
        access_point_type = $6,
        direction = $7,
        status = $8,
        controller_provider = $9,
        controller_reference = $10,
        requires_anti_passback = $11,
        metadata = $12,
        updated_at = $13
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        merged.zoneId ?? null,
        merged.spaceId ?? null,
        merged.name,
        merged.description ?? null,
        merged.accessPointType,
        merged.direction,
        merged.status,
        merged.controllerProvider ?? null,
        merged.controllerReference ?? null,
        merged.requiresAntiPassback,
        merged.metadata ? JSON.stringify(merged.metadata) : null,
        merged.updatedAt,
      ],
    );

    return result.rows[0] ? this.mapAccessPoint(result.rows[0]) : null;
  }

  async updateAccessPointStatus(
    id: string,
    status: AccessPointStatus,
  ): Promise<AccessPoint | null> {
    const result = await this.pool.query(
      `
      UPDATE access_points
      SET
        status = $2,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, status],
    );

    return result.rows[0] ? this.mapAccessPoint(result.rows[0]) : null;
  }

  async createGrant(grant: AccessGrant): Promise<AccessGrant> {
    const result = await this.pool.query(
      `
      INSERT INTO access_grants (
        id,
        access_point_id,
        subject_type,
        subject_id,
        direction,
        status,
        valid_from,
        valid_until,
        schedule,
        issued_by_person_id,
        revoked_by_person_id,
        revoked_at,
        revocation_reason,
        notes,
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
        grant.id,
        grant.accessPointId,
        grant.subjectType,
        grant.subjectId,
        grant.direction,
        grant.status,
        grant.validFrom ?? null,
        grant.validUntil ?? null,
        grant.schedule ? JSON.stringify(grant.schedule) : null,
        grant.issuedByPersonId,
        grant.revokedByPersonId ?? null,
        grant.revokedAt ?? null,
        grant.revocationReason ?? null,
        grant.notes ?? null,
        grant.createdAt,
        grant.updatedAt,
      ],
    );

    return this.mapGrant(result.rows[0]);
  }

  async findGrantById(id: string): Promise<AccessGrant | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM access_grants
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ? this.mapGrant(result.rows[0]) : null;
  }

  async findApplicableGrants(
    accessPointId: string,
    subjectType: AccessSubjectType,
    subjectId: string,
    at: Date,
  ): Promise<AccessGrant[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM access_grants
      WHERE access_point_id = $1
        AND subject_type = $2
        AND subject_id = $3
        AND status = 'ACTIVE'
        AND (
          valid_from IS NULL
          OR valid_from <= $4
        )
        AND (
          valid_until IS NULL
          OR valid_until >= $4
        )
      ORDER BY created_at DESC
      `,
      [accessPointId, subjectType, subjectId, at],
    );

    return result.rows.map((row) => this.mapGrant(row));
  }

  async listGrants(filters: AccessGrantFilters = {}): Promise<AccessGrant[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    const equal = (column: string, value: unknown) => {
      values.push(value);
      clauses.push(`${column} = $${values.length}`);
    };

    if (filters.accessPointId) {
      equal("access_point_id", filters.accessPointId);
    }

    if (filters.subjectType) {
      equal("subject_type", filters.subjectType);
    }

    if (filters.subjectId) {
      equal("subject_id", filters.subjectId);
    }

    if (filters.status) {
      equal("status", filters.status);
    }

    if (filters.activeAt) {
      values.push(filters.activeAt);
      const parameter = `$${values.length}`;

      clauses.push(
        `(
          status = 'ACTIVE'
          AND (
            valid_from IS NULL
            OR valid_from <= ${parameter}
          )
          AND (
            valid_until IS NULL
            OR valid_until >= ${parameter}
          )
        )`,
      );
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

    const result = await this.pool.query(
      `
      SELECT *
      FROM access_grants
      ${where}
      ORDER BY created_at DESC
      `,
      values,
    );

    return result.rows.map((row) => this.mapGrant(row));
  }

  async updateGrantStatus(
    id: string,
    status: AccessGrantStatus,
    input: Partial<AccessGrant> = {},
  ): Promise<AccessGrant | null> {
    const result = await this.pool.query(
      `
      UPDATE access_grants
      SET
        status = $2,
        revoked_by_person_id = COALESCE(
          $3,
          revoked_by_person_id
        ),
        revoked_at = COALESCE(
          $4,
          revoked_at
        ),
        revocation_reason = COALESCE(
          $5,
          revocation_reason
        ),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        status,
        input.revokedByPersonId ?? null,
        input.revokedAt ?? null,
        input.revocationReason ?? null,
      ],
    );

    return result.rows[0] ? this.mapGrant(result.rows[0]) : null;
  }

  async createEvent(event: AccessEvent): Promise<AccessEvent> {
    const result = await this.pool.query(
      `
      INSERT INTO access_events (
        id,
        access_point_id,
        subject_type,
        subject_id,
        credential_id,
        event_type,
        decision,
        denial_reason,
        grant_id,
        recorded_by_person_id,
        occurred_at,
        metadata,
        created_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13
      )
      RETURNING *
      `,
      [
        event.id,
        event.accessPointId,
        event.subjectType ?? null,
        event.subjectId ?? null,
        event.credentialId ?? null,
        event.eventType,
        event.decision,
        event.denialReason ?? null,
        event.grantId ?? null,
        event.recordedByPersonId ?? null,
        event.occurredAt,
        event.metadata ? JSON.stringify(event.metadata) : null,
        event.createdAt,
      ],
    );

    return this.mapEvent(result.rows[0]);
  }

  async listEvents(filters: AccessEventFilters = {}): Promise<AccessEvent[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    const equal = (column: string, value: unknown) => {
      values.push(value);
      clauses.push(`${column} = $${values.length}`);
    };

    if (filters.accessPointId) {
      equal("e.access_point_id", filters.accessPointId);
    }

    if (filters.propertyId) {
      equal("p.property_id", filters.propertyId);
    }

    if (filters.subjectType) {
      equal("e.subject_type", filters.subjectType);
    }

    if (filters.subjectId) {
      equal("e.subject_id", filters.subjectId);
    }

    if (filters.eventType) {
      equal("e.event_type", filters.eventType);
    }

    if (filters.decision) {
      equal("e.decision", filters.decision);
    }

    if (filters.occurredFrom) {
      values.push(filters.occurredFrom);
      clauses.push(`e.occurred_at >= $${values.length}`);
    }

    if (filters.occurredUntil) {
      values.push(filters.occurredUntil);
      clauses.push(`e.occurred_at <= $${values.length}`);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);

    values.push(limit);

    const result = await this.pool.query(
      `
      SELECT e.*
      FROM access_events e
      INNER JOIN access_points p
        ON p.id = e.access_point_id
      ${where}
      ORDER BY
        e.occurred_at DESC,
        e.created_at DESC
      LIMIT $${values.length}
      `,
      values,
    );

    return result.rows.map((row) => this.mapEvent(row));
  }

  async findLatestGrantedEvent(
    accessPointId: string,
    subjectType: AccessSubjectType,
    subjectId: string,
  ): Promise<AccessEvent | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM access_events
      WHERE access_point_id = $1
        AND subject_type = $2
        AND subject_id = $3
        AND decision = 'GRANTED'
      ORDER BY
        occurred_at DESC,
        created_at DESC
      LIMIT 1
      `,
      [accessPointId, subjectType, subjectId],
    );

    return result.rows[0] ? this.mapEvent(result.rows[0]) : null;
  }

  async getMetrics(propertyId?: string): Promise<AccessMetrics> {
    const result = await this.pool.query(
      `
      WITH point_metrics AS (
        SELECT
          COUNT(*) AS total_access_points,
          COUNT(*) FILTER (
            WHERE status = 'ACTIVE'
          ) AS active_access_points,
          COUNT(*) FILTER (
            WHERE status = 'MAINTENANCE'
          ) AS maintenance_access_points
        FROM access_points
        WHERE (
          $1::uuid IS NULL
          OR property_id = $1
        )
      ),
      grant_metrics AS (
        SELECT
          COUNT(*) FILTER (
            WHERE
              g.status = 'ACTIVE'
              AND (
                g.valid_from IS NULL
                OR g.valid_from <= NOW()
              )
              AND (
                g.valid_until IS NULL
                OR g.valid_until >= NOW()
              )
          ) AS active_grants
        FROM access_grants g
        INNER JOIN access_points p
          ON p.id = g.access_point_id
        WHERE (
          $1::uuid IS NULL
          OR p.property_id = $1
        )
      ),
      event_metrics AS (
        SELECT
          COUNT(*) FILTER (
            WHERE
              e.decision = 'GRANTED'
              AND e.occurred_at >=
                date_trunc('day', NOW())
          ) AS granted_today,
          COUNT(*) FILTER (
            WHERE
              e.decision = 'DENIED'
              AND e.occurred_at >=
                date_trunc('day', NOW())
          ) AS denied_today
        FROM access_events e
        INNER JOIN access_points p
          ON p.id = e.access_point_id
        WHERE (
          $1::uuid IS NULL
          OR p.property_id = $1
        )
      ),
      latest_subject_events AS (
        SELECT DISTINCT ON (
          e.subject_type,
          e.subject_id
        )
          e.subject_type,
          e.subject_id,
          e.event_type
        FROM access_events e
        INNER JOIN access_points p
          ON p.id = e.access_point_id
        WHERE
          e.decision = 'GRANTED'
          AND e.subject_type IS NOT NULL
          AND e.subject_id IS NOT NULL
          AND (
            $1::uuid IS NULL
            OR p.property_id = $1
          )
        ORDER BY
          e.subject_type,
          e.subject_id,
          e.occurred_at DESC,
          e.created_at DESC
      ),
      inside_metrics AS (
        SELECT
          COUNT(*) FILTER (
            WHERE event_type = 'ENTRY'
          ) AS currently_inside
        FROM latest_subject_events
      )
      SELECT
        pm.total_access_points,
        pm.active_access_points,
        pm.maintenance_access_points,
        gm.active_grants,
        em.granted_today,
        em.denied_today,
        im.currently_inside
      FROM point_metrics pm
      CROSS JOIN grant_metrics gm
      CROSS JOIN event_metrics em
      CROSS JOIN inside_metrics im
      `,
      [propertyId ?? null],
    );

    const row = result.rows[0] ?? {};

    return {
      totalAccessPoints: Number(row.total_access_points ?? 0),
      activeAccessPoints: Number(row.active_access_points ?? 0),
      maintenanceAccessPoints: Number(row.maintenance_access_points ?? 0),
      activeGrants: Number(row.active_grants ?? 0),
      grantedToday: Number(row.granted_today ?? 0),
      deniedToday: Number(row.denied_today ?? 0),
      currentlyInside: Number(row.currently_inside ?? 0),
    };
  }

  private mapAccessPoint(row: any): AccessPoint {
    return {
      id: row.id,
      propertyId: row.property_id,
      zoneId: row.zone_id ?? undefined,
      spaceId: row.space_id ?? undefined,
      code: row.code,
      normalizedCode: row.normalized_code,
      name: row.name,
      description: row.description ?? undefined,
      accessPointType: row.access_point_type,
      direction: row.direction,
      status: row.status,
      controllerProvider: row.controller_provider ?? undefined,
      controllerReference: row.controller_reference ?? undefined,
      requiresAntiPassback: row.requires_anti_passback,
      metadata: row.metadata ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapGrant(row: any): AccessGrant {
    return {
      id: row.id,
      accessPointId: row.access_point_id,
      subjectType: row.subject_type,
      subjectId: row.subject_id,
      direction: row.direction,
      status: row.status,
      validFrom: row.valid_from ?? undefined,
      validUntil: row.valid_until ?? undefined,
      schedule: row.schedule ?? undefined,
      issuedByPersonId: row.issued_by_person_id,
      revokedByPersonId: row.revoked_by_person_id ?? undefined,
      revokedAt: row.revoked_at ?? undefined,
      revocationReason: row.revocation_reason ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapEvent(row: any): AccessEvent {
    return {
      id: row.id,
      accessPointId: row.access_point_id,
      subjectType: row.subject_type ?? undefined,
      subjectId: row.subject_id ?? undefined,
      credentialId: row.credential_id ?? undefined,
      eventType: row.event_type,
      decision: row.decision,
      denialReason: row.denial_reason ?? undefined,
      grantId: row.grant_id ?? undefined,
      recordedByPersonId: row.recorded_by_person_id ?? undefined,
      occurredAt: row.occurred_at,
      metadata: row.metadata ?? undefined,
      createdAt: row.created_at,
    };
  }
}
