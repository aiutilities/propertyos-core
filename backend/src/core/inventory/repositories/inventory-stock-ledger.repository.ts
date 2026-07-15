import {
  InventoryAdjustmentStatus,
  InventoryStockAdjustment,
  InventoryStockAdjustmentItem,
  InventoryStockBalance,
  InventoryStockLedgerEntry,
  InventoryStockLedgerFilters,
  InventoryStockMovementType,
  InventoryStockReservation,
  InventoryStockTransfer,
  InventoryStockTransferItem,
  InventoryTransferStatus,
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


  createAdjustment(
    adjustment:
      InventoryStockAdjustment,

    items:
      InventoryStockAdjustmentItem[],
  ): Promise<{
    adjustment:
      InventoryStockAdjustment;

    items:
      InventoryStockAdjustmentItem[];
  }>;

  listAdjustments(
    filters?: {
      propertyId?: string;
      storeId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<
    InventoryStockAdjustment[]
  >;

  updateAdjustmentStatus(
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
  >;

  findTransferById(
    id: string,
  ): Promise<{
    transfer:
      InventoryStockTransfer;

    items:
      InventoryStockTransferItem[];
  } | null>;


  createTransfer(
    transfer:
      InventoryStockTransfer,

    items:
      InventoryStockTransferItem[],
  ): Promise<{
    transfer:
      InventoryStockTransfer;

    items:
      InventoryStockTransferItem[];
  }>;

  listTransfers(
    filters?: {
      propertyId?: string;
      sourceStoreId?: string;
      destinationStoreId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<
    InventoryStockTransfer[]
  >;

  updateTransferStatus(
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
  >;

  updateTransferItemQuantities(
    transferItemId: string,

    input: {
      dispatchedQuantity: number;
      receivedQuantity: number;
      updatedAt: Date;
    },
  ): Promise<
    InventoryStockTransferItem | null
  >;
}
