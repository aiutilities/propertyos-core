import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import {
  BasePostgresRepository,
  PaginatedResponseDto,
  PaginationQueryDto,
} from '../../platform';
import { RentPayment } from '../types/payment.types';
import { RentLedger } from '../types/rent.types';
import { RentRepositoryPort } from './rent-repository.interface';

@Injectable()
export class PostgresRentRepository
  extends BasePostgresRepository
  implements RentRepositoryPort {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {
    super();
  }

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

  async listRentLedgersPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<RentLedger>> {
    const paginatedQuery = this.buildPaginatedQuery(query, {
      tableName: 'rent_ledgers',
      searchableColumns: [
        'status',
      ],
      sortableColumns: {
        periodYear: 'period_year',
        periodMonth: 'period_month',
        dueDate: 'due_date',
        rentAmount: 'rent_amount',
        amountPaid: 'amount_paid',
        balanceAmount: 'balance_amount',
        status: 'status',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      defaultSortColumn: 'created_at',
      mapRow: (row) => this.mapRentLedger(row),
    });

    const itemsSql = paginatedQuery.itemsSql.replace(
      'FROM rent_ledgers',
      'FROM rent_ledgers WHERE deleted_at IS NULL',
    );

    const countSql = paginatedQuery.countSql.replace(
      'FROM rent_ledgers',
      'FROM rent_ledgers WHERE deleted_at IS NULL',
    );

    const countValues = paginatedQuery.values.slice(0, -2);

    const [itemsResult, countResult] = await Promise.all([
      this.pool.query(itemsSql, paginatedQuery.values),
      this.pool.query(countSql, countValues),
    ]);

    const total = Number(countResult.rows[0]?.total ?? 0);

    return this.toPaginatedResponse(
      itemsResult.rows,
      total,
      paginatedQuery.page,
      paginatedQuery.limit,
      (row) => this.mapRentLedger(row),
    );
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

  async createPayment(payment: RentPayment): Promise<RentPayment> {
    const result = await this.pool.query(
      `
      INSERT INTO rent_payments (
        id,
        rent_ledger_id,
        payment_date,
        amount,
        payment_mode,
        reference_number,
        notes,
        created_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        payment.id,
        payment.rentLedgerId,
        payment.paymentDate,
        payment.amount,
        payment.paymentMode,
        payment.referenceNumber ?? null,
        payment.notes ?? null,
        payment.createdAt,
      ],
    );

    return this.mapRentPayment(result.rows[0]);
  }

  async listPayments(rentLedgerId: string): Promise<RentPayment[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM rent_payments
      WHERE rent_ledger_id = $1
        AND deleted_at IS NULL
      ORDER BY payment_date DESC, created_at DESC
      `,
      [rentLedgerId],
    );

    return result.rows.map((row) => this.mapRentPayment(row));
  }

  async updateLedgerAmounts(
    ledgerId: string,
    amountPaid: number,
    balanceAmount: number,
    status: string,
  ): Promise<void> {
    await this.pool.query(
      `
      UPDATE rent_ledgers
      SET amount_paid = $2,
          balance_amount = $3,
          status = $4,
          updated_at = now()
      WHERE id = $1
        AND deleted_at IS NULL
      `,
      [ledgerId, amountPaid, balanceAmount, status],
    );
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

  private mapRentPayment(row: any): RentPayment {
    return {
      id: row.id,
      rentLedgerId: row.rent_ledger_id,
      paymentDate: this.formatDate(row.payment_date),
      amount: Number(row.amount),
      paymentMode: row.payment_mode,
      referenceNumber: row.reference_number ?? undefined,
      notes: row.notes ?? undefined,
      createdAt: row.created_at,
    };
  }
}
