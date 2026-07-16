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
  InventoryBatchAllocationStrategy,
  InventoryBatchAvailability,
} from '../types/inventory.types';

import {
  FindAvailableInventoryBatchesInput,
  InventoryBatchAllocationRepository,
} from './inventory-batch-allocation.repository';

@Injectable()
export class PostgresInventoryBatchAllocationRepository
  implements
    InventoryBatchAllocationRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async findAvailableBatches(
    input:
      FindAvailableInventoryBatchesInput,
  ): Promise<
    InventoryBatchAvailability[]
  > {
    const values:
      unknown[] = [
        input.itemId,
        input.storeId,
        input.binLocationId ??
          null,
        input.asOf,
      ];

    const conditions = [
      'batch.item_id = $1',
      'balance.item_id = $1',
      'balance.store_id = $2',
      `(
        balance.bin_location_id = $3
        OR (
          balance.bin_location_id IS NULL
          AND $3::UUID IS NULL
        )
      )`,
      `batch.status = 'ACTIVE'`,
      `(
        batch.expiry_date IS NULL
        OR batch.expiry_date >=
          $4::DATE
      )`,
      `(
        balance.quantity_on_hand -
        balance.reserved_quantity
      ) > 0`,
    ];

    if (
      input.strategy ===
      InventoryBatchAllocationStrategy
        .MANUAL
    ) {
      const manualBatchIds =
        input.manualBatchIds ?? [];

      if (manualBatchIds.length === 0) {
        return [];
      }

      values.push(
        manualBatchIds,
      );

      conditions.push(
        `batch.id =
          ANY(
            $${values.length}::UUID[]
          )`,
      );
    }

    const orderBy =
      this.orderBy(
        input.strategy,
      );

    const result =
      await this.pool.query(
        `
        SELECT
          batch.id AS batch_id,
          batch.item_id,
          balance.store_id,
          balance.bin_location_id,

          batch.batch_number,
          batch.manufacturer_batch_number,
          batch.manufacture_date,
          batch.expiry_date,
          batch.status AS batch_status,

          balance.quantity_on_hand,
          balance.reserved_quantity,

          (
            balance.quantity_on_hand -
            balance.reserved_quantity
          ) AS available_quantity,

          balance.average_unit_cost,
          balance.last_movement_at,

          batch.created_at AS
            batch_created_at
        FROM inventory_batches batch
        INNER JOIN inventory_batch_balances balance
          ON balance.batch_id =
            batch.id
        WHERE ${conditions.join(
          '\n          AND ',
        )}
        ORDER BY ${orderBy}
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapAvailability(
          row,
        ),
    );
  }

  private orderBy(
    strategy:
      InventoryBatchAllocationStrategy,
  ): string {
    switch (strategy) {
      case InventoryBatchAllocationStrategy
        .FEFO:
        return [
          'batch.expiry_date ASC NULLS LAST',
          'batch.manufacture_date ASC NULLS LAST',
          'batch.created_at ASC',
          'batch.batch_number ASC',
        ].join(', ');

      case InventoryBatchAllocationStrategy
        .FIFO:
        return [
          'batch.manufacture_date ASC NULLS LAST',
          'batch.created_at ASC',
          'batch.expiry_date ASC NULLS LAST',
          'batch.batch_number ASC',
        ].join(', ');

      case InventoryBatchAllocationStrategy
        .MANUAL:
        return [
          'array_position(',
          '  $5::UUID[],',
          '  batch.id',
          ') ASC',
          ', batch.batch_number ASC',
        ].join('\n');

      default:
        return [
          'batch.created_at ASC',
          'batch.batch_number ASC',
        ].join(', ');
    }
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

  private mapAvailability(
    row: any,
  ): InventoryBatchAvailability {
    return {
      batchId:
        row.batch_id,

      itemId:
        row.item_id,

      storeId:
        row.store_id,

      binLocationId:
        row.bin_location_id ??
        undefined,

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

      batchStatus:
        row.batch_status,

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

      batchCreatedAt:
        new Date(
          row.batch_created_at,
        ),
    };
  }
}
