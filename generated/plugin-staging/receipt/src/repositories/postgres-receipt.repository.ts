import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '@propertyos/core-contracts';
import {
  BasePostgresRepository,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '@propertyos/core-contracts';
import { CreateReceiptDto } from '../dto/create-receipt.dto';
import { Receipt } from '../types';
import { ReceiptRepository } from './receipt-repository.interface';

@Injectable()
export class PostgresReceiptRepository
  extends BasePostgresRepository
  implements ReceiptRepository
{
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {
    super();
  }

  async create(dto: CreateReceiptDto): Promise<Receipt> {
    const result = await this.pool.query(
      `
      INSERT INTO receipts (
        receipt_number,
        rent_payment_id,
        rent_ledger_id,
        tenant_id,
        amount,
        receipt_date,
        payment_mode,
        reference_number
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        dto.receiptNumber,
        dto.rentPaymentId,
        dto.rentLedgerId,
        dto.tenantId,
        dto.amount,
        dto.receiptDate,
        dto.paymentMode,
        dto.referenceNumber ?? null,
      ],
    );

    return this.mapReceipt(result.rows[0]);
  }

  async findAll(): Promise<Receipt[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM receipts
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapReceipt(row));
  }

  async listPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<Receipt>> {
    const paginatedQuery = this.buildPaginatedQuery(query, {
      tableName: 'receipts',
      searchableColumns: [
        'receipt_number',
        'payment_mode',
        'reference_number',
        'status',
      ],
      sortableColumns: {
        receiptNumber: 'receipt_number',
        amount: 'amount',
        receiptDate: 'receipt_date',
        paymentMode: 'payment_mode',
        status: 'status',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      defaultSortColumn: 'created_at',
      mapRow: (row) => this.mapReceipt(row),
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
      (row) => this.mapReceipt(row),
    );
  }

  async findById(id: string): Promise<Receipt | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM receipts
      WHERE id = $1
      `,
      [id],
    );

    if (result.rowCount === 0) {
      return null;
    }

    return this.mapReceipt(result.rows[0]);
  }

  private mapReceipt(row: any): Receipt {
    return {
      id: row.id,
      receiptNumber: row.receipt_number,
      rentPaymentId: row.rent_payment_id,
      rentLedgerId: row.rent_ledger_id,
      tenantId: row.tenant_id,
      amount: Number(row.amount),
      receiptDate: this.toLocalDateString(row.receipt_date),
      paymentMode: row.payment_mode,
      referenceNumber: row.reference_number,
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
