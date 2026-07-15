export enum InventoryItemType {
  GOODS = 'GOODS',
  CONSUMABLE = 'CONSUMABLE',
  SPARE = 'SPARE',
  TOOL = 'TOOL',
}

export interface InventoryUnitOfMeasure {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItemCategory {
  id: string;
  parentCategoryId?: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryBrand {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId: string;
  unitOfMeasureId: string;
  brandId?: string;
  itemType: InventoryItemType;
  barcode?: string;
  manufacturerPartNumber?: string;
  minimumStockLevel: number;
  reorderLevel: number;
  reorderQuantity: number;
  standardCost: number;
  currency: string;
  isSerialized: boolean;
  isBatchTracked: boolean;
  isActive: boolean;
  createdByPersonId?: string;
  updatedByPersonId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStore {
  id: string;
  storeCode: string;
  name: string;
  description?: string;
  propertyId: string;
  zoneId?: string;
  spaceId?: string;
  managerPersonId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryBinLocation {
  id: string;
  storeId: string;
  parentBinId?: string;
  binCode: string;
  name: string;
  description?: string;
  barcode?: string;
  isReceivingBin: boolean;
  isDispatchBin: boolean;
  isQuarantineBin: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStockBalance {
  id: string;
  itemId: string;
  storeId: string;
  binLocationId?: string;
  quantityOnHand: number;
  reservedQuantity: number;
  availableQuantity: number;
  averageUnitCost: number;
  lastMovementAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryItemFilters {
  categoryId?: string;
  unitOfMeasureId?: string;
  brandId?: string;
  itemType?: InventoryItemType;
  isActive?: boolean;
  search?: string;
}

export interface InventoryStoreFilters {
  propertyId?: string;
  zoneId?: string;
  spaceId?: string;
  isActive?: boolean;
  search?: string;
}

export interface InventoryStockBalanceFilters {
  itemId?: string;
  storeId?: string;
  binLocationId?: string;
  propertyId?: string;
  belowReorderLevel?: boolean;
}

export enum InventoryStockMovementType {
  OPENING = 'OPENING',
  RECEIPT = 'RECEIPT',
  ISSUE = 'ISSUE',
  TRANSFER_OUT = 'TRANSFER_OUT',
  TRANSFER_IN = 'TRANSFER_IN',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
  RESERVATION = 'RESERVATION',
  RESERVATION_RELEASE = 'RESERVATION_RELEASE',
  REVERSAL = 'REVERSAL',
}

export enum InventoryReservationStatus {
  ACTIVE = 'ACTIVE',
  PARTIALLY_FULFILLED = 'PARTIALLY_FULFILLED',
  FULFILLED = 'FULFILLED',
  RELEASED = 'RELEASED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum InventoryAdjustmentStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED',
}

export enum InventoryTransferStatus {
  DRAFT = 'DRAFT',
  DISPATCHED = 'DISPATCHED',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export interface InventoryStockLedgerEntry {
  id: string;
  movementNumber: string;
  movementType:
    InventoryStockMovementType;
  itemId: string;
  storeId: string;
  binLocationId?: string;
  quantityDelta: number;
  quantityBefore: number;
  quantityAfter: number;
  reservedQuantityDelta: number;
  reservedQuantityBefore: number;
  reservedQuantityAfter: number;
  unitCost: number;
  totalCost: number;
  averageUnitCostBefore: number;
  averageUnitCostAfter: number;
  sourceType: string;
  sourceId?: string;
  sourceLineId?: string;
  referenceNumber?: string;
  idempotencyKey?: string;
  correlationId?: string;
  movementDate: Date;
  postedByPersonId?: string;
  remarks?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

export interface InventoryStockReservation {
  id: string;
  reservationNumber: string;
  itemId: string;
  storeId: string;
  binLocationId?: string;
  quantity: number;
  fulfilledQuantity: number;
  releasedQuantity: number;
  status:
    InventoryReservationStatus;
  sourceType: string;
  sourceId?: string;
  referenceNumber?: string;
  reservedForPersonId?: string;
  createdByPersonId?: string;
  releasedByPersonId?: string;
  fulfilledByPersonId?: string;
  expiresAt?: Date;
  releasedAt?: Date;
  fulfilledAt?: Date;
  remarks?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStockAdjustment {
  id: string;
  adjustmentNumber: string;
  propertyId: string;
  storeId: string;
  status:
    InventoryAdjustmentStatus;
  adjustmentDate: Date;
  reasonCode: string;
  reasonDescription?: string;
  createdByPersonId: string;
  postedByPersonId?: string;
  cancelledByPersonId?: string;
  postedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  remarks?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStockAdjustmentItem {
  id: string;
  adjustmentId: string;
  itemId: string;
  binLocationId?: string;
  quantityDelta: number;
  unitCost: number;
  remarks?: string;
  createdAt: Date;
}

export interface InventoryStockTransfer {
  id: string;
  transferNumber: string;
  propertyId: string;
  sourceStoreId: string;
  destinationStoreId: string;
  status:
    InventoryTransferStatus;
  transferDate: Date;
  createdByPersonId: string;
  dispatchedByPersonId?: string;
  receivedByPersonId?: string;
  cancelledByPersonId?: string;
  dispatchedAt?: Date;
  receivedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  remarks?: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStockTransferItem {
  id: string;
  transferId: string;
  itemId: string;
  sourceBinLocationId?: string;
  destinationBinLocationId?: string;
  quantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryStockLedgerFilters {
  itemId?: string;
  storeId?: string;
  binLocationId?: string;
  movementType?:
    InventoryStockMovementType;
  sourceType?: string;
  sourceId?: string;
  correlationId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}
