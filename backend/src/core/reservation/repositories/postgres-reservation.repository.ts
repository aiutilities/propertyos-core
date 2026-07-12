import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import {
  POSTGRES_POOL,
} from '../../../database/postgres';
import {
  Reservation,
  ReservationAvailabilityQuery,
  ReservationDetails,
  ReservationFilters,
  ReservationMetrics,
  ReservationResource,
  ReservationResourceBlock,
  ReservationResourceFilters,
  ReservationResourceType,
  ReservationStatus,
  ReservationStatusHistory,
} from '../types/reservation.types';
import {
  ReservationRepository,
} from './reservation.repository';

@Injectable()
export class PostgresReservationRepository
  implements ReservationRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async createResource(
    resource: ReservationResource,
  ): Promise<ReservationResource> {
    const result = await this.pool.query(
      `
      INSERT INTO reservation_resources (
        id,
        property_id,
        zone_id,
        space_id,
        code,
        normalized_code,
        name,
        description,
        resource_type,
        capacity,
        requires_approval,
        is_active,
        minimum_duration_minutes,
        maximum_duration_minutes,
        booking_interval_minutes,
        advance_booking_days,
        minimum_notice_minutes,
        opening_time,
        closing_time,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21
      )
      RETURNING *
      `,
      [
        resource.id,
        resource.propertyId,
        resource.zoneId ?? null,
        resource.spaceId ?? null,
        resource.code,
        resource.normalizedCode,
        resource.name,
        resource.description ?? null,
        resource.resourceType,
        resource.capacity,
        resource.requiresApproval,
        resource.isActive,
        resource.minimumDurationMinutes,
        resource.maximumDurationMinutes ?? null,
        resource.bookingIntervalMinutes,
        resource.advanceBookingDays,
        resource.minimumNoticeMinutes,
        resource.openingTime ?? null,
        resource.closingTime ?? null,
        resource.createdAt,
        resource.updatedAt,
      ],
    );

    return this.mapResource(result.rows[0]);
  }

  async findResourceById(
    id: string,
  ): Promise<ReservationResource | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM reservation_resources
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0]
      ? this.mapResource(result.rows[0])
      : null;
  }

  async findResourceByCode(
    propertyId: string,
    normalizedCode: string,
  ): Promise<ReservationResource | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM reservation_resources
      WHERE property_id = $1
        AND normalized_code = $2
      `,
      [propertyId, normalizedCode],
    );

    return result.rows[0]
      ? this.mapResource(result.rows[0])
      : null;
  }

  async listResources(
    filters: ReservationResourceFilters = {},
  ): Promise<ReservationResource[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    const equal = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);
      clauses.push(
        `${column} = $${values.length}`,
      );
    };

    if (filters.propertyId) {
      equal('property_id', filters.propertyId);
    }

    if (filters.zoneId) {
      equal('zone_id', filters.zoneId);
    }

    if (filters.spaceId) {
      equal('space_id', filters.spaceId);
    }

    if (filters.resourceType) {
      equal(
        'resource_type',
        filters.resourceType,
      );
    }

    if (
      typeof filters.isActive === 'boolean'
    ) {
      equal('is_active', filters.isActive);
    }

    if (filters.search?.trim()) {
      values.push(
        `%${filters.search.trim()}%`,
      );

      clauses.push(
        `(
          code ILIKE $${values.length}
          OR name ILIKE $${values.length}
          OR description ILIKE $${values.length}
        )`,
      );
    }

    const where =
      clauses.length > 0
        ? `WHERE ${clauses.join(' AND ')}`
        : '';

    const result = await this.pool.query(
      `
      SELECT *
      FROM reservation_resources
      ${where}
      ORDER BY name ASC, created_at DESC
      `,
      values,
    );

    return result.rows.map((row) =>
      this.mapResource(row),
    );
  }

  async updateResource(
    id: string,
    input: Partial<ReservationResource>,
  ): Promise<ReservationResource | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    const add = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);
      fields.push(
        `${column} = $${values.length}`,
      );
    };

    if (input.zoneId !== undefined) {
      add('zone_id', input.zoneId ?? null);
    }

    if (input.spaceId !== undefined) {
      add('space_id', input.spaceId ?? null);
    }

    if (input.name !== undefined) {
      add('name', input.name);
    }

    if (input.description !== undefined) {
      add(
        'description',
        input.description ?? null,
      );
    }

    if (input.resourceType !== undefined) {
      add(
        'resource_type',
        input.resourceType,
      );
    }

    if (input.capacity !== undefined) {
      add('capacity', input.capacity);
    }

    if (
      input.requiresApproval !== undefined
    ) {
      add(
        'requires_approval',
        input.requiresApproval,
      );
    }

    if (input.isActive !== undefined) {
      add('is_active', input.isActive);
    }

    if (
      input.minimumDurationMinutes !==
      undefined
    ) {
      add(
        'minimum_duration_minutes',
        input.minimumDurationMinutes,
      );
    }

    if (
      input.maximumDurationMinutes !==
      undefined
    ) {
      add(
        'maximum_duration_minutes',
        input.maximumDurationMinutes ?? null,
      );
    }

    if (
      input.bookingIntervalMinutes !==
      undefined
    ) {
      add(
        'booking_interval_minutes',
        input.bookingIntervalMinutes,
      );
    }

    if (
      input.advanceBookingDays !==
      undefined
    ) {
      add(
        'advance_booking_days',
        input.advanceBookingDays,
      );
    }

    if (
      input.minimumNoticeMinutes !==
      undefined
    ) {
      add(
        'minimum_notice_minutes',
        input.minimumNoticeMinutes,
      );
    }

    if (input.openingTime !== undefined) {
      add(
        'opening_time',
        input.openingTime ?? null,
      );
    }

    if (input.closingTime !== undefined) {
      add(
        'closing_time',
        input.closingTime ?? null,
      );
    }

    if (fields.length === 0) {
      return this.findResourceById(id);
    }

    add('updated_at', new Date());

    values.push(id);

    const result = await this.pool.query(
      `
      UPDATE reservation_resources
      SET ${fields.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
      `,
      values,
    );

    return result.rows[0]
      ? this.mapResource(result.rows[0])
      : null;
  }

  async createReservation(
    reservation: Reservation,
  ): Promise<Reservation> {
    const result = await this.pool.query(
      `
      INSERT INTO reservations (
        id,
        reservation_number,
        resource_id,
        property_id,
        requester_person_id,
        beneficiary_person_id,
        title,
        description,
        start_at,
        end_at,
        attendee_count,
        status,
        approval_required,
        approved_by_person_id,
        approved_at,
        rejected_by_person_id,
        rejected_at,
        rejection_reason,
        cancelled_by_person_id,
        cancelled_at,
        cancellation_reason,
        checked_in_at,
        completed_at,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,
        $19,$20,$21,$22,$23,$24,$25,$26
      )
      RETURNING *
      `,
      [
        reservation.id,
        reservation.reservationNumber,
        reservation.resourceId,
        reservation.propertyId,
        reservation.requesterPersonId,
        reservation.beneficiaryPersonId ?? null,
        reservation.title,
        reservation.description ?? null,
        reservation.startAt,
        reservation.endAt,
        reservation.attendeeCount,
        reservation.status,
        reservation.approvalRequired,
        reservation.approvedByPersonId ?? null,
        reservation.approvedAt ?? null,
        reservation.rejectedByPersonId ?? null,
        reservation.rejectedAt ?? null,
        reservation.rejectionReason ?? null,
        reservation.cancelledByPersonId ?? null,
        reservation.cancelledAt ?? null,
        reservation.cancellationReason ?? null,
        reservation.checkedInAt ?? null,
        reservation.completedAt ?? null,
        reservation.notes ?? null,
        reservation.createdAt,
        reservation.updatedAt,
      ],
    );

    return this.mapReservation(
      result.rows[0],
    );
  }

  async findReservationById(
    id: string,
  ): Promise<Reservation | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM reservations
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0]
      ? this.mapReservation(result.rows[0])
      : null;
  }

  async findReservationDetailsById(
    id: string,
  ): Promise<ReservationDetails | null> {
    const reservation =
      await this.findReservationById(id);

    if (!reservation) {
      return null;
    }

    const [resource, history] =
      await Promise.all([
        this.findResourceById(
          reservation.resourceId,
        ),
        this.listHistory(id),
      ]);

    return {
      ...reservation,
      resource: resource ?? undefined,
      history,
    };
  }

  async listReservations(
    filters: ReservationFilters = {},
  ): Promise<Reservation[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    const equal = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);
      clauses.push(
        `${column} = $${values.length}`,
      );
    };

    if (filters.propertyId) {
      equal('property_id', filters.propertyId);
    }

    if (filters.resourceId) {
      equal('resource_id', filters.resourceId);
    }

    if (filters.requesterPersonId) {
      equal(
        'requester_person_id',
        filters.requesterPersonId,
      );
    }

    if (filters.beneficiaryPersonId) {
      equal(
        'beneficiary_person_id',
        filters.beneficiaryPersonId,
      );
    }

    if (filters.status) {
      equal('status', filters.status);
    }

    if (filters.startsFrom) {
      values.push(filters.startsFrom);
      clauses.push(
        `end_at > $${values.length}`,
      );
    }

    if (filters.startsUntil) {
      values.push(filters.startsUntil);
      clauses.push(
        `start_at < $${values.length}`,
      );
    }

    if (filters.search?.trim()) {
      values.push(
        `%${filters.search.trim()}%`,
      );

      clauses.push(
        `(
          reservation_number
            ILIKE $${values.length}
          OR title ILIKE $${values.length}
          OR description
            ILIKE $${values.length}
        )`,
      );
    }

    const where =
      clauses.length > 0
        ? `WHERE ${clauses.join(' AND ')}`
        : '';

    const result = await this.pool.query(
      `
      SELECT *
      FROM reservations
      ${where}
      ORDER BY start_at ASC, created_at DESC
      `,
      values,
    );

    return result.rows.map((row) =>
      this.mapReservation(row),
    );
  }

  async updateReservation(
    id: string,
    input: Partial<Reservation>,
  ): Promise<Reservation | null> {
    const fields: string[] = [];
    const values: unknown[] = [];

    const add = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);
      fields.push(
        `${column} = $${values.length}`,
      );
    };

    if (
      input.beneficiaryPersonId !==
      undefined
    ) {
      add(
        'beneficiary_person_id',
        input.beneficiaryPersonId ?? null,
      );
    }

    if (input.title !== undefined) {
      add('title', input.title);
    }

    if (input.description !== undefined) {
      add(
        'description',
        input.description ?? null,
      );
    }

    if (input.startAt !== undefined) {
      add('start_at', input.startAt);
    }

    if (input.endAt !== undefined) {
      add('end_at', input.endAt);
    }

    if (input.attendeeCount !== undefined) {
      add(
        'attendee_count',
        input.attendeeCount,
      );
    }

    if (input.notes !== undefined) {
      add('notes', input.notes ?? null);
    }

    if (fields.length === 0) {
      return this.findReservationById(id);
    }

    add('updated_at', new Date());

    values.push(id);

    const result = await this.pool.query(
      `
      UPDATE reservations
      SET ${fields.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
      `,
      values,
    );

    return result.rows[0]
      ? this.mapReservation(result.rows[0])
      : null;
  }

  async updateReservationStatus(
    id: string,
    status: ReservationStatus,
    input: Partial<Reservation> = {},
  ): Promise<Reservation | null> {
    const fields: string[] = [
      'status = $1',
    ];
    const values: unknown[] = [status];

    const add = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);
      fields.push(
        `${column} = $${values.length}`,
      );
    };

    if (
      input.approvedByPersonId !== undefined
    ) {
      add(
        'approved_by_person_id',
        input.approvedByPersonId ?? null,
      );
    }

    if (input.approvedAt !== undefined) {
      add(
        'approved_at',
        input.approvedAt ?? null,
      );
    }

    if (
      input.rejectedByPersonId !== undefined
    ) {
      add(
        'rejected_by_person_id',
        input.rejectedByPersonId ?? null,
      );
    }

    if (input.rejectedAt !== undefined) {
      add(
        'rejected_at',
        input.rejectedAt ?? null,
      );
    }

    if (
      input.rejectionReason !== undefined
    ) {
      add(
        'rejection_reason',
        input.rejectionReason ?? null,
      );
    }

    if (
      input.cancelledByPersonId !==
      undefined
    ) {
      add(
        'cancelled_by_person_id',
        input.cancelledByPersonId ?? null,
      );
    }

    if (input.cancelledAt !== undefined) {
      add(
        'cancelled_at',
        input.cancelledAt ?? null,
      );
    }

    if (
      input.cancellationReason !==
      undefined
    ) {
      add(
        'cancellation_reason',
        input.cancellationReason ?? null,
      );
    }

    if (input.checkedInAt !== undefined) {
      add(
        'checked_in_at',
        input.checkedInAt ?? null,
      );
    }

    if (input.completedAt !== undefined) {
      add(
        'completed_at',
        input.completedAt ?? null,
      );
    }

    add('updated_at', new Date());

    values.push(id);

    const result = await this.pool.query(
      `
      UPDATE reservations
      SET ${fields.join(', ')}
      WHERE id = $${values.length}
      RETURNING *
      `,
      values,
    );

    return result.rows[0]
      ? this.mapReservation(result.rows[0])
      : null;
  }

  async addHistory(
    history: ReservationStatusHistory,
  ): Promise<ReservationStatusHistory> {
    const result = await this.pool.query(
      `
      INSERT INTO reservation_status_history (
        id,
        reservation_id,
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
        history.reservationId,
        history.fromStatus ?? null,
        history.toStatus,
        history.changedByPersonId,
        history.remarks ?? null,
        history.createdAt,
      ],
    );

    return this.mapHistory(result.rows[0]);
  }

  async listHistory(
    reservationId: string,
  ): Promise<ReservationStatusHistory[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM reservation_status_history
      WHERE reservation_id = $1
      ORDER BY created_at ASC
      `,
      [reservationId],
    );

    return result.rows.map((row) =>
      this.mapHistory(row),
    );
  }

  async createResourceBlock(
    block: ReservationResourceBlock,
  ): Promise<ReservationResourceBlock> {
    const result = await this.pool.query(
      `
      INSERT INTO
        reservation_resource_blocks (
          id,
          resource_id,
          start_at,
          end_at,
          reason,
          created_by_person_id,
          created_at
        )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        block.id,
        block.resourceId,
        block.startAt,
        block.endAt,
        block.reason,
        block.createdByPersonId,
        block.createdAt,
      ],
    );

    return this.mapBlock(result.rows[0]);
  }

  async listResourceBlocks(
    resourceId: string,
    startsFrom?: Date,
    startsUntil?: Date,
  ): Promise<ReservationResourceBlock[]> {
    const clauses = [
      'resource_id = $1',
    ];
    const values: unknown[] = [resourceId];

    if (startsFrom) {
      values.push(startsFrom);
      clauses.push(
        `end_at > $${values.length}`,
      );
    }

    if (startsUntil) {
      values.push(startsUntil);
      clauses.push(
        `start_at < $${values.length}`,
      );
    }

    const result = await this.pool.query(
      `
      SELECT *
      FROM reservation_resource_blocks
      WHERE ${clauses.join(' AND ')}
      ORDER BY start_at ASC
      `,
      values,
    );

    return result.rows.map((row) =>
      this.mapBlock(row),
    );
  }

  async findConflictingReservations(
    query: ReservationAvailabilityQuery,
  ): Promise<Reservation[]> {
    const values: unknown[] = [
      query.resourceId,
      query.startAt,
      query.endAt,
    ];

    let exclusion = '';

    if (query.excludeReservationId) {
      values.push(
        query.excludeReservationId,
      );

      exclusion =
        `AND id <> $${values.length}`;
    }

    const result = await this.pool.query(
      `
      SELECT *
      FROM reservations
      WHERE resource_id = $1
        AND start_at < $3
        AND end_at > $2
        AND status IN (
          'PENDING',
          'APPROVED',
          'CHECKED_IN'
        )
        ${exclusion}
      ORDER BY start_at ASC
      `,
      values,
    );

    return result.rows.map((row) =>
      this.mapReservation(row),
    );
  }

  async findConflictingBlocks(
    query: ReservationAvailabilityQuery,
  ): Promise<ReservationResourceBlock[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM reservation_resource_blocks
      WHERE resource_id = $1
        AND start_at < $3
        AND end_at > $2
      ORDER BY start_at ASC
      `,
      [
        query.resourceId,
        query.startAt,
        query.endAt,
      ],
    );

    return result.rows.map((row) =>
      this.mapBlock(row),
    );
  }

  async getMetrics(
    propertyId?: string,
  ): Promise<ReservationMetrics> {
    const values: unknown[] = [];
    let where = '';

    if (propertyId) {
      values.push(propertyId);
      where = 'WHERE property_id = $1';
    }

    const result = await this.pool.query(
      `
      SELECT
        COUNT(*)::INTEGER AS total,

        COUNT(*) FILTER (
          WHERE status = 'PENDING'
        )::INTEGER AS pending,

        COUNT(*) FILTER (
          WHERE status = 'APPROVED'
        )::INTEGER AS approved,

        COUNT(*) FILTER (
          WHERE status = 'CHECKED_IN'
        )::INTEGER AS checked_in,

        COUNT(*) FILTER (
          WHERE status = 'COMPLETED'
        )::INTEGER AS completed,

        COUNT(*) FILTER (
          WHERE status = 'CANCELLED'
        )::INTEGER AS cancelled,

        COUNT(*) FILTER (
          WHERE status = 'REJECTED'
        )::INTEGER AS rejected,

        COUNT(*) FILTER (
          WHERE status = 'NO_SHOW'
        )::INTEGER AS no_show,

        COUNT(*) FILTER (
          WHERE start_at > NOW()
            AND status IN (
              'PENDING',
              'APPROVED'
            )
        )::INTEGER AS upcoming
      FROM reservations
      ${where}
      `,
      values,
    );

    const row = result.rows[0];

    return {
      total: Number(row.total ?? 0),
      pending: Number(row.pending ?? 0),
      approved: Number(row.approved ?? 0),
      checkedIn: Number(
        row.checked_in ?? 0,
      ),
      completed: Number(
        row.completed ?? 0,
      ),
      cancelled: Number(
        row.cancelled ?? 0,
      ),
      rejected: Number(
        row.rejected ?? 0,
      ),
      noShow: Number(row.no_show ?? 0),
      upcoming: Number(row.upcoming ?? 0),
    };
  }

  private mapResource(
    row: Record<string, unknown>,
  ): ReservationResource {
    return {
      id: String(row.id),
      propertyId: String(row.property_id),
      zoneId: row.zone_id
        ? String(row.zone_id)
        : undefined,
      spaceId: row.space_id
        ? String(row.space_id)
        : undefined,
      code: String(row.code),
      normalizedCode: String(
        row.normalized_code,
      ),
      name: String(row.name),
      description: row.description
        ? String(row.description)
        : undefined,
      resourceType:
        row.resource_type as ReservationResourceType,
      capacity: Number(row.capacity),
      requiresApproval: Boolean(
        row.requires_approval,
      ),
      isActive: Boolean(row.is_active),
      minimumDurationMinutes: Number(
        row.minimum_duration_minutes,
      ),
      maximumDurationMinutes:
        row.maximum_duration_minutes === null ||
        row.maximum_duration_minutes ===
          undefined
          ? undefined
          : Number(
              row.maximum_duration_minutes,
            ),
      bookingIntervalMinutes: Number(
        row.booking_interval_minutes,
      ),
      advanceBookingDays: Number(
        row.advance_booking_days,
      ),
      minimumNoticeMinutes: Number(
        row.minimum_notice_minutes,
      ),
      openingTime: row.opening_time
        ? String(row.opening_time)
        : undefined,
      closingTime: row.closing_time
        ? String(row.closing_time)
        : undefined,
      createdAt: new Date(
        String(row.created_at),
      ),
      updatedAt: new Date(
        String(row.updated_at),
      ),
    };
  }

  private mapReservation(
    row: Record<string, unknown>,
  ): Reservation {
    return {
      id: String(row.id),
      reservationNumber: String(
        row.reservation_number,
      ),
      resourceId: String(row.resource_id),
      propertyId: String(row.property_id),
      requesterPersonId: String(
        row.requester_person_id,
      ),
      beneficiaryPersonId:
        row.beneficiary_person_id
          ? String(
              row.beneficiary_person_id,
            )
          : undefined,
      title: String(row.title),
      description: row.description
        ? String(row.description)
        : undefined,
      startAt: new Date(
        String(row.start_at),
      ),
      endAt: new Date(String(row.end_at)),
      attendeeCount: Number(
        row.attendee_count,
      ),
      status:
        row.status as ReservationStatus,
      approvalRequired: Boolean(
        row.approval_required,
      ),
      approvedByPersonId:
        row.approved_by_person_id
          ? String(
              row.approved_by_person_id,
            )
          : undefined,
      approvedAt: row.approved_at
        ? new Date(String(row.approved_at))
        : undefined,
      rejectedByPersonId:
        row.rejected_by_person_id
          ? String(
              row.rejected_by_person_id,
            )
          : undefined,
      rejectedAt: row.rejected_at
        ? new Date(String(row.rejected_at))
        : undefined,
      rejectionReason:
        row.rejection_reason
          ? String(row.rejection_reason)
          : undefined,
      cancelledByPersonId:
        row.cancelled_by_person_id
          ? String(
              row.cancelled_by_person_id,
            )
          : undefined,
      cancelledAt: row.cancelled_at
        ? new Date(
            String(row.cancelled_at),
          )
        : undefined,
      cancellationReason:
        row.cancellation_reason
          ? String(
              row.cancellation_reason,
            )
          : undefined,
      checkedInAt: row.checked_in_at
        ? new Date(
            String(row.checked_in_at),
          )
        : undefined,
      completedAt: row.completed_at
        ? new Date(
            String(row.completed_at),
          )
        : undefined,
      notes: row.notes
        ? String(row.notes)
        : undefined,
      createdAt: new Date(
        String(row.created_at),
      ),
      updatedAt: new Date(
        String(row.updated_at),
      ),
    };
  }

  private mapHistory(
    row: Record<string, unknown>,
  ): ReservationStatusHistory {
    return {
      id: String(row.id),
      reservationId: String(
        row.reservation_id,
      ),
      fromStatus: row.from_status
        ? (row.from_status as ReservationStatus)
        : undefined,
      toStatus:
        row.to_status as ReservationStatus,
      changedByPersonId: String(
        row.changed_by_person_id,
      ),
      remarks: row.remarks
        ? String(row.remarks)
        : undefined,
      createdAt: new Date(
        String(row.created_at),
      ),
    };
  }

  private mapBlock(
    row: Record<string, unknown>,
  ): ReservationResourceBlock {
    return {
      id: String(row.id),
      resourceId: String(row.resource_id),
      startAt: new Date(
        String(row.start_at),
      ),
      endAt: new Date(String(row.end_at)),
      reason: String(row.reason),
      createdByPersonId: String(
        row.created_by_person_id,
      ),
      createdAt: new Date(
        String(row.created_at),
      ),
    };
  }
}
