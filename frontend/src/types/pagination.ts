export type SortOrder = "asc" | "desc";

export interface ListQuery {
  page: number;
  limit: number;
  search: string;
  sortBy: string;
  sortOrder: SortOrder;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
