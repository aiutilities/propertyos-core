export interface PaginatedResponseDto<TData = unknown> {
  items: TData[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
