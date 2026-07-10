import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import { normalizePagination } from '../../platform';
import { RentCollectionQueryDto } from '../dto/rent-collection-query.dto';
import {
  RentCollectionReport,
  RentCollectionRow,
} from '../types/rent-collection.types';
import { ReportRepository } from './report-repository.interface';

@Injectable()
export class PostgresReportRepository implements ReportRepository {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async getRentCollection(
    query: RentCollectionQueryDto,
  ): Promise<RentCollectionReport> {
    const { page, limit, offset } = normalizePagination({
      ...query,
      page:
        query.page === undefined
          ? undefined
          : Number(query.page),
      limit:
        query.limit === undefined
          ? undefined
          : Number(query.limit),
    });
    const values: unknown[] = [];
    const whereClauses = ['rp.deleted_at IS NULL'];

    const addValue = (value: unknown) => {
      values.push(value);
      return `$${values.length}`;
    };

    if (query.fromDate) {
      whereClauses.push(`rp.payment_date >= ${addValue(query.fromDate)}`);
    }

    if (query.toDate) {
      whereClauses.push(`rp.payment_date <= ${addValue(query.toDate)}`);
    }

    if (query.propertyId) {
      whereClauses.push(`t.property_id = ${addValue(query.propertyId)}`);
    }

    if (query.tenantId) {
      whereClauses.push(`t.id = ${addValue(query.tenantId)}`);
    }

    if (query.paymentMode) {
      whereClauses.push(
        `LOWER(rp.payment_mode) = LOWER(${addValue(query.paymentMode)})`,
      );
    }

    if (query.search?.trim()) {
      const searchParam = addValue(`%${query.search.trim()}%`);

      whereClauses.push(`
        (
          t.tenant_number ILIKE ${searchParam}
          OR p.display_name ILIKE ${searchParam}
          OR pr.name ILIKE ${searchParam}
          OR a.agreement_number ILIKE ${searchParam}
          OR r.receipt_number ILIKE ${searchParam}
          OR rp.payment_mode ILIKE ${searchParam}
          OR rp.reference_number ILIKE ${searchParam}
        )
      `);
    }

    const whereSql = `WHERE ${whereClauses.join(' AND ')}`;

    const sortableColumns: Record<string, string> = {
      paymentDate: 'rp.payment_date',
      amount: 'rp.amount',
      paymentMode: 'rp.payment_mode',
      tenantNumber: 't.tenant_number',
      tenantName: 'p.display_name',
      propertyName: 'pr.name',
      agreementNumber: 'a.agreement_number',
      receiptNumber: 'r.receipt_number',
      createdAt: 'rp.created_at',
    };

    const sortColumn =
      query.sortBy && sortableColumns[query.sortBy]
        ? sortableColumns[query.sortBy]
        : 'rp.payment_date';

    const sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const filteredValues = [...values];

    const limitParam = addValue(limit);
    const offsetParam = addValue(offset);

    const joins = `
      FROM rent_payments rp
      INNER JOIN rent_ledgers rl
        ON rl.id = rp.rent_ledger_id
      INNER JOIN tenants t
        ON t.id = rl.tenant_id
      INNER JOIN persons p
        ON p.id = t.person_id
      INNER JOIN properties pr
        ON pr.id = t.property_id
      INNER JOIN agreements a
        ON a.id = rl.agreement_id
      LEFT JOIN LATERAL (
        SELECT
          receipt.id,
          receipt.receipt_number
        FROM receipts receipt
        WHERE receipt.rent_payment_id = rp.id
        ORDER BY receipt.created_at DESC
        LIMIT 1
      ) r ON TRUE
    `;

    const [itemsResult, summaryResult] = await Promise.all([
      this.pool.query(
        `
        SELECT
          rp.id AS payment_id,
          rp.rent_ledger_id,
          t.id AS tenant_id,
          t.tenant_number,
          p.display_name AS tenant_name,
          pr.id AS property_id,
          pr.name AS property_name,
          a.id AS agreement_id,
          a.agreement_number,
          r.id AS receipt_id,
          r.receipt_number,
          rp.payment_date,
          rp.amount,
          rp.payment_mode,
          rp.reference_number,
          rp.notes
        ${joins}
        ${whereSql}
        ORDER BY ${sortColumn} ${sortOrder}, rp.created_at DESC
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
        `,
        values,
      ),
      this.pool.query(
        `
        SELECT
          COUNT(DISTINCT rp.id)::int AS payment_count,
          COALESCE(SUM(rp.amount), 0)::numeric AS total_collected
        ${joins}
        ${whereSql}
        `,
        filteredValues,
      ),
    ]);

    const summaryRow = summaryResult.rows[0] ?? {};
    const total = Number(summaryRow.payment_count ?? 0);

    return {
      items: itemsResult.rows.map((row) => this.mapRow(row)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalCollected: Number(summaryRow.total_collected ?? 0),
        paymentCount: total,
      },
    };
  }

  private mapRow(row: any): RentCollectionRow {
    return {
      paymentId: row.payment_id,
      rentLedgerId: row.rent_ledger_id,
      tenantId: row.tenant_id,
      tenantNumber: row.tenant_number,
      tenantName: row.tenant_name,
      propertyId: row.property_id,
      propertyName: row.property_name,
      agreementId: row.agreement_id,
      agreementNumber: row.agreement_number,
      receiptId: row.receipt_id ?? undefined,
      receiptNumber: row.receipt_number ?? undefined,
      paymentDate: this.toDateString(row.payment_date),
      amount: Number(row.amount),
      paymentMode: row.payment_mode,
      referenceNumber: row.reference_number ?? undefined,
      notes: row.notes ?? undefined,
    };
  }

  private toDateString(value: Date | string): string {
    if (typeof value === 'string') {
      return value.substring(0, 10);
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
