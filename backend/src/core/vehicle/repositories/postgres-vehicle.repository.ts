import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import {
  Vehicle,
  VehicleDetails,
  VehicleFilters,
  VehicleMetrics,
  VehicleMovement,
  VehicleStatus,
} from '../types/vehicle.types';
import { VehicleRepository } from './vehicle.repository';

@Injectable()
export class PostgresVehicleRepository
  implements VehicleRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(vehicle: Vehicle): Promise<Vehicle> {
    const result = await this.pool.query(
      `
      INSERT INTO vehicles (
        id,
        registration_number,
        normalized_registration_number,
        vehicle_type,
        owner_person_id,
        property_id,
        space_id,
        parking_slot,
        make,
        model,
        colour,
        year_of_manufacture,
        rfid_tag,
        status,
        verified_by_person_id,
        verified_at,
        rejection_reason,
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
        vehicle.id,
        vehicle.registrationNumber,
        vehicle.normalizedRegistrationNumber,
        vehicle.vehicleType,
        vehicle.ownerPersonId,
        vehicle.propertyId,
        vehicle.spaceId ?? null,
        vehicle.parkingSlot ?? null,
        vehicle.make ?? null,
        vehicle.model ?? null,
        vehicle.colour ?? null,
        vehicle.yearOfManufacture ?? null,
        vehicle.rfidTag ?? null,
        vehicle.status,
        vehicle.verifiedByPersonId ?? null,
        vehicle.verifiedAt ?? null,
        vehicle.rejectionReason ?? null,
        vehicle.notes ?? null,
        vehicle.createdAt,
        vehicle.updatedAt,
      ],
    );

    return this.mapVehicle(result.rows[0]);
  }

  async findById(id: string): Promise<Vehicle | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM vehicles
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0]
      ? this.mapVehicle(result.rows[0])
      : null;
  }

  async findDetailsById(
    id: string,
  ): Promise<VehicleDetails | null> {
    const vehicle = await this.findById(id);

    if (!vehicle) {
      return null;
    }

    return {
      ...vehicle,
      movements: await this.listMovements(id),
    };
  }

  async findByNormalizedRegistration(
    normalizedRegistrationNumber: string,
  ): Promise<Vehicle | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM vehicles
      WHERE normalized_registration_number = $1
      LIMIT 1
      `,
      [normalizedRegistrationNumber],
    );

    return result.rows[0]
      ? this.mapVehicle(result.rows[0])
      : null;
  }

  async list(
    filters: VehicleFilters = {},
  ): Promise<Vehicle[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    const equal = (column: string, value: unknown) => {
      values.push(value);
      clauses.push(`${column} = $${values.length}`);
    };

    if (filters.propertyId) {
      equal('property_id', filters.propertyId);
    }

    if (filters.spaceId) {
      equal('space_id', filters.spaceId);
    }

    if (filters.ownerPersonId) {
      equal('owner_person_id', filters.ownerPersonId);
    }

    if (filters.vehicleType) {
      equal('vehicle_type', filters.vehicleType);
    }

    if (filters.status) {
      equal('status', filters.status);
    }

    if (filters.registrationNumber) {
      equal(
        'normalized_registration_number',
        filters.registrationNumber,
      );
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      clauses.push(
        `(registration_number ILIKE $${values.length}
          OR normalized_registration_number ILIKE $${values.length}
          OR make ILIKE $${values.length}
          OR model ILIKE $${values.length}
          OR colour ILIKE $${values.length}
          OR parking_slot ILIKE $${values.length}
          OR rfid_tag ILIKE $${values.length})`,
      );
    }

    const where =
      clauses.length > 0
        ? `WHERE ${clauses.join(' AND ')}`
        : '';

    const result = await this.pool.query(
      `
      SELECT *
      FROM vehicles
      ${where}
      ORDER BY created_at DESC
      `,
      values,
    );

    return result.rows.map((row) =>
      this.mapVehicle(row),
    );
  }

  async update(
    id: string,
    input: Partial<Vehicle>,
  ): Promise<Vehicle | null> {
    const current = await this.findById(id);

    if (!current) {
      return null;
    }

    const merged: Vehicle = {
      ...current,
      ...input,
      id: current.id,
      registrationNumber:
        current.registrationNumber,
      normalizedRegistrationNumber:
        current.normalizedRegistrationNumber,
      propertyId: current.propertyId,
      status: current.status,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    };

    const result = await this.pool.query(
      `
      UPDATE vehicles
      SET
        vehicle_type = $2,
        owner_person_id = $3,
        space_id = $4,
        parking_slot = $5,
        make = $6,
        model = $7,
        colour = $8,
        year_of_manufacture = $9,
        rfid_tag = $10,
        notes = $11,
        updated_at = $12
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        merged.vehicleType,
        merged.ownerPersonId,
        merged.spaceId ?? null,
        merged.parkingSlot ?? null,
        merged.make ?? null,
        merged.model ?? null,
        merged.colour ?? null,
        merged.yearOfManufacture ?? null,
        merged.rfidTag ?? null,
        merged.notes ?? null,
        merged.updatedAt,
      ],
    );

    return result.rows[0]
      ? this.mapVehicle(result.rows[0])
      : null;
  }

  async updateStatus(
    id: string,
    status: VehicleStatus,
    input: {
      verifiedByPersonId?: string;
      verifiedAt?: Date;
      rejectionReason?: string;
    } = {},
  ): Promise<Vehicle | null> {
    const result = await this.pool.query(
      `
      UPDATE vehicles
      SET
        status = $2,
        verified_by_person_id = $3,
        verified_at = $4,
        rejection_reason = $5,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        status,
        input.verifiedByPersonId ?? null,
        input.verifiedAt ?? null,
        input.rejectionReason ?? null,
      ],
    );

    return result.rows[0]
      ? this.mapVehicle(result.rows[0])
      : null;
  }

  async recordMovement(
    movement: VehicleMovement,
  ): Promise<VehicleMovement> {
    const result = await this.pool.query(
      `
      INSERT INTO vehicle_movements (
        id,
        vehicle_id,
        movement_type,
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
        movement.id,
        movement.vehicleId,
        movement.movementType,
        movement.gate ?? null,
        movement.recordedByPersonId,
        movement.occurredAt,
        movement.remarks ?? null,
        movement.createdAt,
      ],
    );

    return this.mapMovement(result.rows[0]);
  }

  async listMovements(
    vehicleId: string,
  ): Promise<VehicleMovement[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM vehicle_movements
      WHERE vehicle_id = $1
      ORDER BY occurred_at DESC, created_at DESC
      `,
      [vehicleId],
    );

    return result.rows.map((row) =>
      this.mapMovement(row),
    );
  }

  async getMetrics(
    propertyId?: string,
  ): Promise<VehicleMetrics> {
    const result = await this.pool.query(
      `
      WITH latest_movements AS (
        SELECT DISTINCT ON (vehicle_id)
          vehicle_id,
          movement_type
        FROM vehicle_movements
        ORDER BY
          vehicle_id,
          occurred_at DESC,
          created_at DESC
      )
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE v.status = 'PENDING'
        ) AS pending,
        COUNT(*) FILTER (
          WHERE v.status = 'VERIFIED'
        ) AS verified,
        COUNT(*) FILTER (
          WHERE v.status = 'SUSPENDED'
        ) AS suspended,
        COUNT(*) FILTER (
          WHERE v.vehicle_type = 'TWO_WHEELER'
        ) AS two_wheelers,
        COUNT(*) FILTER (
          WHERE v.vehicle_type = 'CAR'
        ) AS cars,
        COUNT(*) FILTER (
          WHERE v.vehicle_type = 'COMMERCIAL'
        ) AS commercial,
        COUNT(*) FILTER (
          WHERE lm.movement_type = 'ENTRY'
        ) AS currently_inside
      FROM vehicles v
      LEFT JOIN latest_movements lm
        ON lm.vehicle_id = v.id
      WHERE ($1::uuid IS NULL OR v.property_id = $1)
      `,
      [propertyId ?? null],
    );

    const row = result.rows[0] ?? {};

    return {
      total: Number(row.total ?? 0),
      pending: Number(row.pending ?? 0),
      verified: Number(row.verified ?? 0),
      suspended: Number(row.suspended ?? 0),
      twoWheelers: Number(row.two_wheelers ?? 0),
      cars: Number(row.cars ?? 0),
      commercial: Number(row.commercial ?? 0),
      currentlyInside: Number(
        row.currently_inside ?? 0,
      ),
    };
  }

  private mapVehicle(row: any): Vehicle {
    return {
      id: row.id,
      registrationNumber: row.registration_number,
      normalizedRegistrationNumber:
        row.normalized_registration_number,
      vehicleType: row.vehicle_type,
      ownerPersonId: row.owner_person_id,
      propertyId: row.property_id,
      spaceId: row.space_id ?? undefined,
      parkingSlot: row.parking_slot ?? undefined,
      make: row.make ?? undefined,
      model: row.model ?? undefined,
      colour: row.colour ?? undefined,
      yearOfManufacture:
        row.year_of_manufacture ?? undefined,
      rfidTag: row.rfid_tag ?? undefined,
      status: row.status,
      verifiedByPersonId:
        row.verified_by_person_id ?? undefined,
      verifiedAt: row.verified_at ?? undefined,
      rejectionReason:
        row.rejection_reason ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapMovement(row: any): VehicleMovement {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      movementType: row.movement_type,
      gate: row.gate ?? undefined,
      recordedByPersonId:
        row.recorded_by_person_id,
      occurredAt: row.occurred_at,
      remarks: row.remarks ?? undefined,
      createdAt: row.created_at,
    };
  }
}
