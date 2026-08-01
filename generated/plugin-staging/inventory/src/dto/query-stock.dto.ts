export class QueryStockDto {
  propertyId?: string;
  storeId?: string;
  itemId?: string;
  binLocationId?: string;
  belowReorderLevel?: boolean;
  page?: number;
  pageSize?: number;
}
