import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  randomUUID,
} from 'crypto';

import {
  Pool,
  PoolClient,
} from 'pg';

import {
  POSTGRES_POOL,
} from '../../../database/postgres';

import {
  InventoryAdjustmentStatus,
  InventoryCycleCount,
  InventoryCycleCountItem,
  InventoryCycleCountStatus,
  InventoryReservationStatus,
  InventoryStockAdjustment,
  InventoryStockAdjustmentItem,
  InventoryBatchBalance,
  InventoryStockBalance,
  InventoryStockLedgerEntry,
  InventoryStockLedgerFilters,
  InventoryStockMovementType,
  InventoryStockReservation,
  InventoryStockTransfer,
  InventoryStockTransferItem,
  InventoryTransferStatus,
  InventoryMaterialIssue,
  InventoryMaterialIssueItem,
  InventoryMaterialIssueStatus,
  InventoryMaterialReturn,
  InventoryMaterialReturnItem,
  InventoryMaterialReturnStatus,
} from '../types/inventory.types';

import {
  InventoryStockLedgerRepository,
  InventoryStockLedgerTransaction,
  PostInventoryMovementInput,
  PostInventoryMovementResult,
} from './inventory-stock-ledger.repository';

@Injectable()
export class PostgresInventoryStockLedgerRepository
  implements InventoryStockLedgerRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async withTransaction<T>(
    work: (
      transaction:
        InventoryStockLedgerTransaction,
    ) => Promise<T>,
  ): Promise<T> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      const transaction:
        InventoryStockLedgerTransaction = {
          acquireLock:
            (
              key: string,
            ) =>
              this.acquireTransactionLock(
                client,
                key,
              ),

          lockMaterialIssueById:
            (
              id: string,
            ) =>
              this.findMaterialIssueByIdWithClient(
                client,
                id,
                true,
              ),

          lockMaterialReturnById:
            (
              id: string,
            ) =>
              this.findMaterialReturnByIdWithClient(
                client,
                id,
                true,
              ),

          getPostedMaterialReturnQuantity:
            (
              materialIssueId,
              itemId,
              binLocationId,
              batchId,
            ) =>
              this.getPostedMaterialReturnQuantityWithClient(
                client,
                materialIssueId,
                itemId,
                binLocationId,
                batchId,
              ),

          postMovement:
            (
              input:
                PostInventoryMovementInput,
            ) =>
              this.postMovementWithClient(
                client,
                input,
              ),

          updateMaterialIssueStatus:
            (
              materialIssueId,
              input,
            ) =>
              this.updateMaterialIssueStatusWithClient(
                client,
                materialIssueId,
                input,
              ),

          updateMaterialReturnStatus:
            (
              materialReturnId,
              input,
            ) =>
              this.updateMaterialReturnStatusWithClient(
                client,
                materialReturnId,
                input,
              ),
        };

      const result =
        await work(
          transaction,
        );

      await client.query(
        'COMMIT',
      );

      return result;
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }
  }

  async postMovement(
    input:
      PostInventoryMovementInput,
  ): Promise<
    PostInventoryMovementResult
  > {
    return this.withTransaction(
      (transaction) =>
        transaction.postMovement(
          input,
        ),
    );
  }

  private async postMovementWithClient(
    client: PoolClient,

    input:
      PostInventoryMovementInput,
  ): Promise<
    PostInventoryMovementResult
  > {
    this.validateMovementInput(
      input,
    );

    if (
      input.idempotencyKey
    ) {
      await client.query(
        `
        SELECT pg_advisory_xact_lock(
          hashtext($1)
        )
        `,
        [
          input.idempotencyKey,
        ],
      );

      const existing =
        await this
          .findLedgerEntryByIdempotencyKeyWithClient(
            client,
            input.idempotencyKey,
          );

      if (existing) {
        const balance =
          await this.requireBalanceWithClient(
            client,
            existing.itemId,
            existing.storeId,
            existing.binLocationId,
          );

        const batchBalance =
          existing.batchId
            ? await this
                .requireBatchBalanceWithClient(
                  client,
                  existing.batchId,
                  existing.itemId,
                  existing.storeId,
                  existing.binLocationId,
                )
            : undefined;

        return {
          entry:
            existing,

          balance,

          batchBalance,

          idempotentReplay:
            true,
        };
      }
    }

    const item =
      await this.requireActiveItem(
        client,
        input.itemId,
      );

    if (
      item.isBatchTracked &&
      !input.batchId
    ) {
      throw new BadRequestException(
        'batchId is required for a batch-tracked Inventory item',
      );
    }

    if (
      !item.isBatchTracked &&
      input.batchId
    ) {
      throw new BadRequestException(
        'batchId cannot be used for an Inventory item that is not batch tracked',
      );
    }

    if (input.batchId) {
      await this.requireActiveBatch(
        client,
        input.batchId,
        input.itemId,
      );
    }

    await this.requireActiveStore(
      client,
      input.storeId,
    );

    if (
      input.binLocationId
    ) {
      await this.requireActiveBin(
        client,
        input.binLocationId,
        input.storeId,
      );
    }

    const currentBalance =
      await this.lockOrCreateBalance(
        client,
        input.itemId,
        input.storeId,
        input.binLocationId,
      );

    const currentBatchBalance =
      input.batchId
        ? await this
            .lockOrCreateBatchBalance(
              client,
              input.batchId,
              input.itemId,
              input.storeId,
              input.binLocationId,
            )
        : undefined;

    const quantityDelta =
      this.roundQuantity(
        input.quantityDelta,
      );

    const reservedDelta =
      this.roundQuantity(
        input.reservedQuantityDelta ??
          0,
      );

    const unitCost =
      this.roundCost(
        input.unitCost ??
          currentBalance
            .averageUnitCost,
      );

    const quantityAfter =
      this.roundQuantity(
        currentBalance
          .quantityOnHand +
        quantityDelta,
      );

    const reservedAfter =
      this.roundQuantity(
        currentBalance
          .reservedQuantity +
        reservedDelta,
      );

    const batchQuantityAfter =
      currentBatchBalance
        ? this.roundQuantity(
            currentBatchBalance
              .quantityOnHand +
            quantityDelta,
          )
        : undefined;

    const batchReservedAfter =
      currentBatchBalance
        ? this.roundQuantity(
            currentBatchBalance
              .reservedQuantity +
            reservedDelta,
          )
        : undefined;

    if (quantityAfter < 0) {
      throw new BadRequestException(
        'Inventory movement would create negative stock',
      );
    }

    if (reservedAfter < 0) {
      throw new BadRequestException(
        'Inventory movement would create a negative reservation',
      );
    }

    if (
      reservedAfter >
      quantityAfter
    ) {
      throw new BadRequestException(
        'Reserved quantity cannot exceed quantity on hand',
      );
    }

    if (
      batchQuantityAfter !==
        undefined &&
      batchQuantityAfter < 0
    ) {
      throw new BadRequestException(
        'Inventory movement would create negative Batch stock',
      );
    }

    if (
      batchReservedAfter !==
        undefined &&
      batchReservedAfter < 0
    ) {
      throw new BadRequestException(
        'Inventory movement would create a negative Batch reservation',
      );
    }

    if (
      batchQuantityAfter !==
        undefined &&
      batchReservedAfter !==
        undefined &&
      batchReservedAfter >
        batchQuantityAfter
    ) {
      throw new BadRequestException(
        'Batch reserved quantity cannot exceed Batch quantity on hand',
      );
    }

    const averageCostAfter =
      this.calculateAverageCost(
        currentBalance
          .quantityOnHand,
        currentBalance
          .averageUnitCost,
        quantityDelta,
        unitCost,
        quantityAfter,
      );

    const batchAverageCostAfter =
      currentBatchBalance &&
      batchQuantityAfter !==
        undefined
        ? this.calculateAverageCost(
            currentBatchBalance
              .quantityOnHand,
            currentBatchBalance
              .averageUnitCost,
            quantityDelta,
            unitCost,
            batchQuantityAfter,
          )
        : undefined;

    const movementDate =
      input.movementDate ??
      new Date();

    const updatedBalance =
      await this.updateBalance(
        client,
        currentBalance.id,
        quantityAfter,
        reservedAfter,
        averageCostAfter,
        movementDate,
      );

    const updatedBatchBalance =
      currentBatchBalance &&
      batchQuantityAfter !==
        undefined &&
      batchReservedAfter !==
        undefined &&
      batchAverageCostAfter !==
        undefined
        ? await this.updateBatchBalance(
            client,
            currentBatchBalance.id,
            batchQuantityAfter,
            batchReservedAfter,
            batchAverageCostAfter,
            movementDate,
          )
        : undefined;

    const entry =
      await this.insertLedgerEntry(
        client,
        input,
        currentBalance,
        updatedBalance,
        quantityDelta,
        reservedDelta,
        unitCost,
        movementDate,
      );

    return {
      entry,

      balance:
        updatedBalance,

      batchBalance:
        updatedBatchBalance,

      idempotentReplay:
        false,
    };
  }

  async findLedgerEntryById(
    id: string,
  ): Promise<
    InventoryStockLedgerEntry | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stock_ledger
        WHERE id = $1
        `,
        [
          id,
        ],
      );

    return result.rows[0]
      ? this.mapLedgerEntry(
          result.rows[0],
        )
      : null;
  }

  async findLedgerEntryByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<
    InventoryStockLedgerEntry | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stock_ledger
        WHERE idempotency_key = $1
        `,
        [
          idempotencyKey,
        ],
      );

    return result.rows[0]
      ? this.mapLedgerEntry(
          result.rows[0],
        )
      : null;
  }

  async listStockLedger(
    filters:
      InventoryStockLedgerFilters = {},
  ): Promise<
    InventoryStockLedgerEntry[]
  > {
    const conditions:
      string[] = [];

    const values:
      unknown[] = [];

    const addCondition = (
      sql: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${sql} $${values.length}`,
      );
    };

    if (filters.itemId) {
      addCondition(
        'item_id =',
        filters.itemId,
      );
    }

    if (filters.storeId) {
      addCondition(
        'store_id =',
        filters.storeId,
      );
    }

    if (
      filters.binLocationId
    ) {
      addCondition(
        'bin_location_id =',
        filters.binLocationId,
      );
    }

    if (
      filters.movementType
    ) {
      addCondition(
        'movement_type =',
        filters.movementType,
      );
    }

    if (filters.sourceType) {
      addCondition(
        'source_type =',
        filters.sourceType,
      );
    }

    if (filters.sourceId) {
      addCondition(
        'source_id =',
        filters.sourceId,
      );
    }

    if (
      filters.correlationId
    ) {
      addCondition(
        'correlation_id =',
        filters.correlationId,
      );
    }

    if (filters.dateFrom) {
      addCondition(
        'movement_date >=',
        filters.dateFrom,
      );
    }

    if (filters.dateTo) {
      addCondition(
        'movement_date <=',
        filters.dateTo,
      );
    }

    const where =
      conditions.length
        ? `WHERE ${conditions.join(
            ' AND ',
          )}`
        : '';

    const limit =
      Math.min(
        Math.max(
          filters.limit ?? 100,
          1,
        ),
        500,
      );

    values.push(limit);

    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stock_ledger
        ${where}
        ORDER BY
          movement_date DESC,
          created_at DESC
        LIMIT $${values.length}
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapLedgerEntry(
          row,
        ),
    );
  }

  async findReservationById(
    id: string,
  ): Promise<
    InventoryStockReservation | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stock_reservations
        WHERE id = $1
        `,
        [
          id,
        ],
      );

    return result.rows[0]
      ? this.mapReservation(
          result.rows[0],
        )
      : null;
  }

  async listReservations(
    filters: {
      itemId?: string;
      storeId?: string;
      binLocationId?: string;
      batchId?: string;
      sourceType?: string;
      sourceId?: string;
      status?: string;
    } = {},
  ): Promise<
    InventoryStockReservation[]
  > {
    const conditions:
      string[] = [];

    const values:
      unknown[] = [];

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
        'item_id',
        filters.itemId,
      );
    }

    if (filters.storeId) {
      addCondition(
        'store_id',
        filters.storeId,
      );
    }

    if (
      filters.binLocationId
    ) {
      addCondition(
        'bin_location_id',
        filters.binLocationId,
      );
    }

    if (filters.batchId) {
      addCondition(
        'batch_id',
        filters.batchId,
      );
    }

    if (filters.sourceType) {
      addCondition(
        'source_type',
        filters.sourceType,
      );
    }

    if (filters.sourceId) {
      addCondition(
        'source_id',
        filters.sourceId,
      );
    }

    if (filters.status) {
      addCondition(
        'status',
        filters.status,
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
        FROM inventory_stock_reservations
        ${where}
        ORDER BY created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapReservation(
          row,
        ),
    );
  }

  async createReservation(
    reservation:
      InventoryStockReservation,
  ): Promise<
    InventoryStockReservation
  > {
    const result =
      await this.pool.query(
        `
        INSERT INTO inventory_stock_reservations (
          id,
          reservation_number,
          item_id,
          store_id,
          bin_location_id,
          batch_id,
          quantity,
          fulfilled_quantity,
          released_quantity,
          status,
          source_type,
          source_id,
          reference_number,
          reserved_for_person_id,
          created_by_person_id,
          released_by_person_id,
          fulfilled_by_person_id,
          expires_at,
          released_at,
          fulfilled_at,
          remarks,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,
          $19,$20,$21,$22,$23,$24
        )
        RETURNING *
        `,
        [
          reservation.id,
          reservation.reservationNumber,
          reservation.itemId,
          reservation.storeId,
          reservation.binLocationId ??
            null,
          reservation.batchId ??
            null,
          reservation.quantity,
          reservation.fulfilledQuantity,
          reservation.releasedQuantity,
          reservation.status,
          reservation.sourceType,
          reservation.sourceId ??
            null,
          reservation.referenceNumber ??
            null,
          reservation.reservedForPersonId ??
            null,
          reservation.createdByPersonId ??
            null,
          reservation.releasedByPersonId ??
            null,
          reservation.fulfilledByPersonId ??
            null,
          reservation.expiresAt ??
            null,
          reservation.releasedAt ??
            null,
          reservation.fulfilledAt ??
            null,
          reservation.remarks ??
            null,
          JSON.stringify(
            reservation.metadata ?? {},
          ),
          reservation.createdAt,
          reservation.updatedAt,
        ],
      );

    return this.mapReservation(
      result.rows[0],
    );
  }

  async updateReservation(
    reservationId: string,

    input: {
      fulfilledQuantity: number;
      releasedQuantity: number;
      status:
        InventoryReservationStatus;

      releasedByPersonId?: string;
      fulfilledByPersonId?: string;

      releasedAt?: Date;
      fulfilledAt?: Date;

      remarks?: string;
      updatedAt: Date;
    },
  ): Promise<
    InventoryStockReservation | null
  > {
    const result =
      await this.pool.query(
        `
        UPDATE inventory_stock_reservations
        SET
          fulfilled_quantity = $2,
          released_quantity = $3,
          status = $4,

          released_by_person_id =
            COALESCE(
              $5,
              released_by_person_id
            ),

          fulfilled_by_person_id =
            COALESCE(
              $6,
              fulfilled_by_person_id
            ),

          released_at =
            COALESCE(
              $7,
              released_at
            ),

          fulfilled_at =
            COALESCE(
              $8,
              fulfilled_at
            ),

          remarks =
            COALESCE(
              $9,
              remarks
            ),

          updated_at = $10
        WHERE id = $1
        RETURNING *
        `,
        [
          reservationId,
          input.fulfilledQuantity,
          input.releasedQuantity,
          input.status,
          input.releasedByPersonId ??
            null,
          input.fulfilledByPersonId ??
            null,
          input.releasedAt ??
            null,
          input.fulfilledAt ??
            null,
          input.remarks ??
            null,
          input.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapReservation(
          result.rows[0],
        )
      : null;
  }

  async listExpiredReservations(
    asOf: Date,
  ): Promise<
    InventoryStockReservation[]
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stock_reservations
        WHERE expires_at IS NOT NULL
          AND expires_at <= $1
          AND status IN (
            'ACTIVE',
            'PARTIALLY_FULFILLED'
          )
        ORDER BY
          expires_at ASC,
          created_at ASC
        `,
        [
          asOf,
        ],
      );

    return result.rows.map(
      (row) =>
        this.mapReservation(row),
    );
  }

  async createCycleCount(
    cycleCount:
      InventoryCycleCount,

    items:
      InventoryCycleCountItem[],
  ): Promise<{
    cycleCount:
      InventoryCycleCount;

    items:
      InventoryCycleCountItem[];
  }> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await client.query(
        `
        INSERT INTO inventory_cycle_counts (
          id,
          count_number,
          property_id,
          store_id,
          status,
          count_date,
          blind_count,
          freeze_stock,
          scope_type,
          notes,
          created_by_person_id,
          started_by_person_id,
          completed_by_person_id,
          posted_by_person_id,
          cancelled_by_person_id,
          started_at,
          completed_at,
          posted_at,
          cancelled_at,
          cancellation_reason,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19,$20,$21,$22,$23
        )
        `,
        [
          cycleCount.id,
          cycleCount.countNumber,
          cycleCount.propertyId,
          cycleCount.storeId,
          cycleCount.status,
          cycleCount.countDate,
          cycleCount.blindCount,
          cycleCount.freezeStock,
          cycleCount.scopeType,
          cycleCount.notes ??
            null,
          cycleCount.createdByPersonId,
          cycleCount.startedByPersonId ??
            null,
          cycleCount.completedByPersonId ??
            null,
          cycleCount.postedByPersonId ??
            null,
          cycleCount.cancelledByPersonId ??
            null,
          cycleCount.startedAt ??
            null,
          cycleCount.completedAt ??
            null,
          cycleCount.postedAt ??
            null,
          cycleCount.cancelledAt ??
            null,
          cycleCount.cancellationReason ??
            null,
          JSON.stringify(
            cycleCount.metadata ?? {},
          ),
          cycleCount.createdAt,
          cycleCount.updatedAt,
        ],
      );

      for (const item of items) {
        await client.query(
          `
          INSERT INTO inventory_cycle_count_items (
            id,
            cycle_count_id,
            item_id,
            bin_location_id,
            system_quantity,
            counted_quantity,
            variance_quantity,
            average_unit_cost,
            variance_value,
            counted_by_person_id,
            counted_at,
            remarks,
            metadata,
            created_at,
            updated_at
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,
            $9,$10,$11,$12,$13,$14,$15
          )
          `,
          [
            item.id,
            item.cycleCountId,
            item.itemId,
            item.binLocationId ??
              null,
            item.systemQuantity,
            item.countedQuantity ??
              null,
            item.varianceQuantity ??
              null,
            item.averageUnitCost,
            item.varianceValue ??
              null,
            item.countedByPersonId ??
              null,
            item.countedAt ??
              null,
            item.remarks ??
              null,
            JSON.stringify(
              item.metadata ?? {},
            ),
            item.createdAt,
            item.updatedAt,
          ],
        );
      }

      await client.query(
        'COMMIT',
      );

      const created =
        await this.findCycleCountById(
          cycleCount.id,
        );

      if (!created) {
        throw new Error(
          'Created Inventory Cycle Count was not found',
        );
      }

      return created;
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }
  }

  async findCycleCountById(
    id: string,
  ): Promise<{
    cycleCount:
      InventoryCycleCount;

    items:
      InventoryCycleCountItem[];
  } | null> {
    const countResult =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_cycle_counts
        WHERE id = $1
        `,
        [
          id,
        ],
      );

    if (!countResult.rows[0]) {
      return null;
    }

    const itemResult =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_cycle_count_items
        WHERE cycle_count_id = $1
        ORDER BY
          created_at ASC,
          item_id ASC
        `,
        [
          id,
        ],
      );

    return {
      cycleCount:
        this.mapCycleCount(
          countResult.rows[0],
        ),

      items:
        itemResult.rows.map(
          (row) =>
            this.mapCycleCountItem(
              row,
            ),
        ),
    };
  }

  async listCycleCounts(
    filters: {
      propertyId?: string;
      storeId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
  ): Promise<
    InventoryCycleCount[]
  > {
    const conditions:
      string[] = [];

    const values:
      unknown[] = [];

    const addCondition = (
      expression: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${expression} $${values.length}`,
      );
    };

    if (filters.propertyId) {
      addCondition(
        'property_id =',
        filters.propertyId,
      );
    }

    if (filters.storeId) {
      addCondition(
        'store_id =',
        filters.storeId,
      );
    }

    if (filters.status) {
      addCondition(
        'status =',
        filters.status,
      );
    }

    if (filters.dateFrom) {
      addCondition(
        'count_date >=',
        filters.dateFrom,
      );
    }

    if (filters.dateTo) {
      addCondition(
        'count_date <=',
        filters.dateTo,
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
        FROM inventory_cycle_counts
        ${where}
        ORDER BY
          count_date DESC,
          created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapCycleCount(row),
    );
  }

  async updateCycleCountStatus(
    cycleCountId: string,

    input: {
      status:
        InventoryCycleCountStatus;

      startedByPersonId?: string;
      completedByPersonId?: string;
      postedByPersonId?: string;
      cancelledByPersonId?: string;

      startedAt?: Date;
      completedAt?: Date;
      postedAt?: Date;
      cancelledAt?: Date;

      cancellationReason?: string;
      updatedAt: Date;
    },
  ): Promise<
    InventoryCycleCount | null
  > {
    const result =
      await this.pool.query(
        `
        UPDATE inventory_cycle_counts
        SET
          status = $2,

          started_by_person_id =
            COALESCE(
              $3,
              started_by_person_id
            ),

          completed_by_person_id =
            COALESCE(
              $4,
              completed_by_person_id
            ),

          posted_by_person_id =
            COALESCE(
              $5,
              posted_by_person_id
            ),

          cancelled_by_person_id =
            COALESCE(
              $6,
              cancelled_by_person_id
            ),

          started_at =
            COALESCE(
              $7,
              started_at
            ),

          completed_at =
            COALESCE(
              $8,
              completed_at
            ),

          posted_at =
            COALESCE(
              $9,
              posted_at
            ),

          cancelled_at =
            COALESCE(
              $10,
              cancelled_at
            ),

          cancellation_reason =
            COALESCE(
              $11,
              cancellation_reason
            ),

          updated_at = $12
        WHERE id = $1
        RETURNING *
        `,
        [
          cycleCountId,
          input.status,
          input.startedByPersonId ??
            null,
          input.completedByPersonId ??
            null,
          input.postedByPersonId ??
            null,
          input.cancelledByPersonId ??
            null,
          input.startedAt ??
            null,
          input.completedAt ??
            null,
          input.postedAt ??
            null,
          input.cancelledAt ??
            null,
          input.cancellationReason ??
            null,
          input.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapCycleCount(
          result.rows[0],
        )
      : null;
  }

  async updateCycleCountItem(
    cycleCountItemId: string,

    input: {
      countedQuantity: number;
      varianceQuantity: number;
      varianceValue: number;
      countedByPersonId: string;
      countedAt: Date;
      remarks?: string;
      updatedAt: Date;
    },
  ): Promise<
    InventoryCycleCountItem | null
  > {
    const result =
      await this.pool.query(
        `
        UPDATE inventory_cycle_count_items
        SET
          counted_quantity = $2,
          variance_quantity = $3,
          variance_value = $4,
          counted_by_person_id = $5,
          counted_at = $6,
          remarks = COALESCE(
            $7,
            remarks
          ),
          updated_at = $8
        WHERE id = $1
        RETURNING *
        `,
        [
          cycleCountItemId,
          input.countedQuantity,
          input.varianceQuantity,
          input.varianceValue,
          input.countedByPersonId,
          input.countedAt,
          input.remarks ??
            null,
          input.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapCycleCountItem(
          result.rows[0],
        )
      : null;
  }

  async createMaterialReturn(
    materialReturn:
      InventoryMaterialReturn,

    items:
      InventoryMaterialReturnItem[],
  ): Promise<{
    materialReturn:
      InventoryMaterialReturn;

    items:
      InventoryMaterialReturnItem[];
  }> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await client.query(
        `
        INSERT INTO inventory_material_returns (
          id,
          return_number,
          property_id,
          store_id,
          material_issue_id,
          status,
          return_date,
          reason_code,
          reason_description,
          returned_by_person_id,
          created_by_person_id,
          posted_by_person_id,
          cancelled_by_person_id,
          posted_at,
          cancelled_at,
          cancellation_reason,
          remarks,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,$17,$18,
          $19,$20
        )
        `,
        [
          materialReturn.id,
          materialReturn.returnNumber,
          materialReturn.propertyId,
          materialReturn.storeId,
          materialReturn.materialIssueId ??
            null,
          materialReturn.status,
          materialReturn.returnDate,
          materialReturn.reasonCode,
          materialReturn.reasonDescription ??
            null,
          materialReturn.returnedByPersonId ??
            null,
          materialReturn.createdByPersonId,
          materialReturn.postedByPersonId ??
            null,
          materialReturn.cancelledByPersonId ??
            null,
          materialReturn.postedAt ??
            null,
          materialReturn.cancelledAt ??
            null,
          materialReturn.cancellationReason ??
            null,
          materialReturn.remarks ??
            null,
          JSON.stringify(
            materialReturn.metadata ?? {},
          ),
          materialReturn.createdAt,
          materialReturn.updatedAt,
        ],
      );

      for (const item of items) {
        await client.query(
          `
          INSERT INTO inventory_material_return_items (
            id,
            material_return_id,
            item_id,
            bin_location_id,
            batch_id,
            quantity,
            unit_cost,
            remarks,
            metadata,
            created_at,
            updated_at
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
          )
          `,
          [
            item.id,
            item.materialReturnId,
            item.itemId,
            item.binLocationId ??
              null,
            item.batchId ??
              null,
            item.quantity,
            item.unitCost,
            item.remarks ??
              null,
            JSON.stringify(
              item.metadata ?? {},
            ),
            item.createdAt,
            item.updatedAt,
          ],
        );
      }

      await client.query(
        'COMMIT',
      );

      const created =
        await this.findMaterialReturnById(
          materialReturn.id,
        );

      if (!created) {
        throw new Error(
          'Created Inventory Material Return was not found',
        );
      }

      return created;
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }
  }

  async listMaterialReturns(
    filters: {
      propertyId?: string;
      storeId?: string;
      materialIssueId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
  ): Promise<
    InventoryMaterialReturn[]
  > {
    const conditions:
      string[] = [];

    const values:
      unknown[] = [];

    const addCondition = (
      expression: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${expression} $${values.length}`,
      );
    };

    if (filters.propertyId) {
      addCondition(
        'property_id =',
        filters.propertyId,
      );
    }

    if (filters.storeId) {
      addCondition(
        'store_id =',
        filters.storeId,
      );
    }

    if (
      filters.materialIssueId
    ) {
      addCondition(
        'material_issue_id =',
        filters.materialIssueId,
      );
    }

    if (filters.status) {
      addCondition(
        'status =',
        filters.status,
      );
    }

    if (filters.dateFrom) {
      addCondition(
        'return_date >=',
        filters.dateFrom,
      );
    }

    if (filters.dateTo) {
      addCondition(
        'return_date <=',
        filters.dateTo,
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
        FROM inventory_material_returns
        ${where}
        ORDER BY
          return_date DESC,
          created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapMaterialReturn(
          row,
        ),
    );
  }

  async getPostedMaterialReturnQuantity(
    materialIssueId: string,
    itemId: string,
    binLocationId?: string,
    batchId?: string,
  ): Promise<number> {
    const client =
      await this.pool.connect();

    try {
      return await this
        .getPostedMaterialReturnQuantityWithClient(
          client,
          materialIssueId,
          itemId,
          binLocationId,
          batchId,
        );
    } finally {
      client.release();
    }
  }

  private async getPostedMaterialReturnQuantityWithClient(
    client: PoolClient,
    materialIssueId: string,
    itemId: string,
    binLocationId?: string,
    batchId?: string,
  ): Promise<number> {
    const result =
      await client.query(
        `
        SELECT
          COALESCE(
            SUM(item.quantity),
            0
          ) AS returned_quantity
        FROM inventory_material_returns document
        INNER JOIN inventory_material_return_items item
          ON item.material_return_id =
            document.id
        WHERE document.material_issue_id = $1
          AND document.status = 'POSTED'
          AND item.item_id = $2
          AND (
            item.bin_location_id = $3
            OR (
              item.bin_location_id IS NULL
              AND $3::UUID IS NULL
            )
          )
          AND (
            item.batch_id = $4
            OR (
              item.batch_id IS NULL
              AND $4::UUID IS NULL
            )
          )
        `,
        [
          materialIssueId,
          itemId,
          binLocationId ??
            null,
          batchId ??
            null,
        ],
      );

    return Number(
      result.rows[0]
        ?.returned_quantity ??
      0,
    );
  }

  async updateMaterialReturnStatus(
    materialReturnId: string,

    input: {
      status:
        InventoryMaterialReturnStatus;

      postedByPersonId?: string;
      cancelledByPersonId?: string;

      postedAt?: Date;
      cancelledAt?: Date;

      cancellationReason?: string;
      updatedAt: Date;
    },
  ): Promise<
    InventoryMaterialReturn | null
  > {
    const client =
      await this.pool.connect();

    try {
      return await this
        .updateMaterialReturnStatusWithClient(
          client,
          materialReturnId,
          input,
        );
    } finally {
      client.release();
    }
  }

  private async updateMaterialReturnStatusWithClient(
    client: PoolClient,

    materialReturnId: string,

    input: {
      status:
        InventoryMaterialReturnStatus;

      postedByPersonId?: string;
      cancelledByPersonId?: string;

      postedAt?: Date;
      cancelledAt?: Date;

      cancellationReason?: string;
      updatedAt: Date;
    },
  ): Promise<
    InventoryMaterialReturn | null
  > {
    const result =
      await client.query(
        `
        UPDATE inventory_material_returns
        SET
          status = $2,

          posted_by_person_id =
            COALESCE(
              $3,
              posted_by_person_id
            ),

          cancelled_by_person_id =
            COALESCE(
              $4,
              cancelled_by_person_id
            ),

          posted_at =
            COALESCE(
              $5,
              posted_at
            ),

          cancelled_at =
            COALESCE(
              $6,
              cancelled_at
            ),

          cancellation_reason =
            COALESCE(
              $7,
              cancellation_reason
            ),

          updated_at = $8
        WHERE id = $1
        RETURNING *
        `,
        [
          materialReturnId,
          input.status,
          input.postedByPersonId ??
            null,
          input.cancelledByPersonId ??
            null,
          input.postedAt ??
            null,
          input.cancelledAt ??
            null,
          input.cancellationReason ??
            null,
          input.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapMaterialReturn(
          result.rows[0],
        )
      : null;
  }

  async findMaterialReturnById(
    id: string,
  ): Promise<{
    materialReturn:
      InventoryMaterialReturn;

    items:
      InventoryMaterialReturnItem[];
  } | null> {
    const client =
      await this.pool.connect();

    try {
      return await this
        .findMaterialReturnByIdWithClient(
          client,
          id,
          false,
        );
    } finally {
      client.release();
    }
  }

  private async findMaterialReturnByIdWithClient(
    client: PoolClient,
    id: string,
    lock: boolean,
  ): Promise<{
    materialReturn:
      InventoryMaterialReturn;

    items:
      InventoryMaterialReturnItem[];
  } | null> {
    const materialReturnResult =
      await client.query(
        `
        SELECT *
        FROM inventory_material_returns
        WHERE id = $1
        ${lock ? 'FOR UPDATE' : ''}
        `,
        [
          id,
        ],
      );

    if (
      !materialReturnResult.rows[0]
    ) {
      return null;
    }

    const itemsResult =
      await client.query(
        `
        SELECT *
        FROM inventory_material_return_items
        WHERE material_return_id = $1
        ORDER BY created_at ASC
        `,
        [
          id,
        ],
      );

    return {
      materialReturn:
        this.mapMaterialReturn(
          materialReturnResult.rows[0],
        ),

      items:
        itemsResult.rows.map(
          (row) =>
            this.mapMaterialReturnItem(
              row,
            ),
        ),
    };
  }

  async createMaterialIssue(
    materialIssue:
      InventoryMaterialIssue,

    items:
      InventoryMaterialIssueItem[],
  ): Promise<{
    materialIssue:
      InventoryMaterialIssue;

    items:
      InventoryMaterialIssueItem[];
  }> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await client.query(
        `
        INSERT INTO inventory_material_issues (
          id,
          issue_number,
          property_id,
          store_id,
          status,
          issue_date,
          reason_code,
          reason_description,
          requested_by_person_id,
          created_by_person_id,
          posted_by_person_id,
          cancelled_by_person_id,
          posted_at,
          cancelled_at,
          cancellation_reason,
          remarks,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19
        )
        `,
        [
          materialIssue.id,
          materialIssue.issueNumber,
          materialIssue.propertyId,
          materialIssue.storeId,
          materialIssue.status,
          materialIssue.issueDate,
          materialIssue.reasonCode,
          materialIssue.reasonDescription ??
            null,
          materialIssue.requestedByPersonId ??
            null,
          materialIssue.createdByPersonId,
          materialIssue.postedByPersonId ??
            null,
          materialIssue.cancelledByPersonId ??
            null,
          materialIssue.postedAt ??
            null,
          materialIssue.cancelledAt ??
            null,
          materialIssue.cancellationReason ??
            null,
          materialIssue.remarks ??
            null,
          JSON.stringify(
            materialIssue.metadata ?? {},
          ),
          materialIssue.createdAt,
          materialIssue.updatedAt,
        ],
      );

      for (const item of items) {
        await client.query(
          `
          INSERT INTO inventory_material_issue_items (
            id,
            material_issue_id,
            item_id,
            bin_location_id,
            batch_id,
            quantity,
            unit_cost,
            remarks,
            metadata,
            created_at,
            updated_at
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
          )
          `,
          [
            item.id,
            item.materialIssueId,
            item.itemId,
            item.binLocationId ??
              null,
            item.batchId ??
              null,
            item.quantity,
            item.unitCost,
            item.remarks ??
              null,
            JSON.stringify(
              item.metadata ?? {},
            ),
            item.createdAt,
            item.updatedAt,
          ],
        );
      }

      await client.query(
        'COMMIT',
      );

      const created =
        await this.findMaterialIssueById(
          materialIssue.id,
        );

      if (!created) {
        throw new Error(
          'Created Inventory Material Issue was not found',
        );
      }

      return created;
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }
  }

  async listMaterialIssues(
    filters: {
      propertyId?: string;
      storeId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
  ): Promise<
    InventoryMaterialIssue[]
  > {
    const conditions:
      string[] = [];

    const values:
      unknown[] = [];

    const addCondition = (
      expression: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${expression} $${values.length}`,
      );
    };

    if (filters.propertyId) {
      addCondition(
        'property_id =',
        filters.propertyId,
      );
    }

    if (filters.storeId) {
      addCondition(
        'store_id =',
        filters.storeId,
      );
    }

    if (filters.status) {
      addCondition(
        'status =',
        filters.status,
      );
    }

    if (filters.dateFrom) {
      addCondition(
        'issue_date >=',
        filters.dateFrom,
      );
    }

    if (filters.dateTo) {
      addCondition(
        'issue_date <=',
        filters.dateTo,
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
        FROM inventory_material_issues
        ${where}
        ORDER BY
          issue_date DESC,
          created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapMaterialIssue(
          row,
        ),
    );
  }

  async updateMaterialIssueStatus(
    materialIssueId: string,

    input: {
      status:
        InventoryMaterialIssueStatus;

      postedByPersonId?: string;
      cancelledByPersonId?: string;

      postedAt?: Date;
      cancelledAt?: Date;

      cancellationReason?: string;
      updatedAt: Date;
    },
  ): Promise<
    InventoryMaterialIssue | null
  > {
    const client =
      await this.pool.connect();

    try {
      return await this
        .updateMaterialIssueStatusWithClient(
          client,
          materialIssueId,
          input,
        );
    } finally {
      client.release();
    }
  }

  private async updateMaterialIssueStatusWithClient(
    client: PoolClient,

    materialIssueId: string,

    input: {
      status:
        InventoryMaterialIssueStatus;

      postedByPersonId?: string;
      cancelledByPersonId?: string;

      postedAt?: Date;
      cancelledAt?: Date;

      cancellationReason?: string;
      updatedAt: Date;
    },
  ): Promise<
    InventoryMaterialIssue | null
  > {
    const result =
      await client.query(
        `
        UPDATE inventory_material_issues
        SET
          status = $2,

          posted_by_person_id =
            COALESCE(
              $3,
              posted_by_person_id
            ),

          cancelled_by_person_id =
            COALESCE(
              $4,
              cancelled_by_person_id
            ),

          posted_at =
            COALESCE(
              $5,
              posted_at
            ),

          cancelled_at =
            COALESCE(
              $6,
              cancelled_at
            ),

          cancellation_reason =
            COALESCE(
              $7,
              cancellation_reason
            ),

          updated_at = $8
        WHERE id = $1
        RETURNING *
        `,
        [
          materialIssueId,
          input.status,
          input.postedByPersonId ??
            null,
          input.cancelledByPersonId ??
            null,
          input.postedAt ??
            null,
          input.cancelledAt ??
            null,
          input.cancellationReason ??
            null,
          input.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapMaterialIssue(
          result.rows[0],
        )
      : null;
  }

  async findMaterialIssueById(
    id: string,
  ): Promise<{
    materialIssue:
      InventoryMaterialIssue;

    items:
      InventoryMaterialIssueItem[];
  } | null> {
    const client =
      await this.pool.connect();

    try {
      return await this
        .findMaterialIssueByIdWithClient(
          client,
          id,
          false,
        );
    } finally {
      client.release();
    }
  }

  private async findMaterialIssueByIdWithClient(
    client: PoolClient,
    id: string,
    lock: boolean,
  ): Promise<{
    materialIssue:
      InventoryMaterialIssue;

    items:
      InventoryMaterialIssueItem[];
  } | null> {
    const materialIssueResult =
      await client.query(
        `
        SELECT *
        FROM inventory_material_issues
        WHERE id = $1
        ${lock ? 'FOR UPDATE' : ''}
        `,
        [
          id,
        ],
      );

    if (
      !materialIssueResult.rows[0]
    ) {
      return null;
    }

    const itemsResult =
      await client.query(
        `
        SELECT *
        FROM inventory_material_issue_items
        WHERE material_issue_id = $1
        ORDER BY created_at ASC
        `,
        [
          id,
        ],
      );

    return {
      materialIssue:
        this.mapMaterialIssue(
          materialIssueResult.rows[0],
        ),

      items:
        itemsResult.rows.map(
          (row) =>
            this.mapMaterialIssueItem(
              row,
            ),
        ),
    };
  }

  async createAdjustment(
    adjustment:
      InventoryStockAdjustment,

    items:
      InventoryStockAdjustmentItem[],
  ): Promise<{
    adjustment:
      InventoryStockAdjustment;

    items:
      InventoryStockAdjustmentItem[];
  }> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await client.query(
        `
        INSERT INTO inventory_stock_adjustments (
          id,
          adjustment_number,
          property_id,
          store_id,
          status,
          adjustment_date,
          reason_code,
          reason_description,
          created_by_person_id,
          posted_by_person_id,
          cancelled_by_person_id,
          posted_at,
          cancelled_at,
          cancellation_reason,
          remarks,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12,$13,$14,$15,$16,
          $17,$18
        )
        `,
        [
          adjustment.id,
          adjustment.adjustmentNumber,
          adjustment.propertyId,
          adjustment.storeId,
          adjustment.status,
          adjustment.adjustmentDate,
          adjustment.reasonCode,
          adjustment.reasonDescription ??
            null,
          adjustment.createdByPersonId,
          adjustment.postedByPersonId ??
            null,
          adjustment.cancelledByPersonId ??
            null,
          adjustment.postedAt ??
            null,
          adjustment.cancelledAt ??
            null,
          adjustment.cancellationReason ??
            null,
          adjustment.remarks ??
            null,
          JSON.stringify(
            adjustment.metadata ?? {},
          ),
          adjustment.createdAt,
          adjustment.updatedAt,
        ],
      );

      for (const item of items) {
        await client.query(
          `
          INSERT INTO inventory_stock_adjustment_items (
            id,
            adjustment_id,
            item_id,
            bin_location_id,
            quantity_delta,
            unit_cost,
            remarks,
            created_at
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8
          )
          `,
          [
            item.id,
            item.adjustmentId,
            item.itemId,
            item.binLocationId ??
              null,
            item.quantityDelta,
            item.unitCost,
            item.remarks ??
              null,
            item.createdAt,
          ],
        );
      }

      await client.query(
        'COMMIT',
      );

      const created =
        await this.findAdjustmentById(
          adjustment.id,
        );

      if (!created) {
        throw new Error(
          'Created Inventory adjustment was not found',
        );
      }

      return created;
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }
  }

  async listAdjustments(
    filters: {
      propertyId?: string;
      storeId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
  ): Promise<
    InventoryStockAdjustment[]
  > {
    const conditions:
      string[] = [];

    const values:
      unknown[] = [];

    const addCondition = (
      expression: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${expression} $${values.length}`,
      );
    };

    if (filters.propertyId) {
      addCondition(
        'property_id =',
        filters.propertyId,
      );
    }

    if (filters.storeId) {
      addCondition(
        'store_id =',
        filters.storeId,
      );
    }

    if (filters.status) {
      addCondition(
        'status =',
        filters.status,
      );
    }

    if (filters.dateFrom) {
      addCondition(
        'adjustment_date >=',
        filters.dateFrom,
      );
    }

    if (filters.dateTo) {
      addCondition(
        'adjustment_date <=',
        filters.dateTo,
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
        FROM inventory_stock_adjustments
        ${where}
        ORDER BY
          adjustment_date DESC,
          created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapAdjustment(row),
    );
  }

  async updateAdjustmentStatus(
    adjustmentId: string,

    input: {
      status:
        InventoryAdjustmentStatus;

      postedByPersonId?: string;
      cancelledByPersonId?: string;
      postedAt?: Date;
      cancelledAt?: Date;
      cancellationReason?: string;
      updatedAt: Date;
    },
  ): Promise<
    InventoryStockAdjustment | null
  > {
    const result =
      await this.pool.query(
        `
        UPDATE inventory_stock_adjustments
        SET
          status = $2,
          posted_by_person_id = $3,
          cancelled_by_person_id = $4,
          posted_at = $5,
          cancelled_at = $6,
          cancellation_reason = $7,
          updated_at = $8
        WHERE id = $1
        RETURNING *
        `,
        [
          adjustmentId,
          input.status,
          input.postedByPersonId ??
            null,
          input.cancelledByPersonId ??
            null,
          input.postedAt ??
            null,
          input.cancelledAt ??
            null,
          input.cancellationReason ??
            null,
          input.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapAdjustment(
          result.rows[0],
        )
      : null;
  }

  async findAdjustmentById(
    id: string,
  ): Promise<{
    adjustment:
      InventoryStockAdjustment;

    items:
      InventoryStockAdjustmentItem[];
  } | null> {
    const adjustmentResult =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stock_adjustments
        WHERE id = $1
        `,
        [
          id,
        ],
      );

    if (
      !adjustmentResult.rows[0]
    ) {
      return null;
    }

    const itemsResult =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stock_adjustment_items
        WHERE adjustment_id = $1
        ORDER BY created_at ASC
        `,
        [
          id,
        ],
      );

    return {
      adjustment:
        this.mapAdjustment(
          adjustmentResult.rows[0],
        ),

      items:
        itemsResult.rows.map(
          (row) =>
            this.mapAdjustmentItem(
              row,
            ),
        ),
    };
  }

  async createTransfer(
    transfer:
      InventoryStockTransfer,

    items:
      InventoryStockTransferItem[],
  ): Promise<{
    transfer:
      InventoryStockTransfer;

    items:
      InventoryStockTransferItem[];
  }> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await client.query(
        `
        INSERT INTO inventory_stock_transfers (
          id,
          transfer_number,
          property_id,
          source_store_id,
          destination_store_id,
          status,
          transfer_date,
          created_by_person_id,
          dispatched_by_person_id,
          received_by_person_id,
          cancelled_by_person_id,
          dispatched_at,
          received_at,
          cancelled_at,
          cancellation_reason,
          remarks,
          metadata,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,
          $10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19
        )
        `,
        [
          transfer.id,
          transfer.transferNumber,
          transfer.propertyId,
          transfer.sourceStoreId,
          transfer.destinationStoreId,
          transfer.status,
          transfer.transferDate,
          transfer.createdByPersonId,
          transfer.dispatchedByPersonId ??
            null,
          transfer.receivedByPersonId ??
            null,
          transfer.cancelledByPersonId ??
            null,
          transfer.dispatchedAt ??
            null,
          transfer.receivedAt ??
            null,
          transfer.cancelledAt ??
            null,
          transfer.cancellationReason ??
            null,
          transfer.remarks ??
            null,
          JSON.stringify(
            transfer.metadata ?? {},
          ),
          transfer.createdAt,
          transfer.updatedAt,
        ],
      );

      for (const item of items) {
        await client.query(
          `
          INSERT INTO inventory_stock_transfer_items (
            id,
            transfer_id,
            item_id,
            source_bin_location_id,
            destination_bin_location_id,
            quantity,
            dispatched_quantity,
            received_quantity,
            unit_cost,
            remarks,
            created_at,
            updated_at
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,
            $9,$10,$11,$12
          )
          `,
          [
            item.id,
            item.transferId,
            item.itemId,
            item.sourceBinLocationId ??
              null,
            item.destinationBinLocationId ??
              null,
            item.quantity,
            item.dispatchedQuantity,
            item.receivedQuantity,
            item.unitCost,
            item.remarks ??
              null,
            item.createdAt,
            item.updatedAt,
          ],
        );
      }

      await client.query(
        'COMMIT',
      );

      const created =
        await this.findTransferById(
          transfer.id,
        );

      if (!created) {
        throw new Error(
          'Created Inventory transfer was not found',
        );
      }

      return created;
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }
  }

  async listTransfers(
    filters: {
      propertyId?: string;
      sourceStoreId?: string;
      destinationStoreId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {},
  ): Promise<
    InventoryStockTransfer[]
  > {
    const conditions:
      string[] = [];

    const values:
      unknown[] = [];

    const addCondition = (
      expression: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${expression} $${values.length}`,
      );
    };

    if (filters.propertyId) {
      addCondition(
        'property_id =',
        filters.propertyId,
      );
    }

    if (filters.sourceStoreId) {
      addCondition(
        'source_store_id =',
        filters.sourceStoreId,
      );
    }

    if (
      filters.destinationStoreId
    ) {
      addCondition(
        'destination_store_id =',
        filters.destinationStoreId,
      );
    }

    if (filters.status) {
      addCondition(
        'status =',
        filters.status,
      );
    }

    if (filters.dateFrom) {
      addCondition(
        'transfer_date >=',
        filters.dateFrom,
      );
    }

    if (filters.dateTo) {
      addCondition(
        'transfer_date <=',
        filters.dateTo,
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
        FROM inventory_stock_transfers
        ${where}
        ORDER BY
          transfer_date DESC,
          created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapTransfer(row),
    );
  }

  async updateTransferStatus(
    transferId: string,

    input: {
      status:
        InventoryTransferStatus;

      dispatchedByPersonId?: string;
      receivedByPersonId?: string;
      cancelledByPersonId?: string;

      dispatchedAt?: Date;
      receivedAt?: Date;
      cancelledAt?: Date;

      cancellationReason?: string;
      updatedAt: Date;
    },
  ): Promise<
    InventoryStockTransfer | null
  > {
    const result =
      await this.pool.query(
        `
        UPDATE inventory_stock_transfers
        SET
          status = $2,

          dispatched_by_person_id =
            COALESCE(
              $3,
              dispatched_by_person_id
            ),

          received_by_person_id =
            COALESCE(
              $4,
              received_by_person_id
            ),

          cancelled_by_person_id =
            COALESCE(
              $5,
              cancelled_by_person_id
            ),

          dispatched_at =
            COALESCE(
              $6,
              dispatched_at
            ),

          received_at =
            COALESCE(
              $7,
              received_at
            ),

          cancelled_at =
            COALESCE(
              $8,
              cancelled_at
            ),

          cancellation_reason =
            COALESCE(
              $9,
              cancellation_reason
            ),

          updated_at = $10
        WHERE id = $1
        RETURNING *
        `,
        [
          transferId,
          input.status,
          input.dispatchedByPersonId ??
            null,
          input.receivedByPersonId ??
            null,
          input.cancelledByPersonId ??
            null,
          input.dispatchedAt ??
            null,
          input.receivedAt ??
            null,
          input.cancelledAt ??
            null,
          input.cancellationReason ??
            null,
          input.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapTransfer(
          result.rows[0],
        )
      : null;
  }

  async updateTransferItemQuantities(
    transferItemId: string,

    input: {
      dispatchedQuantity: number;
      receivedQuantity: number;
      updatedAt: Date;
    },
  ): Promise<
    InventoryStockTransferItem | null
  > {
    const result =
      await this.pool.query(
        `
        UPDATE inventory_stock_transfer_items
        SET
          dispatched_quantity = $2,
          received_quantity = $3,
          updated_at = $4
        WHERE id = $1
        RETURNING *
        `,
        [
          transferItemId,
          input.dispatchedQuantity,
          input.receivedQuantity,
          input.updatedAt,
        ],
      );

    return result.rows[0]
      ? this.mapTransferItem(
          result.rows[0],
        )
      : null;
  }

  async findTransferById(
    id: string,
  ): Promise<{
    transfer:
      InventoryStockTransfer;

    items:
      InventoryStockTransferItem[];
  } | null> {
    const transferResult =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stock_transfers
        WHERE id = $1
        `,
        [
          id,
        ],
      );

    if (!transferResult.rows[0]) {
      return null;
    }

    const itemsResult =
      await this.pool.query(
        `
        SELECT *
        FROM inventory_stock_transfer_items
        WHERE transfer_id = $1
        ORDER BY created_at ASC
        `,
        [
          id,
        ],
      );

    return {
      transfer:
        this.mapTransfer(
          transferResult.rows[0],
        ),

      items:
        itemsResult.rows.map(
          (row) =>
            this.mapTransferItem(
              row,
            ),
        ),
    };
  }

  private async acquireTransactionLock(
    client: PoolClient,
    key: string,
  ): Promise<void> {
    await client.query(
      `
      SELECT pg_advisory_xact_lock(
        hashtext($1)
      )
      `,
      [
        key,
      ],
    );
  }

  private async requireActiveBatch(
    client: PoolClient,
    batchId: string,
    itemId: string,
  ): Promise<void> {
    const result =
      await client.query(
        `
        SELECT id
        FROM inventory_batches
        WHERE id = $1
          AND item_id = $2
          AND status = 'ACTIVE'
        `,
        [
          batchId,
          itemId,
        ],
      );

    if (!result.rows[0]) {
      throw new BadRequestException(
        'Invalid, inactive, or mismatched Inventory Batch',
      );
    }
  }

  private async lockOrCreateBatchBalance(
    client: PoolClient,
    batchId: string,
    itemId: string,
    storeId: string,
    binLocationId?: string,
  ): Promise<
    InventoryBatchBalance
  > {
    let result =
      await client.query(
        `
        SELECT *
        FROM inventory_batch_balances
        WHERE batch_id = $1
          AND item_id = $2
          AND store_id = $3
          AND (
            bin_location_id = $4
            OR (
              bin_location_id IS NULL
              AND $4::UUID IS NULL
            )
          )
        FOR UPDATE
        `,
        [
          batchId,
          itemId,
          storeId,
          binLocationId ??
            null,
        ],
      );

    if (result.rows[0]) {
      return this.mapBatchBalance(
        result.rows[0],
      );
    }

    try {
      await client.query(
        `
        INSERT INTO inventory_batch_balances (
          id,
          batch_id,
          item_id,
          store_id,
          bin_location_id,
          quantity_on_hand,
          reserved_quantity,
          average_unit_cost,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,0,0,0,NOW(),NOW()
        )
        `,
        [
          randomUUID(),
          batchId,
          itemId,
          storeId,
          binLocationId ??
            null,
        ],
      );
    } catch (error) {
      if (
        (error as any)
          ?.code !== '23505'
      ) {
        throw error;
      }
    }

    result =
      await client.query(
        `
        SELECT *
        FROM inventory_batch_balances
        WHERE batch_id = $1
          AND item_id = $2
          AND store_id = $3
          AND (
            bin_location_id = $4
            OR (
              bin_location_id IS NULL
              AND $4::UUID IS NULL
            )
          )
        FOR UPDATE
        `,
        [
          batchId,
          itemId,
          storeId,
          binLocationId ??
            null,
        ],
      );

    if (!result.rows[0]) {
      throw new Error(
        'Unable to create or lock Inventory Batch balance',
      );
    }

    return this.mapBatchBalance(
      result.rows[0],
    );
  }

  private async updateBatchBalance(
    client: PoolClient,
    batchBalanceId: string,
    quantityAfter: number,
    reservedAfter: number,
    averageCostAfter: number,
    movementDate: Date,
  ): Promise<
    InventoryBatchBalance
  > {
    const result =
      await client.query(
        `
        UPDATE inventory_batch_balances
        SET
          quantity_on_hand = $2,
          reserved_quantity = $3,
          average_unit_cost = $4,
          last_movement_at = $5,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [
          batchBalanceId,
          quantityAfter,
          reservedAfter,
          averageCostAfter,
          movementDate,
        ],
      );

    return this.mapBatchBalance(
      result.rows[0],
    );
  }

  private async lockOrCreateBalance(
    client: PoolClient,
    itemId: string,
    storeId: string,
    binLocationId?: string,
  ): Promise<
    InventoryStockBalance
  > {
    let result =
      await client.query(
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
        FOR UPDATE
        `,
        [
          itemId,
          storeId,
          binLocationId ??
            null,
        ],
      );

    if (result.rows[0]) {
      return this.mapBalance(
        result.rows[0],
      );
    }

    try {
      await client.query(
        `
        INSERT INTO inventory_stock_balances (
          id,
          item_id,
          store_id,
          bin_location_id,
          quantity_on_hand,
          reserved_quantity,
          average_unit_cost,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,0,0,0,NOW(),NOW()
        )
        `,
        [
          randomUUID(),
          itemId,
          storeId,
          binLocationId ??
            null,
        ],
      );
    } catch (error) {
      if (
        (error as any)
          ?.code !== '23505'
      ) {
        throw error;
      }
    }

    result =
      await client.query(
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
        FOR UPDATE
        `,
        [
          itemId,
          storeId,
          binLocationId ??
            null,
        ],
      );

    if (!result.rows[0]) {
      throw new Error(
        'Unable to create or lock Inventory stock balance',
      );
    }

    return this.mapBalance(
      result.rows[0],
    );
  }

  private async updateBalance(
    client: PoolClient,
    balanceId: string,
    quantityAfter: number,
    reservedAfter: number,
    averageCostAfter: number,
    movementDate: Date,
  ): Promise<
    InventoryStockBalance
  > {
    const result =
      await client.query(
        `
        UPDATE inventory_stock_balances
        SET
          quantity_on_hand = $2,
          reserved_quantity = $3,
          average_unit_cost = $4,
          last_movement_at = $5,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
        `,
        [
          balanceId,
          quantityAfter,
          reservedAfter,
          averageCostAfter,
          movementDate,
        ],
      );

    return this.mapBalance(
      result.rows[0],
    );
  }

  private async insertLedgerEntry(
    client: PoolClient,
    input:
      PostInventoryMovementInput,
    before:
      InventoryStockBalance,
    after:
      InventoryStockBalance,
    quantityDelta: number,
    reservedDelta: number,
    unitCost: number,
    movementDate: Date,
  ): Promise<
    InventoryStockLedgerEntry
  > {
    const id =
      randomUUID();

    const movementNumber =
      `MOV-${movementDate
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '')}-${id
        .replace(/-/g, '')
        .slice(0, 12)
        .toUpperCase()}`;

    const result =
      await client.query(
        `
        INSERT INTO inventory_stock_ledger (
          id,
          movement_number,
          movement_type,
          item_id,
          store_id,
          bin_location_id,
          batch_id,
          quantity_delta,
          quantity_before,
          quantity_after,
          reserved_quantity_delta,
          reserved_quantity_before,
          reserved_quantity_after,
          unit_cost,
          average_unit_cost_before,
          average_unit_cost_after,
          source_type,
          source_id,
          source_line_id,
          reference_number,
          idempotency_key,
          correlation_id,
          movement_date,
          posted_by_person_id,
          remarks,
          metadata,
          created_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,$12,$13,$14,$15,
          $16,$17,$18,$19,$20,$21,$22,
          $23,$24,$25,$26,NOW()
        )
        RETURNING *
        `,
        [
          id,
          movementNumber,
          input.movementType,
          input.itemId,
          input.storeId,
          input.binLocationId ??
            null,
          input.batchId ??
            null,
          quantityDelta,
          before.quantityOnHand,
          after.quantityOnHand,
          reservedDelta,
          before.reservedQuantity,
          after.reservedQuantity,
          unitCost,
          before.averageUnitCost,
          after.averageUnitCost,
          input.sourceType,
          input.sourceId ??
            null,
          input.sourceLineId ??
            null,
          input.referenceNumber ??
            null,
          input.idempotencyKey ??
            null,
          input.correlationId ??
            null,
          movementDate,
          input.postedByPersonId ??
            null,
          input.remarks ??
            null,
          JSON.stringify(
            input.metadata ?? {},
          ),
        ],
      );

    return this.mapLedgerEntry(
      result.rows[0],
    );
  }

  private calculateAverageCost(
    quantityBefore: number,
    averageCostBefore: number,
    quantityDelta: number,
    incomingUnitCost: number,
    quantityAfter: number,
  ): number {
    if (quantityAfter === 0) {
      return 0;
    }

    if (quantityDelta <= 0) {
      return this.roundCost(
        averageCostBefore,
      );
    }

    const previousValue =
      quantityBefore *
      averageCostBefore;

    const incomingValue =
      quantityDelta *
      incomingUnitCost;

    return this.roundCost(
      (
        previousValue +
        incomingValue
      ) /
      quantityAfter,
    );
  }

  private validateMovementInput(
    input:
      PostInventoryMovementInput,
  ) {
    if (!input.sourceType?.trim()) {
      throw new BadRequestException(
        'sourceType is required',
      );
    }

    if (
      !Number.isFinite(
        input.quantityDelta,
      )
    ) {
      throw new BadRequestException(
        'quantityDelta must be numeric',
      );
    }

    const reservedDelta =
      input.reservedQuantityDelta ??
      0;

    if (
      !Number.isFinite(
        reservedDelta,
      )
    ) {
      throw new BadRequestException(
        'reservedQuantityDelta must be numeric',
      );
    }

    const quantityOnly =
      input.quantityDelta !== 0;

    const reservationOnly =
      reservedDelta !== 0;

    if (
      !quantityOnly &&
      !reservationOnly
    ) {
      throw new BadRequestException(
        'Movement must change stock or reserved quantity',
      );
    }

    const positiveTypes = [
      InventoryStockMovementType.OPENING,
      InventoryStockMovementType.RECEIPT,
      InventoryStockMovementType.TRANSFER_IN,
      InventoryStockMovementType.ADJUSTMENT_IN,
    ];

    const negativeTypes = [
      InventoryStockMovementType.ISSUE,
      InventoryStockMovementType.TRANSFER_OUT,
      InventoryStockMovementType.ADJUSTMENT_OUT,
    ];

    if (
      positiveTypes.includes(
        input.movementType,
      ) &&
      input.quantityDelta <= 0
    ) {
      throw new BadRequestException(
        `${input.movementType} requires a positive quantityDelta`,
      );
    }

    if (
      negativeTypes.includes(
        input.movementType,
      ) &&
      input.quantityDelta >= 0
    ) {
      throw new BadRequestException(
        `${input.movementType} requires a negative quantityDelta`,
      );
    }

    if (
      input.movementType ===
        InventoryStockMovementType.RESERVATION &&
      (
        input.quantityDelta !== 0 ||
        reservedDelta <= 0
      )
    ) {
      throw new BadRequestException(
        'RESERVATION requires zero quantityDelta and positive reservedQuantityDelta',
      );
    }

    if (
      input.movementType ===
        InventoryStockMovementType.RESERVATION_RELEASE &&
      (
        input.quantityDelta !== 0 ||
        reservedDelta >= 0
      )
    ) {
      throw new BadRequestException(
        'RESERVATION_RELEASE requires zero quantityDelta and negative reservedQuantityDelta',
      );
    }

    if (
      (
        input.unitCost ??
        0
      ) < 0
    ) {
      throw new BadRequestException(
        'unitCost cannot be negative',
      );
    }
  }

  private async requireActiveItem(
    client: PoolClient,
    itemId: string,
  ): Promise<{
    id: string;
    isBatchTracked: boolean;
  }> {
    const result =
      await client.query(
        `
        SELECT
          id,
          is_batch_tracked
        FROM inventory_items
        WHERE id = $1
          AND is_active = TRUE
        `,
        [
          itemId,
        ],
      );

    if (!result.rows[0]) {
      throw new BadRequestException(
        `Invalid or inactive Inventory item: ${itemId}`,
      );
    }

    return {
      id:
        result.rows[0].id,

      isBatchTracked:
        result.rows[0]
          .is_batch_tracked,
    };
  }

  private async requireActiveStore(
    client: PoolClient,
    storeId: string,
  ) {
    const result =
      await client.query(
        `
        SELECT id
        FROM inventory_stores
        WHERE id = $1
          AND is_active = TRUE
        `,
        [
          storeId,
        ],
      );

    if (!result.rows[0]) {
      throw new BadRequestException(
        `Invalid or inactive Inventory store: ${storeId}`,
      );
    }
  }

  private async requireActiveBin(
    client: PoolClient,
    binLocationId: string,
    storeId: string,
  ) {
    const result =
      await client.query(
        `
        SELECT id
        FROM inventory_bin_locations
        WHERE id = $1
          AND store_id = $2
          AND is_active = TRUE
        `,
        [
          binLocationId,
          storeId,
        ],
      );

    if (!result.rows[0]) {
      throw new BadRequestException(
        'Invalid, inactive, or mismatched Inventory bin location',
      );
    }
  }

  private async findLedgerEntryByIdempotencyKeyWithClient(
    client: PoolClient,
    key: string,
  ): Promise<
    InventoryStockLedgerEntry | null
  > {
    const result =
      await client.query(
        `
        SELECT *
        FROM inventory_stock_ledger
        WHERE idempotency_key = $1
        `,
        [
          key,
        ],
      );

    return result.rows[0]
      ? this.mapLedgerEntry(
          result.rows[0],
        )
      : null;
  }

  private async requireBatchBalanceWithClient(
    client: PoolClient,
    batchId: string,
    itemId: string,
    storeId: string,
    binLocationId?: string,
  ): Promise<
    InventoryBatchBalance
  > {
    const result =
      await client.query(
        `
        SELECT *
        FROM inventory_batch_balances
        WHERE batch_id = $1
          AND item_id = $2
          AND store_id = $3
          AND (
            bin_location_id = $4
            OR (
              bin_location_id IS NULL
              AND $4::UUID IS NULL
            )
          )
        `,
        [
          batchId,
          itemId,
          storeId,
          binLocationId ??
            null,
        ],
      );

    if (!result.rows[0]) {
      throw new Error(
        'Inventory Batch balance not found',
      );
    }

    return this.mapBatchBalance(
      result.rows[0],
    );
  }

  private async requireBalanceWithClient(
    client: PoolClient,
    itemId: string,
    storeId: string,
    binLocationId?: string,
  ): Promise<
    InventoryStockBalance
  > {
    const result =
      await client.query(
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
        `,
        [
          itemId,
          storeId,
          binLocationId ??
            null,
        ],
      );

    if (!result.rows[0]) {
      throw new Error(
        'Inventory stock balance not found',
      );
    }

    return this.mapBalance(
      result.rows[0],
    );
  }

  private async findBalance(
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
        `,
        [
          itemId,
          storeId,
          binLocationId ??
            null,
        ],
      );

    return result.rows[0]
      ? this.mapBalance(
          result.rows[0],
        )
      : null;
  }

  private roundQuantity(
    value: number,
  ) {
    return Number(
      Number(value).toFixed(6),
    );
  }

  private roundCost(
    value: number,
  ) {
    return Number(
      Number(value).toFixed(6),
    );
  }

  private mapLedgerEntry(
    row: any,
  ): InventoryStockLedgerEntry {
    return {
      id: row.id,
      movementNumber:
        row.movement_number,
      movementType:
        row.movement_type as
          InventoryStockMovementType,
      itemId:
        row.item_id,
      storeId:
        row.store_id,
      binLocationId:
        row.bin_location_id ??
        undefined,
      batchId:
        row.batch_id ??
        undefined,
      quantityDelta:
        Number(
          row.quantity_delta,
        ),
      quantityBefore:
        Number(
          row.quantity_before,
        ),
      quantityAfter:
        Number(
          row.quantity_after,
        ),
      reservedQuantityDelta:
        Number(
          row.reserved_quantity_delta,
        ),
      reservedQuantityBefore:
        Number(
          row.reserved_quantity_before,
        ),
      reservedQuantityAfter:
        Number(
          row.reserved_quantity_after,
        ),
      unitCost:
        Number(
          row.unit_cost,
        ),
      totalCost:
        Number(
          row.total_cost,
        ),
      averageUnitCostBefore:
        Number(
          row.average_unit_cost_before,
        ),
      averageUnitCostAfter:
        Number(
          row.average_unit_cost_after,
        ),
      sourceType:
        row.source_type,
      sourceId:
        row.source_id ??
        undefined,
      sourceLineId:
        row.source_line_id ??
        undefined,
      referenceNumber:
        row.reference_number ??
        undefined,
      idempotencyKey:
        row.idempotency_key ??
        undefined,
      correlationId:
        row.correlation_id ??
        undefined,
      movementDate:
        row.movement_date,
      postedByPersonId:
        row.posted_by_person_id ??
        undefined,
      remarks:
        row.remarks ??
        undefined,
      metadata:
        row.metadata ?? {},
      createdAt:
        row.created_at,
    };
  }

  private mapBatchBalance(
    row: any,
  ): InventoryBatchBalance {
    const quantityOnHand =
      Number(
        row.quantity_on_hand,
      );

    const reservedQuantity =
      Number(
        row.reserved_quantity,
      );

    return {
      id:
        row.id,

      batchId:
        row.batch_id,

      itemId:
        row.item_id,

      storeId:
        row.store_id,

      binLocationId:
        row.bin_location_id ??
        undefined,

      quantityOnHand,

      reservedQuantity,

      availableQuantity:
        quantityOnHand -
        reservedQuantity,

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

  private mapBalance(
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

  private mapReservation(
    row: any,
  ): InventoryStockReservation {
    return {
      id:
        row.id,

      reservationNumber:
        row.reservation_number,

      itemId:
        row.item_id,

      storeId:
        row.store_id,

      binLocationId:
        row.bin_location_id ??
        undefined,

      batchId:
        row.batch_id ??
        undefined,

      quantity:
        Number(
          row.quantity,
        ),

      fulfilledQuantity:
        Number(
          row.fulfilled_quantity,
        ),

      releasedQuantity:
        Number(
          row.released_quantity,
        ),

      status:
        row.status as
          InventoryReservationStatus,

      sourceType:
        row.source_type,

      sourceId:
        row.source_id ??
        undefined,

      referenceNumber:
        row.reference_number ??
        undefined,

      reservedForPersonId:
        row.reserved_for_person_id ??
        undefined,

      createdByPersonId:
        row.created_by_person_id ??
        undefined,

      releasedByPersonId:
        row.released_by_person_id ??
        undefined,

      fulfilledByPersonId:
        row.fulfilled_by_person_id ??
        undefined,

      expiresAt:
        row.expires_at ??
        undefined,

      releasedAt:
        row.released_at ??
        undefined,

      fulfilledAt:
        row.fulfilled_at ??
        undefined,

      remarks:
        row.remarks ??
        undefined,

      metadata:
        row.metadata ?? {},

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  private mapCycleCount(
    row: any,
  ): InventoryCycleCount {
    return {
      id:
        row.id,

      countNumber:
        row.count_number,

      propertyId:
        row.property_id,

      storeId:
        row.store_id,

      status:
        row.status as
          InventoryCycleCountStatus,

      countDate:
        row.count_date,

      blindCount:
        row.blind_count,

      freezeStock:
        row.freeze_stock,

      scopeType:
        row.scope_type,

      notes:
        row.notes ??
        undefined,

      createdByPersonId:
        row.created_by_person_id,

      startedByPersonId:
        row.started_by_person_id ??
        undefined,

      completedByPersonId:
        row.completed_by_person_id ??
        undefined,

      postedByPersonId:
        row.posted_by_person_id ??
        undefined,

      cancelledByPersonId:
        row.cancelled_by_person_id ??
        undefined,

      startedAt:
        row.started_at ??
        undefined,

      completedAt:
        row.completed_at ??
        undefined,

      postedAt:
        row.posted_at ??
        undefined,

      cancelledAt:
        row.cancelled_at ??
        undefined,

      cancellationReason:
        row.cancellation_reason ??
        undefined,

      metadata:
        row.metadata ?? {},

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  private mapCycleCountItem(
    row: any,
  ): InventoryCycleCountItem {
    return {
      id:
        row.id,

      cycleCountId:
        row.cycle_count_id,

      itemId:
        row.item_id,

      binLocationId:
        row.bin_location_id ??
        undefined,

      systemQuantity:
        Number(
          row.system_quantity,
        ),

      countedQuantity:
        row.counted_quantity ===
          null ||
        row.counted_quantity ===
          undefined
          ? undefined
          : Number(
              row.counted_quantity,
            ),

      varianceQuantity:
        row.variance_quantity ===
          null ||
        row.variance_quantity ===
          undefined
          ? undefined
          : Number(
              row.variance_quantity,
            ),

      averageUnitCost:
        Number(
          row.average_unit_cost,
        ),

      varianceValue:
        row.variance_value ===
          null ||
        row.variance_value ===
          undefined
          ? undefined
          : Number(
              row.variance_value,
            ),

      countedByPersonId:
        row.counted_by_person_id ??
        undefined,

      countedAt:
        row.counted_at ??
        undefined,

      remarks:
        row.remarks ??
        undefined,

      metadata:
        row.metadata ?? {},

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  private mapMaterialReturn(
    row: any,
  ): InventoryMaterialReturn {
    return {
      id:
        row.id,

      returnNumber:
        row.return_number,

      propertyId:
        row.property_id,

      storeId:
        row.store_id,

      materialIssueId:
        row.material_issue_id ??
        undefined,

      status:
        row.status as
          InventoryMaterialReturnStatus,

      returnDate:
        row.return_date,

      reasonCode:
        row.reason_code,

      reasonDescription:
        row.reason_description ??
        undefined,

      returnedByPersonId:
        row.returned_by_person_id ??
        undefined,

      createdByPersonId:
        row.created_by_person_id,

      postedByPersonId:
        row.posted_by_person_id ??
        undefined,

      cancelledByPersonId:
        row.cancelled_by_person_id ??
        undefined,

      postedAt:
        row.posted_at ??
        undefined,

      cancelledAt:
        row.cancelled_at ??
        undefined,

      cancellationReason:
        row.cancellation_reason ??
        undefined,

      remarks:
        row.remarks ??
        undefined,

      metadata:
        row.metadata ?? {},

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  private mapMaterialReturnItem(
    row: any,
  ): InventoryMaterialReturnItem {
    return {
      id:
        row.id,

      materialReturnId:
        row.material_return_id,

      itemId:
        row.item_id,

      binLocationId:
        row.bin_location_id ??
        undefined,

      batchId:
        row.batch_id ??
        undefined,

      quantity:
        Number(
          row.quantity,
        ),

      unitCost:
        Number(
          row.unit_cost,
        ),

      remarks:
        row.remarks ??
        undefined,

      metadata:
        row.metadata ?? {},

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  private mapMaterialIssue(
    row: any,
  ): InventoryMaterialIssue {
    return {
      id:
        row.id,

      issueNumber:
        row.issue_number,

      propertyId:
        row.property_id,

      storeId:
        row.store_id,

      status:
        row.status as
          InventoryMaterialIssueStatus,

      issueDate:
        row.issue_date,

      reasonCode:
        row.reason_code,

      reasonDescription:
        row.reason_description ??
        undefined,

      requestedByPersonId:
        row.requested_by_person_id ??
        undefined,

      createdByPersonId:
        row.created_by_person_id,

      postedByPersonId:
        row.posted_by_person_id ??
        undefined,

      cancelledByPersonId:
        row.cancelled_by_person_id ??
        undefined,

      postedAt:
        row.posted_at ??
        undefined,

      cancelledAt:
        row.cancelled_at ??
        undefined,

      cancellationReason:
        row.cancellation_reason ??
        undefined,

      remarks:
        row.remarks ??
        undefined,

      metadata:
        row.metadata ?? {},

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  private mapMaterialIssueItem(
    row: any,
  ): InventoryMaterialIssueItem {
    return {
      id:
        row.id,

      materialIssueId:
        row.material_issue_id,

      itemId:
        row.item_id,

      binLocationId:
        row.bin_location_id ??
        undefined,

      batchId:
        row.batch_id ??
        undefined,

      quantity:
        Number(
          row.quantity,
        ),

      unitCost:
        Number(
          row.unit_cost,
        ),

      remarks:
        row.remarks ??
        undefined,

      metadata:
        row.metadata ?? {},

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  private mapAdjustment(
    row: any,
  ): InventoryStockAdjustment {
    return {
      id: row.id,
      adjustmentNumber:
        row.adjustment_number,
      propertyId:
        row.property_id,
      storeId:
        row.store_id,
      status:
        row.status as
          InventoryAdjustmentStatus,
      adjustmentDate:
        row.adjustment_date,
      reasonCode:
        row.reason_code,
      reasonDescription:
        row.reason_description ??
        undefined,
      createdByPersonId:
        row.created_by_person_id,
      postedByPersonId:
        row.posted_by_person_id ??
        undefined,
      cancelledByPersonId:
        row.cancelled_by_person_id ??
        undefined,
      postedAt:
        row.posted_at ??
        undefined,
      cancelledAt:
        row.cancelled_at ??
        undefined,
      cancellationReason:
        row.cancellation_reason ??
        undefined,
      remarks:
        row.remarks ??
        undefined,
      metadata:
        row.metadata ?? {},
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapAdjustmentItem(
    row: any,
  ): InventoryStockAdjustmentItem {
    return {
      id: row.id,
      adjustmentId:
        row.adjustment_id,
      itemId:
        row.item_id,
      binLocationId:
        row.bin_location_id ??
        undefined,
      quantityDelta:
        Number(
          row.quantity_delta,
        ),
      unitCost:
        Number(
          row.unit_cost,
        ),
      remarks:
        row.remarks ??
        undefined,
      createdAt:
        row.created_at,
    };
  }

  private mapTransfer(
    row: any,
  ): InventoryStockTransfer {
    return {
      id: row.id,
      transferNumber:
        row.transfer_number,
      propertyId:
        row.property_id,
      sourceStoreId:
        row.source_store_id,
      destinationStoreId:
        row.destination_store_id,
      status:
        row.status as
          InventoryTransferStatus,
      transferDate:
        row.transfer_date,
      createdByPersonId:
        row.created_by_person_id,
      dispatchedByPersonId:
        row.dispatched_by_person_id ??
        undefined,
      receivedByPersonId:
        row.received_by_person_id ??
        undefined,
      cancelledByPersonId:
        row.cancelled_by_person_id ??
        undefined,
      dispatchedAt:
        row.dispatched_at ??
        undefined,
      receivedAt:
        row.received_at ??
        undefined,
      cancelledAt:
        row.cancelled_at ??
        undefined,
      cancellationReason:
        row.cancellation_reason ??
        undefined,
      remarks:
        row.remarks ??
        undefined,
      metadata:
        row.metadata ?? {},
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }

  private mapTransferItem(
    row: any,
  ): InventoryStockTransferItem {
    return {
      id: row.id,
      transferId:
        row.transfer_id,
      itemId:
        row.item_id,
      sourceBinLocationId:
        row.source_bin_location_id ??
        undefined,
      destinationBinLocationId:
        row.destination_bin_location_id ??
        undefined,
      quantity:
        Number(row.quantity),
      dispatchedQuantity:
        Number(
          row.dispatched_quantity,
        ),
      receivedQuantity:
        Number(
          row.received_quantity,
        ),
      unitCost:
        Number(
          row.unit_cost,
        ),
      remarks:
        row.remarks ??
        undefined,
      createdAt:
        row.created_at,
      updatedAt:
        row.updated_at,
    };
  }
}
