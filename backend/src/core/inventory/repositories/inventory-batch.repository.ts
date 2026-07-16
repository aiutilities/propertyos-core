import {
  InventoryBatch,
} from '../types/inventory.types';

export const INVENTORY_BATCH_REPOSITORY =
  Symbol(
    'INVENTORY_BATCH_REPOSITORY',
  );

export interface InventoryBatchRepository {
  findById(
    id: string,
  ): Promise<
    InventoryBatch | null
  >;

  findByItemAndBatchNumber(
    itemId: string,
    batchNumber: string,
  ): Promise<
    InventoryBatch | null
  >;

  findByIds(
    ids: string[],
  ): Promise<
    InventoryBatch[]
  >;

  create(
    batch: InventoryBatch,
  ): Promise<InventoryBatch>;
}
