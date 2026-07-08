import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres/postgres.types';
import {
  BasePostgresRepository,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../../platform';
import { PropertyRepository } from './property.repository';
import { Property, Space, Zone } from '../types/property.types';

@Injectable()
export class PostgresPropertyRepository
  extends BasePostgresRepository
  implements PropertyRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {
    super();
  }

  async createProperty(property: Property): Promise<Property> {
    const result = await this.pool.query(
      `
      INSERT INTO properties (
        id, name, code, property_type, description,
        address_line1, address_line2, city, state, country, postal_code,
        is_active, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *
      `,
      [
        property.id,
        property.name,
        property.code ?? null,
        property.propertyType ?? null,
        property.description ?? null,
        property.addressLine1 ?? null,
        property.addressLine2 ?? null,
        property.city ?? null,
        property.state ?? null,
        property.country ?? null,
        property.postalCode ?? null,
        property.isActive,
        property.createdAt,
        property.updatedAt,
      ],
    );

    return this.mapProperty(result.rows[0]);
  }

  async findPropertyById(id: string): Promise<Property | null> {
    const result = await this.pool.query(
      `SELECT * FROM properties WHERE id = $1`,
      [id],
    );

    return result.rows[0] ? this.mapProperty(result.rows[0]) : null;
  }

  async listProperties(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Property>> {
    const paginatedQuery = this.buildPaginatedQuery(query, {
      tableName: 'properties',
      searchableColumns: [
        'name',
        'code',
        'property_type',
        'city',
        'state',
        'country',
      ],
      sortableColumns: {
        name: 'name',
        code: 'code',
        propertyType: 'property_type',
        city: 'city',
        state: 'state',
        country: 'country',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      defaultSortColumn: 'created_at',
      mapRow: (row) => this.mapProperty(row),
    });

    const countValues = paginatedQuery.values.slice(0, -2);

    const [itemsResult, countResult] = await Promise.all([
      this.pool.query(paginatedQuery.itemsSql, paginatedQuery.values),
      this.pool.query(paginatedQuery.countSql, countValues),
    ]);

    const total = Number(countResult.rows[0]?.total ?? 0);

    return this.toPaginatedResponse(
      itemsResult.rows,
      total,
      paginatedQuery.page,
      paginatedQuery.limit,
      (row) => this.mapProperty(row),
    );
  }

  async createZone(zone: Zone): Promise<Zone> {
    const result = await this.pool.query(
      `
      INSERT INTO zones (
        id, property_id, name, code, zone_type, description,
        is_active, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        zone.id,
        zone.propertyId,
        zone.name,
        zone.code ?? null,
        zone.zoneType ?? null,
        zone.description ?? null,
        zone.isActive,
        zone.createdAt,
        zone.updatedAt,
      ],
    );

    return this.mapZone(result.rows[0]);
  }

  async listZonesByProperty(propertyId: string): Promise<Zone[]> {
    const result = await this.pool.query(
      `SELECT * FROM zones WHERE property_id = $1 ORDER BY created_at DESC`,
      [propertyId],
    );

    return result.rows.map((row) => this.mapZone(row));
  }

  async createSpace(space: Space): Promise<Space> {
    const result = await this.pool.query(
      `
      INSERT INTO spaces (
        id, property_id, zone_id, name, code, space_type, floor, description,
        is_active, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
      `,
      [
        space.id,
        space.propertyId,
        space.zoneId ?? null,
        space.name,
        space.code ?? null,
        space.spaceType ?? null,
        space.floor ?? null,
        space.description ?? null,
        space.isActive,
        space.createdAt,
        space.updatedAt,
      ],
    );

    return this.mapSpace(result.rows[0]);
  }

  async listSpacesByProperty(propertyId: string): Promise<Space[]> {
    const result = await this.pool.query(
      `SELECT * FROM spaces WHERE property_id = $1 ORDER BY created_at DESC`,
      [propertyId],
    );

    return result.rows.map((row) => this.mapSpace(row));
  }

  private mapProperty(row: any): Property {
    return {
      id: row.id,
      name: row.name,
      code: row.code ?? undefined,
      propertyType: row.property_type ?? undefined,
      description: row.description ?? undefined,
      addressLine1: row.address_line1 ?? undefined,
      addressLine2: row.address_line2 ?? undefined,
      city: row.city ?? undefined,
      state: row.state ?? undefined,
      country: row.country ?? undefined,
      postalCode: row.postal_code ?? undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapZone(row: any): Zone {
    return {
      id: row.id,
      propertyId: row.property_id,
      name: row.name,
      code: row.code ?? undefined,
      zoneType: row.zone_type ?? undefined,
      description: row.description ?? undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapSpace(row: any): Space {
    return {
      id: row.id,
      propertyId: row.property_id,
      zoneId: row.zone_id ?? undefined,
      name: row.name,
      code: row.code ?? undefined,
      spaceType: row.space_type ?? undefined,
      floor: row.floor ?? undefined,
      description: row.description ?? undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
