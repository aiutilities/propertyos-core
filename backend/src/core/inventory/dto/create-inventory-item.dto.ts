import {
  InventoryItemType,
} from '../types/inventory.types';

export class CreateInventoryItemDto {
  sku!: string;
  name!: string;
  description?: string;
  categoryId!: string;
  unitOfMeasureId!: string;
  brandId?: string;

  itemType:
    InventoryItemType =
      InventoryItemType.GOODS;

  barcode?: string;
  manufacturerPartNumber?: string;

  minimumStockLevel = 0;
  reorderLevel = 0;
  reorderQuantity = 0;
  standardCost = 0;
  currency = 'INR';

  isSerialized = false;
  isBatchTracked = false;

  createdByPersonId!: string;
}
