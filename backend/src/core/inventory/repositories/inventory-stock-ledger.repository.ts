import {
  InventoryStockAdjustment,
  InventoryStockAdjustmentItem,
  InventoryStockBalance,
  InventoryStockLedgerEntry,
  InventoryStockLedgerFilters,
  InventoryStockMovementType,
  InventoryStockReservation,
  InventoryStockTransfer,
  InventoryStockTransferItem,
} from '../types/inventory.types';

export const INVENTORY_STOCK_LEDGER_REPOSITORY =
  Symbol(
    'INVENTORY_STOCK_LEDGER_REPOSITORY',
  );

export interface PostInventoryMovementInput {
  movementType:
    InventoryStockMovementType;

  itemId: string;
  storeId: string;
  binLocationId?: string;

  quantityDelta: number;
  reservedQuantityDelta?: number;

  unitCost?: number;

  sourceType: string;
  sourceId?: string;
  sourceLineId?: string;

  referenceNumber?: string;
  idempotencyKey?: string;
  correlationId?: string;

  movementDate?: Date;
  postedByPersonId?: string;

  remarks?: string;

  metadata?: Record<
    string,
    unknown
  >;
}

export interface PostInventoryMovementResult {
  entry:
    InventoryStockLedgerEntry;

  balance:
    InventoryStockBalance;

  idempotentReplay: boolean;
}

export interface InventoryStockLedgerRepository {
  postMovement(
    input:
      PostInventoryMovementInput,
  ): Promise<
    PostInventoryMovementResult
  >;

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
