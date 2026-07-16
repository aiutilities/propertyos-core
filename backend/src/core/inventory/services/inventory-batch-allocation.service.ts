import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  INVENTORY_BATCH_ALLOCATION_REPOSITORY,
  InventoryBatchAllocationRepository,
} from '../repositories/inventory-batch-allocation.repository';

import {
  INVENTORY_REPOSITORY,
  InventoryRepository,
} from '../repositories/inventory.repository';

import {
  InventoryBatchAllocationResult,
  InventoryBatchAllocationStrategy,
} from '../types/inventory.types';

export interface AllocateInventoryBatchesInput {
  itemId: string;
  storeId: string;
  binLocationId?: string;

  quantity: number;

  strategy:
    InventoryBatchAllocationStrategy;

  manualBatchIds?: string[];

  asOf?: Date;
}

@Injectable()
export class InventoryBatchAllocationService {
  constructor(
    @Inject(
      INVENTORY_BATCH_ALLOCATION_REPOSITORY,
    )
    private readonly allocationRepository:
      InventoryBatchAllocationRepository,

    @Inject(
      INVENTORY_REPOSITORY,
    )
    private readonly inventoryRepository:
      InventoryRepository,
  ) {}

  async allocate(
    input:
      AllocateInventoryBatchesInput,
  ): Promise<
    InventoryBatchAllocationResult
  > {
    const requestedQuantity =
      this.requirePositiveQuantity(
        input.quantity,
      );

    const strategy =
      this.requireStrategy(
        input.strategy,
      );

    const item =
      await this.inventoryRepository
        .findItemById(
          input.itemId,
        );

    if (!item) {
      throw new NotFoundException(
        'Inventory item was not found',
      );
    }

    if (!item.isActive) {
      throw new BadRequestException(
        'Inventory Batch allocation cannot be performed for an inactive Inventory item',
      );
    }

    if (!item.isBatchTracked) {
      throw new BadRequestException(
        'Inventory Batch allocation cannot be used for an item that is not batch tracked',
      );
    }

    const manualBatchIds =
      this.normalizeManualBatchIds(
        strategy,
        input.manualBatchIds,
      );

    const availability =
      await this.allocationRepository
        .findAvailableBatches({
          itemId:
            input.itemId,

          storeId:
            input.storeId,

          binLocationId:
            input.binLocationId,

          strategy,

          manualBatchIds,

          asOf:
            this.normalizeAsOf(
              input.asOf,
            ),
        });

    let remaining =
      requestedQuantity;

    const allocations = [];

    for (
      const batch
      of availability
    ) {
      if (remaining <= 0) {
        break;
      }

      const available =
        this.roundQuantity(
          Math.max(
            0,
            batch.availableQuantity,
          ),
        );

      if (available <= 0) {
        continue;
      }

      const allocatedQuantity =
        this.roundQuantity(
          Math.min(
            remaining,
            available,
          ),
        );

      if (allocatedQuantity <= 0) {
        continue;
      }

      allocations.push({
        batchId:
          batch.batchId,

        batchNumber:
          batch.batchNumber,

        binLocationId:
          batch.binLocationId,

        manufactureDate:
          batch.manufactureDate,

        expiryDate:
          batch.expiryDate,

        availableQuantity:
          available,

        allocatedQuantity,

        averageUnitCost:
          batch.averageUnitCost,
      });

      remaining =
        this.roundQuantity(
          remaining -
          allocatedQuantity,
        );
    }

    const allocatedQuantity =
      this.roundQuantity(
        requestedQuantity -
        remaining,
      );

    const shortageQuantity =
      this.roundQuantity(
        Math.max(
          0,
          remaining,
        ),
      );

    return {
      itemId:
        input.itemId,

      storeId:
        input.storeId,

      binLocationId:
        input.binLocationId,

      strategy,

      requestedQuantity,

      allocatedQuantity,

      shortageQuantity,

      fullyAllocated:
        shortageQuantity === 0,

      allocations,
    };
  }

  private requirePositiveQuantity(
    value: number,
  ): number {
    const quantity =
      Number(value);

    if (
      !Number.isFinite(
        quantity,
      ) ||
      quantity <= 0
    ) {
      throw new BadRequestException(
        'Allocation quantity must be greater than zero',
      );
    }

    return this.roundQuantity(
      quantity,
    );
  }

  private requireStrategy(
    value:
      InventoryBatchAllocationStrategy,
  ): InventoryBatchAllocationStrategy {
    if (
      !Object.values(
        InventoryBatchAllocationStrategy,
      ).includes(value)
    ) {
      throw new BadRequestException(
        `Invalid Inventory Batch allocation strategy: ${String(value)}`,
      );
    }

    return value;
  }

  private normalizeManualBatchIds(
    strategy:
      InventoryBatchAllocationStrategy,

    values?: string[],
  ): string[] | undefined {
    if (
      strategy !==
      InventoryBatchAllocationStrategy
        .MANUAL
    ) {
      return undefined;
    }

    const normalized =
      Array.from(
        new Set(
          (
            values ?? []
          )
            .map(
              (value) =>
                value.trim(),
            )
            .filter(Boolean),
        ),
      );

    if (normalized.length === 0) {
      throw new BadRequestException(
        'manualBatchIds are required for MANUAL Batch allocation',
      );
    }

    return normalized;
  }

  private normalizeAsOf(
    value?: Date,
  ): Date {
    const date =
      value
        ? new Date(value)
        : new Date();

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      throw new BadRequestException(
        'Invalid Batch allocation asOf date',
      );
    }

    return date;
  }

  private roundQuantity(
    value: number,
  ): number {
    return Number(
      Number(value)
        .toFixed(6),
    );
  }
}
