import {
  InventoryAdjustmentStatus,
  InventoryCycleCount,
  InventoryCycleCountItem,
  InventoryCycleCountStatus,
  InventoryStockAdjustment,
  InventoryStockAdjustmentItem,
  InventoryStockBalance,
  InventoryBatchBalance,
  InventoryStockLedgerEntry,
  InventoryStockLedgerFilters,
  InventoryStockMovementType,
  InventoryReservationStatus,
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
  batchId?: string;

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

  batchBalance?:
    InventoryBatchBalance;

  idempotentReplay: boolean;
}

export interface InventoryStockLedgerTransaction {
  acquireLock(
    key: string,
  ): Promise<void>;

  lockMaterialIssueById(
    id: string,
  ): Promise<{
    materialIssue:
      InventoryMaterialIssue;

    items:
      InventoryMaterialIssueItem[];
  } | null>;

  lockMaterialReturnById(
    id: string,
  ): Promise<{
    materialReturn:
      InventoryMaterialReturn;

    items:
      InventoryMaterialReturnItem[];
  } | null>;

  getPostedMaterialReturnQuantity(
    materialIssueId: string,
    itemId: string,
    binLocationId?: string,
    batchId?: string,
  ): Promise<number>;

  postMovement(
    input:
      PostInventoryMovementInput,
  ): Promise<
    PostInventoryMovementResult
  >;

  updateMaterialIssueStatus(
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
  >;

  updateMaterialReturnStatus(
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
  >;
}

export interface InventoryStockLedgerRepository {
  withTransaction<T>(
    work: (
      transaction:
        InventoryStockLedgerTransaction,
    ) => Promise<T>,
  ): Promise<T>;

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


  createReservation(
    reservation:
      InventoryStockReservation,
  ): Promise<
    InventoryStockReservation
  >;

  updateReservation(
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
  >;

  listExpiredReservations(
    asOf: Date,
  ): Promise<
    InventoryStockReservation[]
  >;

  createCycleCount(
    cycleCount:
      InventoryCycleCount,

    items:
      InventoryCycleCountItem[],
  ): Promise<{
    cycleCount:
      InventoryCycleCount;

    items:
      InventoryCycleCountItem[];
  }>;

  findCycleCountById(
    id: string,
  ): Promise<{
    cycleCount:
      InventoryCycleCount;

    items:
      InventoryCycleCountItem[];
  } | null>;

  listCycleCounts(
    filters?: {
      propertyId?: string;
      storeId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<
    InventoryCycleCount[]
  >;

  updateCycleCountStatus(
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
  >;

  updateCycleCountItem(
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
  >;

  createMaterialReturn(
    materialReturn:
      InventoryMaterialReturn,

    items:
      InventoryMaterialReturnItem[],
  ): Promise<{
    materialReturn:
      InventoryMaterialReturn;

    items:
      InventoryMaterialReturnItem[];
  }>;

  findMaterialReturnById(
    id: string,
  ): Promise<{
    materialReturn:
      InventoryMaterialReturn;

    items:
      InventoryMaterialReturnItem[];
  } | null>;

  listMaterialReturns(
    filters?: {
      propertyId?: string;
      storeId?: string;
      materialIssueId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<
    InventoryMaterialReturn[]
  >;

  getPostedMaterialReturnQuantity(
    materialIssueId: string,
    itemId: string,
    binLocationId?: string,
    batchId?: string,
  ): Promise<number>;

  updateMaterialReturnStatus(
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
  >;

  createMaterialIssue(
    materialIssue:
      InventoryMaterialIssue,

    items:
      InventoryMaterialIssueItem[],
  ): Promise<{
    materialIssue:
      InventoryMaterialIssue;

    items:
      InventoryMaterialIssueItem[];
  }>;

  findMaterialIssueById(
    id: string,
  ): Promise<{
    materialIssue:
      InventoryMaterialIssue;

    items:
      InventoryMaterialIssueItem[];
  } | null>;

  listMaterialIssues(
    filters?: {
      propertyId?: string;
      storeId?: string;
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<
    InventoryMaterialIssue[]
  >;

  updateMaterialIssueStatus(
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
