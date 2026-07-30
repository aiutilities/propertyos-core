export type InventoryItemType =
  | "GOODS"
  | "CONSUMABLE"
  | "SPARE"
  | "TOOL";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface InventoryUnitOfMeasure {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItemCategory {
  id: string;
  parentCategoryId?: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryBrand {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
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
  createdAt: string;
  updatedAt: string;
}

export interface InventoryStoreFilters {
  propertyId?: string;
  zoneId?: string;
  spaceId?: string;
  isActive?: boolean;
  search?: string;
}

export interface CreateInventoryStoreInput {
  storeCode: string;
  name: string;
  description?: string;
  propertyId: string;
  zoneId?: string;
  spaceId?: string;
  managerPersonId?: string;
  createdByPersonId: string;
}

export interface UpdateInventoryStoreInput {
  name?: string;
  description?: string;
  zoneId?: string;
  spaceId?: string;
  managerPersonId?: string;
  updatedByPersonId: string;
  remarks?: string;
}

export interface TransitionInventoryStoreInput {
  changedByPersonId: string;
  remarks?: string;
}

export interface CreateInventoryBinInput {
  storeId: string;
  parentBinId?: string;
  binCode: string;
  name: string;
  description?: string;
  barcode?: string;
  isReceivingBin?: boolean;
  isDispatchBin?: boolean;
  isQuarantineBin?: boolean;
  createdByPersonId: string;
}

export interface UpdateInventoryBinInput {
  parentBinId?: string;
  name?: string;
  description?: string;
  barcode?: string;
  isReceivingBin?: boolean;
  isDispatchBin?: boolean;
  isQuarantineBin?: boolean;
  isActive?: boolean;
  updatedByPersonId: string;
  remarks?: string;
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
  lastMovementAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInventoryUnitInput {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  createdByPersonId: string;
}

export interface UpdateInventoryUnitInput {
  name?: string;
  symbol?: string;
  decimalPlaces?: number;
  isActive?: boolean;
  updatedByPersonId: string;
  remarks?: string;
}

export interface CreateInventoryCategoryInput {
  parentCategoryId?: string;
  code: string;
  name: string;
  description?: string;
  createdByPersonId: string;
}

export interface UpdateInventoryCategoryInput {
  parentCategoryId?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  updatedByPersonId: string;
  remarks?: string;
}

export interface CreateInventoryBrandInput {
  code: string;
  name: string;
  description?: string;
  createdByPersonId: string;
}

export interface UpdateInventoryBrandInput {
  name?: string;
  description?: string;
  isActive?: boolean;
  updatedByPersonId: string;
  remarks?: string;
}

export interface InventoryItemFilters {
  categoryId?: string;
  unitOfMeasureId?: string;
  brandId?: string;
  itemType?: InventoryItemType | "";
  isActive?: boolean;
  search?: string;
}

export interface CreateInventoryItemInput {
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
  createdByPersonId: string;
}

export interface UpdateInventoryItemInput {
  name?: string;
  description?: string;
  categoryId?: string;
  unitOfMeasureId?: string;
  brandId?: string;
  itemType?: InventoryItemType;
  barcode?: string;
  manufacturerPartNumber?: string;
  minimumStockLevel?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  standardCost?: number;
  currency?: string;
  isSerialized?: boolean;
  isBatchTracked?: boolean;
  updatedByPersonId: string;
  remarks?: string;
}

export interface TransitionInventoryItemInput {
  changedByPersonId: string;
  remarks?: string;
}

export type InventoryAdjustmentStatus =
  | "DRAFT"
  | "POSTED"
  | "CANCELLED"
  | "CANCELED"
  | string;

export interface InventoryStockAdjustmentItem {
  id: string;
  adjustmentId?: string;
  itemId: string;
  binLocationId?: string;
  quantityDelta: number;
  unitCost?: number;
  totalCost?: number;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryStockAdjustment {
  id: string;
  adjustmentNumber?: string;
  propertyId?: string;
  storeId?: string;
  status: InventoryAdjustmentStatus;
  reasonCode?: string;
  reasonDescription?: string;
  referenceNumber?: string;
  remarks?: string;
  createdByPersonId?: string;
  postedByPersonId?: string;
  cancelledByPersonId?: string;
  createdAt: string;
  updatedAt: string;
  postedAt?: string;
  cancelledAt?: string;
  items?: InventoryStockAdjustmentItem[];
}

export type InventoryReservationStatus =
  | "ACTIVE"
  | "PARTIALLY_FULFILLED"
  | "FULFILLED"
  | "RELEASED"
  | "EXPIRED"
  | "CANCELLED"
  | string;

export interface InventoryStockReservation {
  id: string;
  reservationNumber?: string;
  propertyId?: string;
  storeId: string;
  binLocationId?: string;
  itemId: string;
  quantity: number;
  fulfilledQuantity: number;
  releasedQuantity: number;
  availableQuantity?: number;
  status: InventoryReservationStatus;
  sourceType?: string;
  sourceId?: string;
  referenceNumber?: string;
  expiresAt?: string;
  remarks?: string;
  createdByPersonId?: string;
  fulfilledByPersonId?: string;
  releasedByPersonId?: string;
  expiredByPersonId?: string;
  createdAt: string;
  updatedAt: string;
  fulfilledAt?: string;
  releasedAt?: string;
  expiredAt?: string;
}

export type InventoryTransferStatus =
  | "DRAFT"
  | "DISPATCHED"
  | "RECEIVED"
  | "CANCELLED"
  | string;

export interface InventoryStockTransferItem {
  id: string;
  transferId?: string;
  itemId: string;
  sourceBinLocationId?: string;
  destinationBinLocationId?: string;
  quantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryStockTransfer {
  id: string;
  transferNumber: string;
  propertyId: string;
  sourceStoreId: string;
  destinationStoreId: string;
  status: InventoryTransferStatus;
  transferDate: string;
  createdByPersonId: string;
  dispatchedByPersonId?: string;
  receivedByPersonId?: string;
  cancelledByPersonId?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  remarks?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  items?: InventoryStockTransferItem[];
}

export type InventoryStockMovementType =
  | "RECEIPT"
  | "ISSUE"
  | "RETURN"
  | "TRANSFER_OUT"
  | "TRANSFER_IN"
  | "ADJUSTMENT"
  | "RESERVATION"
  | "RESERVATION_RELEASE"
  | "RESERVATION_FULFILLMENT"
  | string;

export interface InventoryStockLedgerEntry {
  id: string;
  movementNumber: string;
  movementType: InventoryStockMovementType;
  propertyId?: string;
  storeId: string;
  binLocationId?: string;
  itemId: string;
  batchId?: string;
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
  movementDate: string;
  postedByPersonId?: string;
  remarks?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export type InventoryMaterialIssueStatus =
  | "DRAFT"
  | "POSTED"
  | "CANCELLED"
  | string;

export interface InventoryMaterialIssueItem {
  id: string;
  materialIssueId?: string;
  itemId: string;
  binLocationId?: string;
  batchId?: string;
  quantity: number;
  unitCost: number;
  remarks?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryMaterialIssue {
  id: string;
  issueNumber: string;
  propertyId: string;
  storeId: string;
  status: InventoryMaterialIssueStatus;
  issueDate: string;
  reasonCode: string;
  reasonDescription?: string;
  requestedByPersonId?: string;
  createdByPersonId: string;
  postedByPersonId?: string;
  cancelledByPersonId?: string;
  postedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  remarks?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  items?: InventoryMaterialIssueItem[];
}

export type InventoryMaterialReturnStatus =
  | "DRAFT"
  | "POSTED"
  | "CANCELLED"
  | string;

export interface InventoryMaterialReturnItem {
  id: string;
  materialReturnId?: string;
  itemId: string;
  binLocationId?: string;
  batchId?: string;
  quantity: number;
  unitCost: number;
  remarks?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryMaterialReturn {
  id: string;
  returnNumber: string;
  propertyId: string;
  storeId: string;
  materialIssueId?: string;
  status: InventoryMaterialReturnStatus;
  returnDate: string;
  reasonCode: string;
  reasonDescription?: string;
  returnedByPersonId?: string;
  createdByPersonId: string;
  postedByPersonId?: string;
  cancelledByPersonId?: string;
  postedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  remarks?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  items?: InventoryMaterialReturnItem[];
}

export interface InventoryMaterialReturnFilters {
  propertyId?: string;
  storeId?: string;
  materialIssueId?: string;
  status?: string;
  reasonCode?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateInventoryMaterialReturnLineInput {
  itemId: string;
  binLocationId?: string;
  batchId?: string;
  quantity: number;
  unitCost: number;
  remarks?: string;
  manualBatchIds?: string[];
  strict?: boolean;
}

export interface CreateInventoryMaterialReturnInput {
  propertyId: string;
  storeId: string;
  materialIssueId?: string;
  returnDate: string;
  reasonCode: string;
  reasonDescription?: string;
  returnedByPersonId?: string;
  createdByPersonId: string;
  remarks?: string;
  items: CreateInventoryMaterialReturnLineInput[];
}

export interface InventoryMaterialIssueFilters {
  propertyId?: string;
  storeId?: string;
  status?: string;
  reasonCode?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CreateInventoryMaterialIssueLineInput {
  itemId: string;
  binLocationId?: string;
  batchId?: string;
  quantity: number;
  unitCost: number;
  remarks?: string;
  manualBatchIds?: string[];
  strict?: boolean;
}

export interface CreateInventoryMaterialIssueInput {
  propertyId: string;
  storeId: string;
  issueDate: string;
  reasonCode: string;
  reasonDescription?: string;
  requestedByPersonId?: string;
  createdByPersonId: string;
  remarks?: string;
  items: CreateInventoryMaterialIssueLineInput[];
}

export interface InventoryStockLedgerFilters {
  propertyId?: string;
  storeId?: string;
  binLocationId?: string;
  itemId?: string;
  batchId?: string;
  movementType?: string;
  sourceType?: string;
  sourceId?: string;
  referenceNumber?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface InventoryTransferFilters {
  propertyId?: string;
  sourceStoreId?: string;
  destinationStoreId?: string;
  status?: string;
}

export interface CreateInventoryTransferLineInput {
  itemId: string;
  sourceBinLocationId?: string;
  destinationBinLocationId?: string;
  quantity: number;
  unitCost: number;
  remarks?: string;
}

export interface CreateInventoryTransferInput {
  propertyId: string;
  sourceStoreId: string;
  destinationStoreId: string;
  transferDate: string;
  createdByPersonId: string;
  remarks?: string;
  items: CreateInventoryTransferLineInput[];
}

export interface InventoryTransferQuantityInput {
  transferItemId: string;
  quantity: number;
}

export interface InventoryReservationFilters {
  propertyId?: string;
  storeId?: string;
  itemId?: string;
  status?: string;
}

export interface CreateInventoryReservationInput {
  propertyId?: string;
  storeId: string;
  binLocationId?: string;
  itemId: string;
  quantity: number;
  sourceType?: string;
  sourceId?: string;
  referenceNumber?: string;
  expiresAt?: string;
  remarks?: string;
  createdByPersonId: string;
}

export interface InventoryReservationActionInput {
  personId: string;
  quantity?: number;
  remarks?: string;
}

export interface InventoryAdjustmentFilters {
  propertyId?: string;
  storeId?: string;
  status?: string;
}

export interface CreateInventoryAdjustmentLineInput {
  itemId: string;
  binLocationId?: string;
  quantityDelta: number;
  unitCost?: number;
  remarks?: string;
}

export interface CreateInventoryAdjustmentInput {
  propertyId: string;
  storeId: string;
  adjustmentDate?: string;
  reasonCode?: string;
  reasonDescription?: string;
  referenceNumber?: string;
  remarks?: string;
  createdByPersonId: string;
  items: CreateInventoryAdjustmentLineInput[];
}

export interface InventoryAdjustmentTransitionInput {
  personId: string;
  remarks?: string;
}

export interface InventoryDashboardFilters {
  search?: string;
  itemType?: InventoryItemType | "";
  activeOnly?: boolean;
  belowReorderLevel?: boolean;
}

export interface InventoryDashboardMetrics {
  totalItems: number;
  activeItems: number;
  stores: number;
  stockLines: number;
  totalOnHand: number;
  totalReserved: number;
  totalAvailable: number;
  belowReorderLines: number;
}
