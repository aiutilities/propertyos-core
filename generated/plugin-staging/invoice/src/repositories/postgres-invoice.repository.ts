import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '@propertyos/core-contracts';
import {
  BasePostgresRepository,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@propertyos/core-contracts';
import { CreateInvoiceDto } from '../dto/create-invoice.dto';
import { Invoice } from '../types';
import { InvoiceRepository } from './invoice-repository.interface';

@Injectable()
export class PostgresInvoiceRepository
  extends BasePostgresRepository
  implements InvoiceRepository
{
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {
    super();
  }

  async create(
    data: CreateInvoiceDto & { invoiceNumber: string },
  ): Promise<Invoice> {
    const result = await this.pool.query(
      `
      INSERT INTO invoices (
        invoice_number,
        tenant_id,
        agreement_id,
        rent_ledger_id,
        receipt_id,
        billing_period_start,
        billing_period_end,
        invoice_date,
        due_date,
        amount,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
      `,
      [
        data.invoiceNumber,
        data.tenantId,
        data.agreementId ?? null,
        data.rentLedgerId ?? null,
        data.receiptId ?? null,
        data.billingPeriodStart,
        data.billingPeriodEnd,
        data.invoiceDate,
        data.dueDate,
        data.amount,
        data.status ?? 'DRAFT',
      ],
    );

    return this.mapInvoice(result.rows[0]);
  }

  async findAll(): Promise<Invoice[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM invoices
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapInvoice(row));
  }

  async listPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Invoice>> {
    const paginatedQuery = this.buildPaginatedQuery(query, {
      tableName: 'invoices',
      searchableColumns: [
        'invoice_number',
        'status',
      ],
      sortableColumns: {
        invoiceNumber: 'invoice_number',
        billingPeriodStart: 'billing_period_start',
        billingPeriodEnd: 'billing_period_end',
        invoiceDate: 'invoice_date',
        dueDate: 'due_date',
        amount: 'amount',
        status: 'status',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      defaultSortColumn: 'created_at',
      mapRow: (row) => this.mapInvoice(row),
    });

    const countValues = paginatedQuery.values.slice(0, -2);

    const [itemsResult, countResult] = await Promise.all([
      this.pool.query(paginatedQuery.itemsSql, paginatedQuery.values),
      this.pool.query(paginatedQuery.countSql, countValues),
    ]);

    const total = Number(countResult.rows[0]?.total ?? 0);

    return this.toPaginatedResponse(
      itemsResult.rows,
      total,
      paginatedQuery.page,
      paginatedQuery.limit,
      (row) => this.mapInvoice(row),
    );
  }

  async findById(id: string): Promise<Invoice | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM invoices
      WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapInvoice(result.rows[0]);
  }

  async findByInvoiceNumber(
    invoiceNumber: string,
  ): Promise<Invoice | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM invoices
      WHERE invoice_number = $1
      `,
      [invoiceNumber],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapInvoice(result.rows[0]);
  }

  private mapInvoice(row: any): Invoice {
    return {
      id: row.id,
      invoiceNumber: row.invoice_number,
      tenantId: row.tenant_id,
      agreementId: row.agreement_id,
      rentLedgerId: row.rent_ledger_id,
      receiptId: row.receipt_id,
      billingPeriodStart: this.toLocalDateString(
        row.billing_period_start,
      ),
      billingPeriodEnd: this.toLocalDateString(
        row.billing_period_end,
      ),
      invoiceDate: this.toLocalDateString(row.invoice_date),
      dueDate: this.toLocalDateString(row.due_date),
      amount: Number(row.amount),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private toLocalDateString(value: Date | string): string {
    if (typeof value === 'string') {
      return value.substring(0, 10);
    }

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
