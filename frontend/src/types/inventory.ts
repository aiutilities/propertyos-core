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
