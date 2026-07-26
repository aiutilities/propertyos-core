export type MarketplaceSortField =
  | 'name'
  | 'vendor'
  | 'publishedAt'
  | 'updatedAt';

export type MarketplaceSortDirection =
  | 'asc'
  | 'desc';

export class MarketplaceQueryDto {
  q?: string;
  category?: string;
  vendor?: string;
  verified?: string;
  page?: string;
  limit?: string;
  sort?: string;
  direction?: string;
}

export interface MarketplaceSearchQuery {
  q?: string;
  category?: string;
  vendor?: string;
  verified?: boolean;
  page: number;
  limit: number;
  offset: number;
  sort: MarketplaceSortField;
  direction: MarketplaceSortDirection;
}
