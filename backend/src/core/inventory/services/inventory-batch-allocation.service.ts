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

  strict?: boolean;
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

    const store =
      await this.inventoryRepository
        .findStoreById(
          input.storeId,
        );

    if (!store) {
      throw new NotFoundException(
        'Inventory store was not found',
      );
    }

    if (!store.isActive) {
      throw new BadRequestException(
        'Inventory Batch allocation cannot be performed for an inactive Inventory store',
      );
    }

    if (input.binLocationId) {
      const bin =
        await this.inventoryRepository
          .findBinLocationById(
            input.binLocationId,
          );

      if (!bin) {
        throw new NotFoundException(
          'Inventory bin location was not found',
        );
      }

      if (!bin.isActive) {
        throw new BadRequestException(
          'Inventory Batch allocation cannot use an inactive Inventory bin location',
        );
      }

      if (
        bin.storeId !==
        store.id
      ) {
        throw new BadRequestException(
          'Inventory bin location does not belong to the selected store',
        );
      }
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

    const result:
      InventoryBatchAllocationResult = {
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

    if (
      input.strict === true &&
      !result.fullyAllocated
    ) {
      throw new BadRequestException(
        `Inventory Batch allocation could not satisfy the requested quantity; shortage: ${result.shortageQuantity}`,
      );
    }

    return result;
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
