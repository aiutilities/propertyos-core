import {
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  Pool,
} from 'pg';

import {
  POSTGRES_POOL,
} from '../../../database/postgres';

import {
  InventoryBinLocation,
  InventoryBrand,
  InventoryItem,
  InventoryItemCategory,
  InventoryItemFilters,
  InventoryItemType,
  InventoryStockBalance,
  InventoryStockBalanceFilters,
  InventoryStore,
  InventoryStoreFilters,
  InventoryUnitOfMeasure,
} from '../types/inventory.types';

import {
  InventoryRepository,
} from './inventory.repository';

@Injectable()
export class PostgresInventoryRepository
  implements InventoryRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async createUnitOfMeasure(
    unit: InventoryUnitOfMeasure,
  ): Promise<InventoryUnitOfMeasure> {
    const result =
      await this.pool.query(
        `
        INSERT INTO inventory_units_of_measure (
          id,
          code,
          name,
          symbol,
          decimal_places,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8
        )
        RETURNING *
        `,
        [
          unit.id,
          unit.code,
          unit.name,
          unit.symbol,
          unit.decimalPlaces,
          unit.isActive,
          unit.createdAt,
          unit.updatedAt,
        ],
      );

    return this.mapUnitOfMeasure(
      result.rows[0],
    );
  }

  async listUnitsOfMeasure(
    activeOnly = true,
  ): Promise<
    InventoryUnitOfMeasure[]
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_units_of_measure
        ${activeOnly
          ? 'WHERE is_active = TRUE'
          : ''}
        ORDER BY name ASC
        `,
      );

    return result.rows.map(
      (row) =>
        this.mapUnitOfMeasure(row),
    );
  }

  async findUnitOfMeasureById(
    id: string,
  ): Promise<
    InventoryUnitOfMeasure | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_units_of_measure
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapUnitOfMeasure(
          result.rows[0],
        )
      : null;
  }

  async updateUnitOfMeasure(
    id: string,
    input: Partial<InventoryUnitOfMeasure>,
  ): Promise<InventoryUnitOfMeasure | null> {
    const current =
      await this.findUnitOfMeasureById(id);

    if (!current) {
      return null;
    }

    const merged = {
      ...current,
      ...input,
      id: current.id,
      code: current.code,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    };

    const result =
      await this.pool.query(
        `
        UPDATE inventory_units_of_measure
        SET
          name = $2,
          symbol = $3,
          decimal_places = $4,
          is_active = $5,
          updated_at = $6
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          merged.name,
          merged.symbol,
          merged.decimalPlaces,
          merged.isActive,
          merged.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapUnitOfMeasure(
          result.rows[0],
        )
      : null;
  }

  async createCategory(
    category:
      InventoryItemCategory,
  ): Promise<
    InventoryItemCategory
  > {
    const result =
      await this.pool.query(
        `
        INSERT INTO inventory_item_categories (
          id,
          parent_category_id,
          code,
          name,
          description,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8
        )
        RETURNING *
        `,
        [
          category.id,
          category.parentCategoryId ??
            null,
          category.code,
          category.name,
          category.description ??
            null,
          category.isActive,
          category.createdAt,
          category.updatedAt,
        ],
      );

    return this.mapCategory(
      result.rows[0],
    );
  }

  async listCategories(
    activeOnly = true,
  ): Promise<
    InventoryItemCategory[]
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_item_categories
        ${activeOnly
          ? 'WHERE is_active = TRUE'
          : ''}
        ORDER BY name ASC
        `,
      );

    return result.rows.map(
      (row) =>
        this.mapCategory(row),
    );
  }

  async findCategoryById(
    id: string,
  ): Promise<
    InventoryItemCategory | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_item_categories
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapCategory(
          result.rows[0],
        )
      : null;
  }

  async updateCategory(
    id: string,
    input: Partial<InventoryItemCategory>,
  ): Promise<InventoryItemCategory | null> {
    const current =
      await this.findCategoryById(id);

    if (!current) {
      return null;
    }

    const merged = {
      ...current,
      ...input,
      id: current.id,
      code: current.code,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    };

    const result =
      await this.pool.query(
        `
        UPDATE inventory_item_categories
        SET
          parent_category_id = $2,
          name = $3,
          description = $4,
          is_active = $5,
          updated_at = $6
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          merged.parentCategoryId ??
            null,
          merged.name,
          merged.description ??
            null,
          merged.isActive,
          merged.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapCategory(
          result.rows[0],
        )
      : null;
  }

  async createBrand(
    brand: InventoryBrand,
  ): Promise<InventoryBrand> {
    const result =
      await this.pool.query(
        `
        INSERT INTO inventory_brands (
          id,
          code,
          name,
          description,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7
        )
        RETURNING *
        `,
        [
          brand.id,
          brand.code,
          brand.name,
          brand.description ??
            null,
          brand.isActive,
          brand.createdAt,
          brand.updatedAt,
        ],
      );

    return this.mapBrand(
      result.rows[0],
    );
  }

  async listBrands(
    activeOnly = true,
  ): Promise<InventoryBrand[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_brands
        ${activeOnly
          ? 'WHERE is_active = TRUE'
          : ''}
        ORDER BY name ASC
        `,
      );

    return result.rows.map(
      (row) =>
        this.mapBrand(row),
    );
  }

  async findBrandById(
    id: string,
  ): Promise<
    InventoryBrand | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_brands
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapBrand(
          result.rows[0],
        )
      : null;
  }

  async updateBrand(
    id: string,
    input: Partial<InventoryBrand>,
  ): Promise<InventoryBrand | null> {
    const current =
      await this.findBrandById(id);

    if (!current) {
      return null;
    }

    const merged = {
      ...current,
      ...input,
      id: current.id,
      code: current.code,
      createdAt: current.createdAt,
      updatedAt: new Date(),
    };

    const result =
      await this.pool.query(
        `
        UPDATE inventory_brands
        SET
          name = $2,
          description = $3,
          is_active = $4,
          updated_at = $5
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          merged.name,
          merged.description ??
            null,
          merged.isActive,
          merged.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapBrand(
          result.rows[0],
        )
      : null;
  }

  async createItem(
    item: InventoryItem,
  ): Promise<InventoryItem> {
    const result =
      await this.pool.query(
        `
        INSERT INTO inventory_items (
          id,
          sku,
          name,
          description,
          category_id,
          unit_of_measure_id,
          brand_id,
          item_type,
          barcode,
          manufacturer_part_number,
          minimum_stock_level,
          reorder_level,
          reorder_quantity,
          standard_cost,
          currency,
          is_serialized,
          is_batch_tracked,
          is_active,
          created_by_person_id,
          updated_by_person_id,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19,$20,$21,$22
        )
        RETURNING *
        `,
        [
          item.id,
          item.sku,
          item.name,
          item.description ?? null,
          item.categoryId,
          item.unitOfMeasureId,
          item.brandId ?? null,
          item.itemType,
          item.barcode ?? null,
          item.manufacturerPartNumber ??
            null,
          item.minimumStockLevel,
          item.reorderLevel,
          item.reorderQuantity,
          item.standardCost,
          item.currency,
          item.isSerialized,
          item.isBatchTracked,
          item.isActive,
          item.createdByPersonId ??
            null,
          item.updatedByPersonId ??
            null,
          item.createdAt,
          item.updatedAt,
        ],
      );

    return this.mapItem(
      result.rows[0],
    );
  }

  async findItemById(
    id: string,
  ): Promise<
    InventoryItem | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_items
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapItem(
          result.rows[0],
        )
      : null;
  }

  async findItemBySku(
    sku: string,
  ): Promise<
    InventoryItem | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_items
        WHERE UPPER(sku) = UPPER($1)
        `,
        [sku],
      );

    return result.rows[0]
      ? this.mapItem(
          result.rows[0],
        )
      : null;
  }

  async listItems(
    filters:
      InventoryItemFilters = {},
  ): Promise<InventoryItem[]> {
    const conditions: string[] =
      [];

    const values: unknown[] =
      [];

    const addCondition = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${column} = $${values.length}`,
      );
    };

    if (filters.categoryId) {
      addCondition(
        'category_id',
        filters.categoryId,
      );
    }

    if (
      filters.unitOfMeasureId
    ) {
      addCondition(
        'unit_of_measure_id',
        filters.unitOfMeasureId,
      );
    }

    if (filters.brandId) {
      addCondition(
        'brand_id',
        filters.brandId,
      );
    }

    if (filters.itemType) {
      addCondition(
        'item_type',
        filters.itemType,
      );
    }

    if (
      filters.isActive !==
      undefined
    ) {
      addCondition(
        'is_active',
        filters.isActive,
      );
    }

    if (filters.search) {
      values.push(
        `%${filters.search}%`,
      );

      conditions.push(
        `(
          sku ILIKE $${values.length}
          OR name ILIKE $${values.length}
          OR description
            ILIKE $${values.length}
          OR barcode
            ILIKE $${values.length}
          OR manufacturer_part_number
            ILIKE $${values.length}
        )`,
      );
    }

    const where =
      conditions.length
        ? `WHERE ${conditions.join(
            ' AND ',
          )}`
        : '';

    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_items
        ${where}
        ORDER BY created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapItem(row),
    );
  }

  async updateItem(
    id: string,
    input:
      Partial<InventoryItem>,
  ): Promise<
    InventoryItem | null
  > {
    const current =
      await this.findItemById(id);

    if (!current) {
      return null;
    }

    const merged: InventoryItem = {
      ...current,
      ...input,
      id: current.id,
      sku: current.sku,
      createdAt:
        current.createdAt,
      updatedAt:
        new Date(),
    };

    const result =
      await this.pool.query(
        `
        UPDATE inventory_items
        SET
          name = $2,
          description = $3,
          category_id = $4,
          unit_of_measure_id = $5,
          brand_id = $6,
          item_type = $7,
          barcode = $8,
          manufacturer_part_number = $9,
          minimum_stock_level = $10,
          reorder_level = $11,
          reorder_quantity = $12,
          standard_cost = $13,
          currency = $14,
          is_serialized = $15,
          is_batch_tracked = $16,
          is_active = $17,
          updated_by_person_id = $18,
          updated_at = $19
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          merged.name,
          merged.description ??
            null,
          merged.categoryId,
          merged.unitOfMeasureId,
          merged.brandId ??
            null,
          merged.itemType,
          merged.barcode ??
            null,
          merged.manufacturerPartNumber ??
            null,
          merged.minimumStockLevel,
          merged.reorderLevel,
          merged.reorderQuantity,
          merged.standardCost,
          merged.currency,
          merged.isSerialized,
          merged.isBatchTracked,
          merged.isActive,
          merged.updatedByPersonId ??
            null,
          merged.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapItem(
          result.rows[0],
        )
      : null;
  }

  async createStore(
    store: InventoryStore,
  ): Promise<InventoryStore> {
    const result =
      await this.pool.query(
        `
        INSERT INTO inventory_stores (
          id,
          store_code,
          name,
          description,
          property_id,
          zone_id,
          space_id,
          manager_person_id,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,
          $7,$8,$9,$10,$11
        )
        RETURNING *
        `,
        [
          store.id,
          store.storeCode,
          store.name,
          store.description ??
            null,
          store.propertyId,
          store.zoneId ??
            null,
          store.spaceId ??
            null,
          store.managerPersonId ??
            null,
          store.isActive,
          store.createdAt,
          store.updatedAt,
        ],
      );

    return this.mapStore(
      result.rows[0],
    );
  }

  async findStoreById(
    id: string,
  ): Promise<
    InventoryStore | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stores
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapStore(
          result.rows[0],
        )
      : null;
  }

  async listStores(
    filters:
      InventoryStoreFilters = {},
  ): Promise<InventoryStore[]> {
    const conditions: string[] =
      [];

    const values: unknown[] =
      [];

    const addCondition = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${column} = $${values.length}`,
      );
    };

    if (filters.propertyId) {
      addCondition(
        'property_id',
        filters.propertyId,
      );
    }

    if (filters.zoneId) {
      addCondition(
        'zone_id',
        filters.zoneId,
      );
    }

    if (filters.spaceId) {
      addCondition(
        'space_id',
        filters.spaceId,
      );
    }

    if (
      filters.isActive !==
      undefined
    ) {
      addCondition(
        'is_active',
        filters.isActive,
      );
    }

    if (filters.search) {
      values.push(
        `%${filters.search}%`,
      );

      conditions.push(
        `(
          store_code
            ILIKE $${values.length}
          OR name
            ILIKE $${values.length}
          OR description
            ILIKE $${values.length}
        )`,
      );
    }

    const where =
      conditions.length
        ? `WHERE ${conditions.join(
            ' AND ',
          )}`
        : '';

    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stores
        ${where}
        ORDER BY name ASC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapStore(row),
    );
  }

  async updateStore(
    id: string,
    input:
      Partial<InventoryStore>,
  ): Promise<
    InventoryStore | null
  > {
    const current =
      await this.findStoreById(id);

    if (!current) {
      return null;
    }

    const merged: InventoryStore = {
      ...current,
      ...input,
      id: current.id,
      storeCode:
        current.storeCode,
      propertyId:
        current.propertyId,
      createdAt:
        current.createdAt,
      updatedAt:
        new Date(),
    };

    const result =
      await this.pool.query(
        `
        UPDATE inventory_stores
        SET
          name = $2,
          description = $3,
          zone_id = $4,
          space_id = $5,
          manager_person_id = $6,
          is_active = $7,
          updated_at = $8
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          merged.name,
          merged.description ??
            null,
          merged.zoneId ??
            null,
          merged.spaceId ??
            null,
          merged.managerPersonId ??
            null,
          merged.isActive,
          merged.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapStore(
          result.rows[0],
        )
      : null;
  }

  async createBinLocation(
    bin:
      InventoryBinLocation,
  ): Promise<
    InventoryBinLocation
  > {
    const result =
      await this.pool.query(
        `
        INSERT INTO inventory_bin_locations (
          id,
          store_id,
          parent_bin_id,
          bin_code,
          name,
          description,
          barcode,
          is_receiving_bin,
          is_dispatch_bin,
          is_quarantine_bin,
          is_active,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,
          $8,$9,$10,$11,$12,$13
        )
        RETURNING *
        `,
        [
          bin.id,
          bin.storeId,
          bin.parentBinId ??
            null,
          bin.binCode,
          bin.name,
          bin.description ??
            null,
          bin.barcode ??
            null,
          bin.isReceivingBin,
          bin.isDispatchBin,
          bin.isQuarantineBin,
          bin.isActive,
          bin.createdAt,
          bin.updatedAt,
        ],
      );

    return this.mapBinLocation(
      result.rows[0],
    );
  }

  async findBinLocationById(
    id: string,
  ): Promise<
    InventoryBinLocation | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_bin_locations
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapBinLocation(
          result.rows[0],
        )
      : null;
  }

  async listBinLocations(
    storeId: string,
  ): Promise<
    InventoryBinLocation[]
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_bin_locations
        WHERE store_id = $1
        ORDER BY bin_code ASC
        `,
        [storeId],
      );

    return result.rows.map(
      (row) =>
        this.mapBinLocation(row),
    );
  }

  async updateBinLocation(
    id: string,
    input:
      Partial<InventoryBinLocation>,
  ): Promise<
    InventoryBinLocation | null
  > {
    const current =
      await this.findBinLocationById(
        id,
      );

    if (!current) {
      return null;
    }

    const merged:
      InventoryBinLocation = {
        ...current,
        ...input,
        id: current.id,
        storeId:
          current.storeId,
        binCode:
          current.binCode,
        createdAt:
          current.createdAt,
        updatedAt:
          new Date(),
      };

    const result =
      await this.pool.query(
        `
        UPDATE inventory_bin_locations
        SET
          parent_bin_id = $2,
          name = $3,
          description = $4,
          barcode = $5,
          is_receiving_bin = $6,
          is_dispatch_bin = $7,
          is_quarantine_bin = $8,
          is_active = $9,
          updated_at = $10
        WHERE id = $1
        RETURNING *
        `,
        [
          id,
          merged.parentBinId ??
            null,
          merged.name,
          merged.description ??
            null,
          merged.barcode ??
            null,
          merged.isReceivingBin,
          merged.isDispatchBin,
          merged.isQuarantineBin,
          merged.isActive,
          merged.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapBinLocation(
          result.rows[0],
        )
      : null;
  }

  async findStockBalance(
    itemId: string,
    storeId: string,
    binLocationId?: string,
  ): Promise<
    InventoryStockBalance | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stock_balances
        WHERE item_id = $1
          AND store_id = $2
          AND (
            bin_location_id = $3
            OR (
              bin_location_id IS NULL
              AND $3::UUID IS NULL
            )
          )
        LIMIT 1
        `,
        [
          itemId,
          storeId,
          binLocationId ??
            null,
        ],
      );

    return result.rows[0]
      ? this.mapStockBalance(
          result.rows[0],
        )
      : null;
  }

  async listStockBalances(
    filters:
      InventoryStockBalanceFilters = {},
  ): Promise<
    InventoryStockBalance[]
  > {
    const conditions: string[] =
      [];

    const values: unknown[] =
      [];

    const addCondition = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${column} = $${values.length}`,
      );
    };

    if (filters.itemId) {
      addCondition(
        'b.item_id',
        filters.itemId,
      );
    }

    if (filters.storeId) {
      addCondition(
        'b.store_id',
        filters.storeId,
      );
    }

    if (filters.binLocationId) {
      addCondition(
        'b.bin_location_id',
        filters.binLocationId,
      );
    }

    if (filters.propertyId) {
      addCondition(
        's.property_id',
        filters.propertyId,
      );
    }

    if (
      filters.belowReorderLevel
    ) {
      conditions.push(
        `
        b.available_quantity
          <= i.reorder_level
        `,
      );
    }

    const where =
      conditions.length
        ? `WHERE ${conditions.join(
            ' AND ',
          )}`
        : '';

    const result =
      await this.pool.query(
        `
        SELECT b.*
        FROM inventory_stock_balances b
        INNER JOIN inventory_items i
          ON i.id = b.item_id
        INNER JOIN inventory_stores s
          ON s.id = b.store_id
        ${where}
        ORDER BY
          s.name ASC,
          i.name ASC,
          b.created_at ASC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapStockBalance(
          row,
        ),
    );
  }

  private mapUnitOfMeasure(
    row: any,
  ): InventoryUnitOfMeasure {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      symbol: row.symbol,
      decimalPlaces:
        Number(
          row.decimal_places,
        ),
      isActive:
        row.is_active,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapCategory(
    row: any,
  ): InventoryItemCategory {
    return {
      id: row.id,
      parentCategoryId:
        row.parent_category_id ??
        undefined,
      code: row.code,
      name: row.name,
      description:
        row.description ??
        undefined,
      isActive:
        row.is_active,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapBrand(
    row: any,
  ): InventoryBrand {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description:
        row.description ??
        undefined,
      isActive:
        row.is_active,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapItem(
    row: any,
  ): InventoryItem {
    return {
      id: row.id,
      sku: row.sku,
      name: row.name,
      description:
        row.description ??
        undefined,
      categoryId:
        row.category_id,
      unitOfMeasureId:
        row.unit_of_measure_id,
      brandId:
        row.brand_id ??
        undefined,
      itemType:
        row.item_type as
          InventoryItemType,
      barcode:
        row.barcode ??
        undefined,
      manufacturerPartNumber:
        row.manufacturer_part_number ??
        undefined,
      minimumStockLevel:
        Number(
          row.minimum_stock_level,
        ),
      reorderLevel:
        Number(
          row.reorder_level,
        ),
      reorderQuantity:
        Number(
          row.reorder_quantity,
        ),
      standardCost:
        Number(
          row.standard_cost,
        ),
      currency:
        row.currency,
      isSerialized:
        row.is_serialized,
      isBatchTracked:
        row.is_batch_tracked,
      isActive:
        row.is_active,
      createdByPersonId:
        row.created_by_person_id ??
        undefined,
      updatedByPersonId:
        row.updated_by_person_id ??
        undefined,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapStore(
    row: any,
  ): InventoryStore {
    return {
      id: row.id,
      storeCode:
        row.store_code,
      name: row.name,
      description:
        row.description ??
        undefined,
      propertyId:
        row.property_id,
      zoneId:
        row.zone_id ??
        undefined,
      spaceId:
        row.space_id ??
        undefined,
      managerPersonId:
        row.manager_person_id ??
        undefined,
      isActive:
        row.is_active,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapBinLocation(
    row: any,
  ): InventoryBinLocation {
    return {
      id: row.id,
      storeId:
        row.store_id,
      parentBinId:
        row.parent_bin_id ??
        undefined,
      binCode:
        row.bin_code,
      name: row.name,
      description:
        row.description ??
        undefined,
      barcode:
        row.barcode ??
        undefined,
      isReceivingBin:
        row.is_receiving_bin,
      isDispatchBin:
        row.is_dispatch_bin,
      isQuarantineBin:
        row.is_quarantine_bin,
      isActive:
        row.is_active,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapStockBalance(
    row: any,
  ): InventoryStockBalance {
    return {
      id: row.id,
      itemId:
        row.item_id,
      storeId:
        row.store_id,
      binLocationId:
        row.bin_location_id ??
        undefined,
      quantityOnHand:
        Number(
          row.quantity_on_hand,
        ),
      reservedQuantity:
        Number(
          row.reserved_quantity,
        ),
      availableQuantity:
        Number(
          row.available_quantity,
        ),
      averageUnitCost:
        Number(
          row.average_unit_cost,
        ),
      lastMovementAt:
        row.last_movement_at ??
        undefined,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }
}
