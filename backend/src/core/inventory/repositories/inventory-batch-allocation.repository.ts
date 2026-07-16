import {
  InventoryBatchAllocationStrategy,
  InventoryBatchAvailability,
} from '../types/inventory.types';

export const
  INVENTORY_BATCH_ALLOCATION_REPOSITORY =
    Symbol(
      'INVENTORY_BATCH_ALLOCATION_REPOSITORY',
    );

export interface FindAvailableInventoryBatchesInput {
  itemId: string;
  storeId: string;
  binLocationId?: string;

  strategy:
    InventoryBatchAllocationStrategy;

  manualBatchIds?: string[];

  asOf: Date;
}

export interface InventoryBatchAllocationRepository {
  findAvailableBatches(
    input:
      FindAvailableInventoryBatchesInput,
  ): Promise<
    InventoryBatchAvailability[]
  >;
}
