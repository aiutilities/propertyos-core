import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '@propertyos/core-contracts';
import {
  AssetCategory,
  AssetStatus,
  FacilityAsset,
  FacilityAssetDetails,
  FacilityAssetFilters,
  FacilityAssetHistory,
  PreventiveMaintenancePlan,
} from '../types/facility.types';
import { FacilityRepository } from './facility.repository';

@Injectable()
export class PostgresFacilityRepository
  implements FacilityRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async createCategory(
    category: AssetCategory,
  ): Promise<AssetCategory> {
    const result = await this.pool.query(
      `
      INSERT INTO asset_categories (
        id, code, name, description,
        is_active, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        category.id,
        category.code,
        category.name,
        category.description ?? null,
        category.isActive,
        category.createdAt,
        category.updatedAt,
      ],
    );

    return this.mapCategory(result.rows[0]);
  }

  async listCategories(): Promise<AssetCategory[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM asset_categories
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
  ): Promise<AssetCategory | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM asset_categories
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0]
      ? this.mapCategory(result.rows[0])
      : null;
  }

  async createAsset(
    asset: FacilityAsset,
  ): Promise<FacilityAsset> {
    const result = await this.pool.query(
      `
      INSERT INTO facility_assets (
        id,
        asset_number,
        name,
        description,
        category_id,
        property_id,
        zone_id,
        space_id,
        manufacturer,
        model,
        serial_number,
        qr_token,
        status,
        condition,
        purchase_date,
        purchase_cost,
        warranty_expires_at,
        vendor_name,
        vendor_contact,
        installed_at,
        retired_at,
        disposed_at,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,$21,$22,$23,$24
      )
      RETURNING *
      `,
      [
        asset.id,
        asset.assetNumber,
        asset.name,
        asset.description ?? null,
        asset.categoryId,
        asset.propertyId,
        asset.zoneId ?? null,
        asset.spaceId ?? null,
        asset.manufacturer ?? null,
        asset.model ?? null,
        asset.serialNumber ?? null,
        asset.qrToken,
        asset.status,
        asset.condition,
        asset.purchaseDate ?? null,
        asset.purchaseCost ?? null,
        asset.warrantyExpiresAt ?? null,
        asset.vendorName ?? null,
        asset.vendorContact ?? null,
        asset.installedAt ?? null,
        asset.retiredAt ?? null,
        asset.disposedAt ?? null,
        asset.createdAt,
        asset.updatedAt,
      ],
    );

    return this.mapAsset(result.rows[0]);
  }

  async findAssetById(
    id: string,
  ): Promise<FacilityAsset | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM facility_assets
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0]
      ? this.mapAsset(result.rows[0])
      : null;
  }

  async findAssetDetailsById(
    id: string,
  ): Promise<FacilityAssetDetails | null> {
    const asset = await this.findAssetById(id);

    if (!asset) {
      return null;
    }

    const [category, history, preventivePlans] =
      await Promise.all([
        this.findCategoryById(asset.categoryId),
        this.listHistory(id),
        this.listPreventivePlans(id),
      ]);

    return {
      ...asset,
      category: category ?? undefined,
      history,
      preventivePlans,
    };
  }

  async listAssets(
    filters: FacilityAssetFilters = {},
  ): Promise<FacilityAsset[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    const equal = (column: string, value: unknown) => {
      values.push(value);
      clauses.push(`${column} = $${values.length}`);
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

    if (filters.categoryId) {
      equal('category_id', filters.categoryId);
    }

    if (filters.status) {
      equal('status', filters.status);
    }

    if (filters.condition) {
      equal('condition', filters.condition);
    }

    if (filters.search) {
      values.push(`%${filters.search}%`);
      clauses.push(
        `(asset_number ILIKE $${values.length}
          OR name ILIKE $${values.length}
          OR serial_number ILIKE $${values.length}
          OR manufacturer ILIKE $${values.length}
          OR model ILIKE $${values.length})`,
      );
    }

    const where =
      clauses.length > 0
        ? `WHERE ${clauses.join(' AND ')}`
        : '';

    const result = await this.pool.query(
      `
      SELECT *
      FROM facility_assets
      ${where}
      ORDER BY created_at DESC
      `,
      values,
    );

    return result.rows.map((row) =>
      this.mapAsset(row),
    );
  }

  async updateAsset(
    id: string,
    input: Partial<FacilityAsset>,
  ): Promise<FacilityAsset | null> {
    const current = await this.findAssetById(id);

    if (!current) {
      return null;
    }

    const merged: FacilityAsset = {
      ...current,
      ...input,
      id: current.id,
      assetNumber: current.assetNumber,
      qrToken: current.qrToken,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    };

    const result = await this.pool.query(
      `
      UPDATE facility_assets
      SET
        name = $2,
        description = $3,
        category_id = $4,
        property_id = $5,
        zone_id = $6,
        space_id = $7,
        manufacturer = $8,
        model = $9,
        serial_number = $10,
        status = $11,
        condition = $12,
        purchase_date = $13,
        purchase_cost = $14,
        warranty_expires_at = $15,
        vendor_name = $16,
        vendor_contact = $17,
        installed_at = $18,
        retired_at = $19,
        disposed_at = $20,
        updated_at = $21
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        merged.name,
        merged.description ?? null,
        merged.categoryId,
        merged.propertyId,
        merged.zoneId ?? null,
        merged.spaceId ?? null,
        merged.manufacturer ?? null,
        merged.model ?? null,
        merged.serialNumber ?? null,
        merged.status,
        merged.condition,
        merged.purchaseDate ?? null,
        merged.purchaseCost ?? null,
        merged.warrantyExpiresAt ?? null,
        merged.vendorName ?? null,
        merged.vendorContact ?? null,
        merged.installedAt ?? null,
        merged.retiredAt ?? null,
        merged.disposedAt ?? null,
        merged.updatedAt,
      ],
    );

    return result.rows[0]
      ? this.mapAsset(result.rows[0])
      : null;
  }

  async updateAssetStatus(
    id: string,
    status: AssetStatus,
    timestamps: {
      retiredAt?: Date;
      disposedAt?: Date;
    } = {},
  ): Promise<FacilityAsset | null> {
    const result = await this.pool.query(
      `
      UPDATE facility_assets
      SET
        status = $2,
        retired_at = COALESCE($3, retired_at),
        disposed_at = COALESCE($4, disposed_at),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        status,
        timestamps.retiredAt ?? null,
        timestamps.disposedAt ?? null,
      ],
    );

    return result.rows[0]
      ? this.mapAsset(result.rows[0])
      : null;
  }

  async addHistory(
    history: FacilityAssetHistory,
  ): Promise<FacilityAssetHistory> {
    const result = await this.pool.query(
      `
      INSERT INTO facility_asset_history (
        id,
        asset_id,
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
        history.assetId,
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
    assetId: string,
  ): Promise<FacilityAssetHistory[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM facility_asset_history
      WHERE asset_id = $1
      ORDER BY created_at ASC
      `,
      [assetId],
    );

    return result.rows.map((row) =>
      this.mapHistory(row),
    );
  }

  async createPreventivePlan(
    plan: PreventiveMaintenancePlan,
  ): Promise<PreventiveMaintenancePlan> {
    const result = await this.pool.query(
      `
      INSERT INTO preventive_maintenance_plans (
        id,
        asset_id,
        name,
        description,
        frequency,
        interval_days,
        next_due_at,
        last_completed_at,
        assigned_person_id,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,
        $7,$8,$9,$10,$11,$12
      )
      RETURNING *
      `,
      [
        plan.id,
        plan.assetId,
        plan.name,
        plan.description ?? null,
        plan.frequency,
        plan.intervalDays ?? null,
        plan.nextDueAt,
        plan.lastCompletedAt ?? null,
        plan.assignedPersonId ?? null,
        plan.isActive,
        plan.createdAt,
        plan.updatedAt,
      ],
    );

    return this.mapPlan(result.rows[0]);
  }

  async listPreventivePlans(
    assetId: string,
  ): Promise<PreventiveMaintenancePlan[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM preventive_maintenance_plans
      WHERE asset_id = $1
      ORDER BY next_due_at ASC
      `,
      [assetId],
    );

    return result.rows.map((row) =>
      this.mapPlan(row),
    );
  }

  async getMetrics(propertyId?: string) {
    const result = await this.pool.query(
      `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (
          WHERE status = 'ACTIVE'
        ) AS active,
        COUNT(*) FILTER (
          WHERE status = 'IN_MAINTENANCE'
        ) AS in_maintenance,
        COUNT(*) FILTER (
          WHERE status = 'OUT_OF_SERVICE'
        ) AS out_of_service,
        COUNT(*) FILTER (
          WHERE status = 'RETIRED'
        ) AS retired,
        COUNT(*) FILTER (
          WHERE warranty_expires_at BETWEEN NOW()
            AND NOW() + INTERVAL '30 days'
        ) AS warranty_expiring
      FROM facility_assets
      WHERE ($1::uuid IS NULL OR property_id = $1)
      `,
      [propertyId ?? null],
    );

    const preventive = await this.pool.query(
      `
      SELECT COUNT(*) AS preventive_due
      FROM preventive_maintenance_plans p
      JOIN facility_assets a ON a.id = p.asset_id
      WHERE p.is_active = TRUE
        AND p.next_due_at <= NOW()
        AND ($1::uuid IS NULL OR a.property_id = $1)
      `,
      [propertyId ?? null],
    );

    const row = result.rows[0] ?? {};

    return {
      total: Number(row.total ?? 0),
      active: Number(row.active ?? 0),
      inMaintenance: Number(row.in_maintenance ?? 0),
      outOfService: Number(row.out_of_service ?? 0),
      retired: Number(row.retired ?? 0),
      warrantyExpiring: Number(row.warranty_expiring ?? 0),
      preventiveDue: Number(
        preventive.rows[0]?.preventive_due ?? 0,
      ),
    };
  }

  private mapCategory(row: any): AssetCategory {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description ?? undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapAsset(row: any): FacilityAsset {
    return {
      id: row.id,
      assetNumber: row.asset_number,
      name: row.name,
      description: row.description ?? undefined,
      categoryId: row.category_id,
      propertyId: row.property_id,
      zoneId: row.zone_id ?? undefined,
      spaceId: row.space_id ?? undefined,
      manufacturer: row.manufacturer ?? undefined,
      model: row.model ?? undefined,
      serialNumber: row.serial_number ?? undefined,
      qrToken: row.qr_token,
      status: row.status,
      condition: row.condition,
      purchaseDate: row.purchase_date ?? undefined,
      purchaseCost:
        row.purchase_cost === null
          ? undefined
          : Number(row.purchase_cost),
      warrantyExpiresAt:
        row.warranty_expires_at ?? undefined,
      vendorName: row.vendor_name ?? undefined,
      vendorContact: row.vendor_contact ?? undefined,
      installedAt: row.installed_at ?? undefined,
      retiredAt: row.retired_at ?? undefined,
      disposedAt: row.disposed_at ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapHistory(row: any): FacilityAssetHistory {
    return {
      id: row.id,
      assetId: row.asset_id,
      fromStatus: row.from_status ?? undefined,
      toStatus: row.to_status,
      changedByPersonId: row.changed_by_person_id,
      remarks: row.remarks ?? undefined,
      createdAt: row.created_at,
    };
  }

  private mapPlan(row: any): PreventiveMaintenancePlan {
    return {
      id: row.id,
      assetId: row.asset_id,
      name: row.name,
      description: row.description ?? undefined,
      frequency: row.frequency,
      intervalDays: row.interval_days ?? undefined,
      nextDueAt: row.next_due_at,
      lastCompletedAt:
        row.last_completed_at ?? undefined,
      assignedPersonId:
        row.assigned_person_id ?? undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
