import { Inject, Injectable } from "@nestjs/common";
import { Pool } from "pg";

import { POSTGRES_POOL } from "../../../database/postgres";
import {
  Staff,
  StaffAttendance,
  StaffDetails,
  StaffFilters,
  StaffMetrics,
  StaffStatus,
  StaffStatusUpdate,
} from "../types/staff.types";
import { StaffRepository } from "./staff.repository";

@Injectable()
export class PostgresStaffRepository implements StaffRepository {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(staff: Staff): Promise<Staff> {
    const result = await this.pool.query(
      `
      INSERT INTO staff_members (
        id,
        employee_code,
        normalized_employee_code,
        person_id,
        staff_type,
        property_id,
        zone_id,
        employer_name,
        department,
        designation,
        shift_name,
        id_card_number,
        qr_code,
        rfid_tag,
        status,
        verified_by_person_id,
        verified_at,
        notes,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20
      )
      RETURNING *
      `,
      [
        staff.id,
        staff.employeeCode,
        staff.normalizedEmployeeCode,
        staff.personId,
        staff.staffType,
        staff.propertyId,
        staff.zoneId ?? null,
        staff.employerName ?? null,
        staff.department ?? null,
        staff.designation ?? null,
        staff.shiftName ?? null,
        staff.idCardNumber ?? null,
        staff.qrCode ?? null,
        staff.rfidTag ?? null,
        staff.status,
        staff.verifiedByPersonId ?? null,
        staff.verifiedAt ?? null,
        staff.notes ?? null,
        staff.createdAt,
        staff.updatedAt,
      ],
    );

    return this.mapStaff(result.rows[0]);
  }

