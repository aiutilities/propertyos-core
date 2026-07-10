import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import {
  BasePostgresRepository,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../../platform';
import { Tenant, TenantSpace } from '../types/tenant.types';
import { TenantRepository } from './tenant-repository.interface';

@Injectable()
export class PostgresTenantRepository
  extends BasePostgresRepository
  implements TenantRepository
{
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {
    super();
  }

  async createTenant(tenant: Tenant): Promise<Tenant> {
    const result = await this.pool.query(
      `
      INSERT INTO tenants (
        id,
        person_id,
        property_id,
        tenant_number,
        status,
        move_in_date,
        move_out_date,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
      `,
      [
        tenant.id,
        tenant.personId,
        tenant.propertyId,
        tenant.tenantNumber,
        tenant.status,
        tenant.moveInDate ?? null,
        tenant.moveOutDate ?? null,
        tenant.createdAt,
        tenant.updatedAt,
      ],
    );

    return this.mapTenant(result.rows[0]);
  }

  async listTenants(): Promise<Tenant[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM tenants
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapTenant(row));
  }

  async listTenantsPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Tenant>> {
    const paginatedQuery = this.buildPaginatedQuery(query, {
      tableName: 'tenants',
      searchableColumns: [
        'tenant_number',
        'status',
      ],
      sortableColumns: {
        tenantNumber: 'tenant_number',
        status: 'status',
        moveInDate: 'move_in_date',
        moveOutDate: 'move_out_date',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      defaultSortColumn: 'created_at',
      mapRow: (row) => this.mapTenant(row),
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
      (row) => this.mapTenant(row),
    );
  }

  async findTenantById(id: string): Promise<Tenant | undefined> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM tenants
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0]
      ? this.mapTenant(result.rows[0])
      : undefined;
  }

  async assignSpace(
    tenantSpace: TenantSpace,
  ): Promise<TenantSpace> {
    const result = await this.pool.query(
      `
      INSERT INTO tenant_spaces (
        id,
        tenant_id,
        space_id,
        assigned_at,
        released_at,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        tenantSpace.id,
        tenantSpace.tenantId,
        tenantSpace.spaceId,
        tenantSpace.assignedAt,
        tenantSpace.releasedAt ?? null,
        tenantSpace.createdAt,
        tenantSpace.updatedAt,
      ],
    );

    return this.mapTenantSpace(result.rows[0]);
  }

  async listTenantSpaces(
    tenantId: string,
  ): Promise<TenantSpace[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM tenant_spaces
      WHERE tenant_id = $1
      ORDER BY assigned_at DESC
      `,
      [tenantId],
    );

    return result.rows.map((row) =>
      this.mapTenantSpace(row),
    );
  }

  private mapTenant(row: any): Tenant {
    return {
      id: row.id,
      personId: row.person_id,
      propertyId: row.property_id,
      tenantNumber: row.tenant_number,
      status: row.status,
      moveInDate: row.move_in_date ?? undefined,
      moveOutDate: row.move_out_date ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapTenantSpace(row: any): TenantSpace {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      spaceId: row.space_id,
      assignedAt: row.assigned_at,
      releasedAt: row.released_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
