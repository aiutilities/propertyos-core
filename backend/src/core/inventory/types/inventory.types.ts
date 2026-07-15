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