  async findById(id: string): Promise<Staff | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM staff_members
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0] ? this.mapStaff(result.rows[0]) : null;
  }

  async findDetailsById(id: string): Promise<StaffDetails | null> {
    const staff = await this.findById(id);

    if (!staff) {
      return null;
    }

    return {
      ...staff,
      attendance: await this.listAttendance(id),
    };
  }

  async findByNormalizedEmployeeCode(
    propertyId: string,
    normalizedEmployeeCode: string,
  ): Promise<Staff | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM staff_members
      WHERE property_id = $1
        AND normalized_employee_code = $2
      LIMIT 1
      `,
      [propertyId, normalizedEmployeeCode],
    );

    return result.rows[0] ? this.mapStaff(result.rows[0]) : null;
  }

  async findByIdCardNumber(
    propertyId: string,
    idCardNumber: string,
  ): Promise<Staff | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM staff_members
      WHERE property_id = $1
        AND id_card_number = $2
      LIMIT 1
      `,
      [propertyId, idCardNumber],
    );

    return result.rows[0] ? this.mapStaff(result.rows[0]) : null;
  }

  async findByQrCode(qrCode: string): Promise<Staff | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM staff_members
      WHERE qr_code = $1
      LIMIT 1
      `,
      [qrCode],
    );

    return result.rows[0] ? this.mapStaff(result.rows[0]) : null;
  }

  async findByRfidTag(rfidTag: string): Promise<Staff | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM staff_members
      WHERE rfid_tag = $1
      LIMIT 1
      `,
      [rfidTag],
    );

    return result.rows[0] ? this.mapStaff(result.rows[0]) : null;
  }

  async list(filters: StaffFilters = {}): Promise<Staff[]> {
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

    if (filters.personId) {
      equal("person_id", filters.personId);
    }

    if (filters.staffType) {
      equal("staff_type", filters.staffType);
    }

    if (filters.status) {
      equal("status", filters.status);
    }

    if (filters.employeeCode) {
      equal("normalized_employee_code", filters.employeeCode);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      const parameter = `$${values.length}`;

      clauses.push(
        `(
          employee_code ILIKE ${parameter}
          OR normalized_employee_code ILIKE ${parameter}
          OR employer_name ILIKE ${parameter}
          OR department ILIKE ${parameter}
          OR designation ILIKE ${parameter}
          OR shift_name ILIKE ${parameter}
          OR id_card_number ILIKE ${parameter}
          OR qr_code ILIKE ${parameter}
          OR rfid_tag ILIKE ${parameter}
        )`,
      );
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";

    const result = await this.pool.query(
      `
      SELECT *
      FROM staff_members
      ${where}
      ORDER BY created_at DESC
      `,
      values,
    );

    return result.rows.map((row) => this.mapStaff(row));
  }

  async update(id: string, input: Partial<Staff>): Promise<Staff | null> {
    const current = await this.findById(id);

    if (!current) {
      return null;
    }

    const merged: Staff = {
      ...current,
      ...input,
      id: current.id,
      employeeCode: current.employeeCode,
      normalizedEmployeeCode: current.normalizedEmployeeCode,
      propertyId: current.propertyId,
      status: current.status,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    };

    const result = await this.pool.query(
      `
      UPDATE staff_members
      SET
        person_id = $2,
        staff_type = $3,
        zone_id = $4,
        employer_name = $5,
        department = $6,
        designation = $7,
        shift_name = $8,
        id_card_number = $9,
        qr_code = $10,
        rfid_tag = $11,
        notes = $12,
        updated_at = $13
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        merged.personId,
        merged.staffType,
        merged.zoneId ?? null,
        merged.employerName ?? null,
        merged.department ?? null,
        merged.designation ?? null,
        merged.shiftName ?? null,
        merged.idCardNumber ?? null,
        merged.qrCode ?? null,
        merged.rfidTag ?? null,
        merged.notes ?? null,
        merged.updatedAt,
      ],
    );

    return result.rows[0] ? this.mapStaff(result.rows[0]) : null;
  }

  async updateStatus(
    id: string,
    status: StaffStatus,
    input: StaffStatusUpdate = {},
  ): Promise<Staff | null> {
    const result = await this.pool.query(
      `
      UPDATE staff_members
      SET
        status = $2,
        verified_by_person_id = COALESCE(
          $3,
          verified_by_person_id
        ),
        verified_at = COALESCE(
          $4,
          verified_at
        ),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, status, input.verifiedByPersonId ?? null, input.verifiedAt ?? null],
    );

    return result.rows[0] ? this.mapStaff(result.rows[0]) : null;
  }

  async recordAttendance(
    attendance: StaffAttendance,
  ): Promise<StaffAttendance> {
    const result = await this.pool.query(
      `
      INSERT INTO staff_attendance (
        id,
        staff_id,
        attendance_type,
        gate,
        recorded_by_person_id,
        occurred_at,
        remarks,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        attendance.id,
        attendance.staffId,
        attendance.attendanceType,
        attendance.gate ?? null,
        attendance.recordedByPersonId,
        attendance.occurredAt,
        attendance.remarks ?? null,
        attendance.createdAt,
      ],
    );

    return this.mapAttendance(result.rows[0]);
  }

  async listAttendance(staffId: string): Promise<StaffAttendance[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM staff_attendance
      WHERE staff_id = $1
      ORDER BY
        occurred_at DESC,
        created_at DESC
      `,
      [staffId],
    );

    return result.rows.map((row) => this.mapAttendance(row));
  }

  async getMetrics(propertyId?: string): Promise<StaffMetrics> {
    const result = await this.pool.query(
      `
      WITH latest_attendance AS (
        SELECT DISTINCT ON (staff_id)
          staff_id,
          attendance_type
        FROM staff_attendance
        ORDER BY
          staff_id,
          occurred_at DESC,
          created_at DESC
      )
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE s.status = 'PENDING'
        ) AS pending,
        COUNT(*) FILTER (
          WHERE s.status = 'ACTIVE'
        ) AS active,
        COUNT(*) FILTER (
          WHERE s.status = 'INACTIVE'
        ) AS inactive,
        COUNT(*) FILTER (
          WHERE s.status = 'SUSPENDED'
        ) AS suspended,
        COUNT(*) FILTER (
          WHERE s.staff_type = 'SECURITY'
        ) AS security,
        COUNT(*) FILTER (
          WHERE s.staff_type = 'HOUSEKEEPING'
        ) AS housekeeping,
        COUNT(*) FILTER (
          WHERE s.staff_type = 'MAINTENANCE'
        ) AS maintenance,
        COUNT(*) FILTER (
          WHERE
            la.attendance_type = 'CHECK_IN'
        ) AS currently_inside
      FROM staff_members s
      LEFT JOIN latest_attendance la
        ON la.staff_id = s.id
      WHERE (
        $1::uuid IS NULL
        OR s.property_id = $1
      )
      `,
      [propertyId ?? null],
    );

    const row = result.rows[0] ?? {};

    return {
      total: Number(row.total ?? 0),
      pending: Number(row.pending ?? 0),
      active: Number(row.active ?? 0),
      inactive: Number(row.inactive ?? 0),
      suspended: Number(row.suspended ?? 0),
      security: Number(row.security ?? 0),
      housekeeping: Number(row.housekeeping ?? 0),
      maintenance: Number(row.maintenance ?? 0),
      currentlyInside: Number(row.currently_inside ?? 0),
    };
  }

  private mapStaff(row: any): Staff {
    return {
      id: row.id,
      employeeCode: row.employee_code,
      normalizedEmployeeCode: row.normalized_employee_code,
      personId: row.person_id,
      staffType: row.staff_type,
      propertyId: row.property_id,
      zoneId: row.zone_id ?? undefined,
      employerName: row.employer_name ?? undefined,
      department: row.department ?? undefined,
      designation: row.designation ?? undefined,
      shiftName: row.shift_name ?? undefined,
      idCardNumber: row.id_card_number ?? undefined,
      qrCode: row.qr_code ?? undefined,
      rfidTag: row.rfid_tag ?? undefined,
      status: row.status,
      verifiedByPersonId: row.verified_by_person_id ?? undefined,
      verifiedAt: row.verified_at ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapAttendance(row: any): StaffAttendance {
    return {
      id: row.id,
      staffId: row.staff_id,
      attendanceType: row.attendance_type,
      gate: row.gate ?? undefined,
      recordedByPersonId: row.recorded_by_person_id,
      occurredAt: row.occurred_at,
      remarks: row.remarks ?? undefined,
      createdAt: row.created_at,
    };
  }
}
