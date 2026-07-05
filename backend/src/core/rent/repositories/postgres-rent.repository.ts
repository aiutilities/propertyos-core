import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import { RentLedger } from '../types/rent.types';
import { RentRepositoryPort } from './rent-repository.interface';

@Injectable()
export class PostgresRentRepository implements RentRepositoryPort {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async createRentLedger(ledger: RentLedger): Promise<RentLedger> {
    const result = await this.pool.query(
      `
      INSERT INTO rent_ledgers (
        id,
        tenant_id,
        agreement_id,
        period_year,
        period_month,
        due_date,
        rent_amount,
        amount_paid,
        balance_amount,
        status,
        created_at,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
      `,
      [
        ledger.id,
        ledger.tenantId,
        ledger.agreementId,
        ledger.periodYear,
        ledger.periodMonth,
        ledger.dueDate,
        ledger.rentAmount,
        ledger.amountPaid,
        ledger.balanceAmount,
        ledger.status,
        ledger.createdAt,
        ledger.updatedAt,
      ],
    );

    return this.mapRentLedger(result.rows[0]);
  }

  async listRentLedgers(): Promise<RentLedger[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM rent_ledgers
      WHERE deleted_at IS NULL
      ORDER BY period_year DESC, period_month DESC, created_at DESC
      `,
    );

    return result.rows.map((row) => this.mapRentLedger(row));
  }

  async getRentLedger(id: string): Promise<RentLedger | undefined> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM rent_ledgers
      WHERE id = $1
        AND deleted_at IS NULL
      `,
      [id],
    );

    return result.rows[0] ? this.mapRentLedger(result.rows[0]) : undefined;
  }

  private formatDate(value: Date | string): string {
    if (value instanceof Date) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    return String(value).split('T')[0];
  }

  private mapRentLedger(row: any): RentLedger {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      agreementId: row.agreement_id,
      periodYear: row.period_year,
      periodMonth: row.period_month,
      dueDate: this.formatDate(row.due_date),
      rentAmount: Number(row.rent_amount),
      amountPaid: Number(row.amount_paid),
      balanceAmount: Number(row.balance_amount),
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
