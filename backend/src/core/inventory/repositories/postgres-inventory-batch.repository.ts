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
  InventoryBatch,
} from '../types/inventory.types';

import {
  InventoryBatchRepository,
} from './inventory-batch.repository';

@Injectable()
export class PostgresInventoryBatchRepository
  implements InventoryBatchRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async findById(
    id: string,
  ): Promise<
    InventoryBatch | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_batches
        WHERE id = $1
        `,
        [
          id,
        ],
      );

    return result.rows[0]
      ? this.mapBatch(
          result.rows[0],
        )
      : null;
  }

  async findByItemAndBatchNumber(
    itemId: string,
    batchNumber: string,
  ): Promise<
    InventoryBatch | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_batches
        WHERE item_id = $1
          AND batch_number = $2
        `,
        [
          itemId,
          batchNumber,
        ],
      );

    return result.rows[0]
      ? this.mapBatch(
          result.rows[0],
        )
      : null;
  }

  async findByIds(
    ids: string[],
  ): Promise<
    InventoryBatch[]
  > {
    const normalized =
      Array.from(
        new Set(
          ids
            .map(
              (id) =>
                id.trim(),
            )
            .filter(Boolean),
        ),
      );

    if (normalized.length === 0) {
      return [];
    }

    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_batches
        WHERE id =
          ANY($1::UUID[])
        `,
        [
          normalized,
        ],
      );

    const byId =
      new Map(
        result.rows.map(
          (row) => [
            row.id,
            this.mapBatch(
              row,
            ),
          ],
        ),
      );

    return normalized
      .map(
        (id) =>
          byId.get(id),
      )
      .filter(
        (
          batch,
        ): batch is InventoryBatch =>
          Boolean(batch),
      );
  }

  async create(
    batch: InventoryBatch,
  ): Promise<InventoryBatch> {
    const result =
      await this.pool.query(
        `
        INSERT INTO inventory_batches (
          id,
          item_id,
          batch_number,
          manufacturer_batch_number,
          manufacture_date,
          expiry_date,
          status,
          source_type,
          source_id,
          source_line_id,
          remarks,
          metadata,
          created_by_person_id,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15
        )
        ON CONFLICT (
          item_id,
          batch_number
        )
        DO NOTHING
        RETURNING *
        `,
        [
          batch.id,
          batch.itemId,
          batch.batchNumber,
          batch.manufacturerBatchNumber ??
            null,
          batch.manufactureDate ??
            null,
          batch.expiryDate ??
            null,
          batch.status,
          batch.sourceType ??
            null,
          batch.sourceId ??
            null,
          batch.sourceLineId ??
            null,
          batch.remarks ??
            null,
          JSON.stringify(
            batch.metadata,
          ),
          batch.createdByPersonId ??
            null,
          batch.createdAt,
          batch.updatedAt,
        ],
      );

    if (result.rows[0]) {
      return this.mapBatch(
        result.rows[0],
      );
    }

    const existing =
      await this
        .findByItemAndBatchNumber(
          batch.itemId,
          batch.batchNumber,
        );

    if (!existing) {
      throw new Error(
        'Inventory Batch creation failed',
      );
    }

    return existing;
  }

  private mapDateOnly(
    value: unknown,
  ): Date | undefined {
    if (!value) {
      return undefined;
    }

    if (value instanceof Date) {
      return new Date(
        Date.UTC(
          value.getFullYear(),
          value.getMonth(),
          value.getDate(),
        ),
      );
    }

    const text =
      String(value)
        .slice(
          0,
          10,
        );

    const match =
      /^(\d{4})-(\d{2})-(\d{2})$/
        .exec(text);

    if (!match) {
      throw new Error(
        `Invalid PostgreSQL date value: ${String(value)}`,
      );
    }

    return new Date(
      Date.UTC(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3]),
      ),
    );
  }

  private mapBatch(
    row: any,
  ): InventoryBatch {
    return {
      id:
        row.id,

      itemId:
        row.item_id,

      batchNumber:
        row.batch_number,

      manufacturerBatchNumber:
        row.manufacturer_batch_number ??
        undefined,

      manufactureDate:
        this.mapDateOnly(
          row.manufacture_date,
        ),

      expiryDate:
        this.mapDateOnly(
          row.expiry_date,
        ),

      status:
        row.status,

      sourceType:
        row.source_type ??
        undefined,

      sourceId:
        row.source_id ??
        undefined,

      sourceLineId:
        row.source_line_id ??
        undefined,

      remarks:
        row.remarks ??
        undefined,

      metadata:
        row.metadata ??
        {},

      createdByPersonId:
        row.created_by_person_id ??
        undefined,

      createdAt:
        new Date(
          row.created_at,
        ),

      updatedAt:
        new Date(
          row.updated_at,
        ),
    };
  }
}
