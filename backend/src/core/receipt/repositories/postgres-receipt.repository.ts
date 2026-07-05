import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/postgres';
import { CreateReceiptDto } from '../dto/create-receipt.dto';
import { Receipt } from '../types';
import { ReceiptRepository } from './receipt-repository.interface';

@Injectable()
export class PostgresReceiptRepository implements ReceiptRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

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

    return this.mapRow(result.rows[0]);
  }

  async findAll(): Promise<Receipt[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM receipts
      ORDER BY created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapRow(row));
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

    return this.mapRow(result.rows[0]);
  }

  private mapRow(row: any): Receipt {
    return {
      id: row.id,
      receiptNumber: row.receipt_number,

      rentPaymentId: row.rent_payment_id,
      rentLedgerId: row.rent_ledger_id,
      tenantId: row.tenant_id,

      amount: Number(row.amount),

      receiptDate:
        row.receipt_date instanceof Date
          ? [
              row.receipt_date.getFullYear(),
              String(row.receipt_date.getMonth() + 1).padStart(2, '0'),
              String(row.receipt_date.getDate()).padStart(2, '0'),
            ].join('-')
          : row.receipt_date,

      paymentMode: row.payment_mode,
      referenceNumber: row.reference_number,

      status: row.status,

      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
