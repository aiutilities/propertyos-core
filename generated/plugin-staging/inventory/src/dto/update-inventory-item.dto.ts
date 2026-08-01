import {
  InventoryItemType,
} from '../types/inventory.types';

export class UpdateInventoryItemDto {
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
  updatedByPersonId!: string;
  remarks?: string;
}
