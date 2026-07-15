import {
  InventoryBinLocation,
  InventoryBrand,
  InventoryItem,
  InventoryItemCategory,
  InventoryItemFilters,
  InventoryStockBalance,
  InventoryStockBalanceFilters,
  InventoryValuationRow,
  InventoryMovementHistoryRow,
  InventoryReorderAlertRow,
  InventoryDashboardSummary,
  InventoryStore,
  InventoryStoreFilters,
  InventoryUnitOfMeasure,
} from '../types/inventory.types';

export const INVENTORY_REPOSITORY =
  Symbol('INVENTORY_REPOSITORY');

export interface InventoryRepository {
  createUnitOfMeasure(
    unit: InventoryUnitOfMeasure,
  ): Promise<InventoryUnitOfMeasure>;

  listUnitsOfMeasure(
    activeOnly?: boolean,
  ): Promise<InventoryUnitOfMeasure[]>;

  findUnitOfMeasureById(
    id: string,
  ): Promise<InventoryUnitOfMeasure | null>;

  updateUnitOfMeasure(
    id: string,
    input: Partial<InventoryUnitOfMeasure>,
  ): Promise<InventoryUnitOfMeasure | null>;

  createCategory(
    category: InventoryItemCategory,
  ): Promise<InventoryItemCategory>;

  listCategories(
    activeOnly?: boolean,
  ): Promise<InventoryItemCategory[]>;

  findCategoryById(
    id: string,
  ): Promise<InventoryItemCategory | null>;

  updateCategory(
    id: string,
    input: Partial<InventoryItemCategory>,
  ): Promise<InventoryItemCategory | null>;

  createBrand(
    brand: InventoryBrand,
  ): Promise<InventoryBrand>;

  listBrands(
    activeOnly?: boolean,
  ): Promise<InventoryBrand[]>;

  findBrandById(
    id: string,
  ): Promise<InventoryBrand | null>;

  updateBrand(
    id: string,
    input: Partial<InventoryBrand>,
  ): Promise<InventoryBrand | null>;

  createItem(
    item: InventoryItem,
  ): Promise<InventoryItem>;

  findItemById(
    id: string,
  ): Promise<InventoryItem | null>;

  findItemBySku(
    sku: string,
  ): Promise<InventoryItem | null>;

  listItems(
    filters?: InventoryItemFilters,
  ): Promise<InventoryItem[]>;

  updateItem(
    id: string,
    input: Partial<InventoryItem>,
  ): Promise<InventoryItem | null>;

  createStore(
    store: InventoryStore,
  ): Promise<InventoryStore>;

  findStoreById(
    id: string,
  ): Promise<InventoryStore | null>;

  listStores(
    filters?: InventoryStoreFilters,
  ): Promise<InventoryStore[]>;

  updateStore(
    id: string,
    input: Partial<InventoryStore>,
  ): Promise<InventoryStore | null>;

  createBinLocation(
    bin: InventoryBinLocation,
  ): Promise<InventoryBinLocation>;

  findBinLocationById(
    id: string,
  ): Promise<InventoryBinLocation | null>;

  listBinLocations(
    storeId: string,
  ): Promise<InventoryBinLocation[]>;

  updateBinLocation(
    id: string,
    input: Partial<InventoryBinLocation>,
  ): Promise<InventoryBinLocation | null>;

  findStockBalance(
    itemId: string,
    storeId: string,
    binLocationId?: string,
  ): Promise<InventoryStockBalance | null>;

  listStockBalances(
    filters?: InventoryStockBalanceFilters,
  ): Promise<InventoryStockBalance[]>;


  listInventoryValuation(
    propertyId?: string,
    storeId?: string,
  ): Promise<InventoryValuationRow[]>;

  listInventoryMovementHistory(
    itemId: string,
    storeId?: string,
    limit?: number,
  ): Promise<InventoryMovementHistoryRow[]>;

  listItemsBelowReorderLevel(
    propertyId?: string,
    storeId?: string,
  ): Promise<InventoryReorderAlertRow[]>;

  getInventoryDashboardSummary(
    propertyId?: string,
  ): Promise<InventoryDashboardSummary>;


}
