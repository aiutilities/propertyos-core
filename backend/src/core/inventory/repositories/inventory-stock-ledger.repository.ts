import {
  InventoryStockAdjustment,
  InventoryStockAdjustmentItem,
  InventoryStockLedgerEntry,
  InventoryStockLedgerFilters,
  InventoryStockReservation,
  InventoryStockTransfer,
  InventoryStockTransferItem,
} from '../types/inventory.types';

export const INVENTORY_STOCK_LEDGER_REPOSITORY =
  Symbol(
    'INVENTORY_STOCK_LEDGER_REPOSITORY',
  );

export interface InventoryStockLedgerRepository {
  findLedgerEntryById(
    id: string,
  ): Promise<
    InventoryStockLedgerEntry | null
  >;

  findLedgerEntryByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<
    InventoryStockLedgerEntry | null
  >;

  listStockLedger(
    filters?: InventoryStockLedgerFilters,
  ): Promise<
    InventoryStockLedgerEntry[]
  >;

  findReservationById(
    id: string,
  ): Promise<
    InventoryStockReservation | null
  >;

  listReservations(
    filters?: {
      itemId?: string;
      storeId?: string;
      binLocationId?: string;
      sourceType?: string;
      sourceId?: string;
      status?: string;
    },
  ): Promise<
    InventoryStockReservation[]
  >;

  findAdjustmentById(
    id: string,
  ): Promise<{
    adjustment:
      InventoryStockAdjustment;

    items:
      InventoryStockAdjustmentItem[];
  } | null>;

  findTransferById(
    id: string,
  ): Promise<{
    transfer:
      InventoryStockTransfer;

    items:
      InventoryStockTransferItem[];
  } | null>;
}
