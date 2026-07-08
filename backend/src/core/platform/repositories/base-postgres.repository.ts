import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import {
  normalizePagination,
  PaginationQueryDto,
} from '../dto/pagination-query.dto';

export interface PaginatedQueryOptions<TData> {
  tableName: string;
  searchableColumns?: string[];
  sortableColumns?: Record<string, string>;
  defaultSortColumn?: string;
  mapRow: (row: any) => TData;
}

export abstract class BasePostgresRepository {
  protected mapRow<T>(row: unknown): T {
    return row as T;
  }

  protected mapRows<T>(rows: unknown[]): T[] {
    return rows.map((row) => this.mapRow<T>(row));
  }

  protected buildPaginatedQuery<TData>(
    query: PaginationQueryDto,
    options: PaginatedQueryOptions<TData>,
  ) {
    const { page, limit, offset } = normalizePagination(query);
    const values: unknown[] = [];
    const whereClauses: string[] = [];

    if (query.search && options.searchableColumns?.length) {
      values.push(`%${query.search}%`);
      const searchParam = `$${values.length}`;
      whereClauses.push(
        `(${options.searchableColumns
          .map((column) => `${column} ILIKE ${searchParam}`)
          .join(' OR ')})`,
      );
    }

    const whereSql = whereClauses.length
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    const sortColumn =
      query.sortBy && options.sortableColumns?.[query.sortBy]
        ? options.sortableColumns[query.sortBy]
        : options.defaultSortColumn ?? 'created_at';

    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    values.push(limit);
    const limitParam = `$${values.length}`;

    values.push(offset);
    const offsetParam = `$${values.length}`;

    return {
      page,
      limit,
      values,
      itemsSql: `
        SELECT *
        FROM ${options.tableName}
        ${whereSql}
        ORDER BY ${sortColumn} ${sortOrder}
        LIMIT ${limitParam} OFFSET ${offsetParam}
      `,
      countSql: `
        SELECT COUNT(*)::int AS total
        FROM ${options.tableName}
        ${whereSql}
      `,
    };
  }

  protected toPaginatedResponse<TData>(
    rows: any[],
    total: number,
    page: number,
    limit: number,
    mapRow: (row: any) => TData,
  ): PaginatedResponseDto<TData> {
    return {
      items: rows.map((row) => mapRow(row)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}
