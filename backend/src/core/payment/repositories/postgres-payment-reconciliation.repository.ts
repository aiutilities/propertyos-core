import {
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  Pool,
} from 'pg';

import {
  POSTGRES_POOL,
} from '../../../database/postgres';

import {
  PaymentReconciliationRun,
  PaymentReconciliationStatus,
} from '../entities';

import {
  PaymentReconciliationRepository,
} from './payment-reconciliation.repository';

interface PaymentReconciliationRow {
  id: string;

  provider_name:
    string;

  status:
    PaymentReconciliationStatus;

  period_start:
    Date;

  period_end:
    Date;

  examined_count:
    number;

  matched_count:
    number;

  mismatch_count:
    number;

  error_message:
    string | null;

  metadata:
    Record<string, unknown> | null;

  started_at:
    Date | null;

  completed_at:
    Date | null;

  created_at:
    Date;

  updated_at:
    Date;
}

@Injectable()
export class PostgresPaymentReconciliationRepository
  extends PaymentReconciliationRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool:
      Pool,
  ) {
    super();
  }

  async create(
    run:
      PaymentReconciliationRun,
  ): Promise<
    PaymentReconciliationRun
  > {
    const result =
      await this.pool.query<
        PaymentReconciliationRow
      >(
        `
          INSERT INTO payment_reconciliation_runs
          (
            id,
            provider_name,
            status,
            period_start,
            period_end,
            examined_count,
            matched_count,
            mismatch_count,
            error_message,
            metadata,
            started_at,
            completed_at,
            created_at,
            updated_at
          )
          VALUES
          (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13, $14
          )
          RETURNING *
        `,
        [
          run.id,
          run.providerName,
          run.status,
          run.periodStart,
          run.periodEnd,
          run.examinedCount,
          run.matchedCount,
          run.mismatchCount,
          run.errorMessage ??
            null,
          run.metadata,
          run.startedAt ??
            null,
          run.completedAt ??
            null,
          run.createdAt,
          run.updatedAt,
        ],
      );

    return this.map(
      result.rows[0],
    );
  }

  async findById(
    id: string,
  ): Promise<
    PaymentReconciliationRun |
    null
  > {
    const result =
      await this.pool.query<
        PaymentReconciliationRow
      >(
        `
          SELECT *
          FROM payment_reconciliation_runs
          WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.map(
          result.rows[0],
        )
      : null;
  }

  async updateStatus(
    id: string,

    status:
      PaymentReconciliationStatus,

    input: {
      examinedCount?:
        number;

      matchedCount?:
        number;

      mismatchCount?:
        number;

      errorMessage?:
        string;

      startedAt?:
        Date;

      completedAt?:
        Date;

      metadata?:
        Record<string, unknown>;
    } = {},
  ): Promise<
    PaymentReconciliationRun
  > {
    const result =
      await this.pool.query<
        PaymentReconciliationRow
      >(
        `
          UPDATE payment_reconciliation_runs
          SET
            status = $2,
            examined_count =
              COALESCE(
                $3,
                examined_count
              ),
            matched_count =
              COALESCE(
                $4,
                matched_count
              ),
            mismatch_count =
              COALESCE(
                $5,
                mismatch_count
              ),
            error_message =
              COALESCE(
                $6,
                error_message
              ),
            started_at =
              COALESCE(
                $7,
                started_at
              ),
            completed_at =
              COALESCE(
                $8,
                completed_at
              ),
            metadata =
              metadata ||
              $9::jsonb,
            updated_at =
              NOW()
          WHERE id = $1
          RETURNING *
        `,
        [
          id,
          status,
          input.examinedCount ??
            null,
          input.matchedCount ??
            null,
          input.mismatchCount ??
            null,
          input.errorMessage ??
            null,
          input.startedAt ??
            null,
          input.completedAt ??
            null,
          JSON.stringify(
            input.metadata ?? {},
          ),
        ],
      );

    if (!result.rows[0]) {
      throw new Error(
        `PAYMENT_RECONCILIATION_RUN_NOT_FOUND: ${id}`,
      );
    }

    return this.map(
      result.rows[0],
    );
  }

  async listByProvider(
    providerName:
      string,
  ): Promise<
    PaymentReconciliationRun[]
  > {
    const result =
      await this.pool.query<
        PaymentReconciliationRow
      >(
        `
          SELECT *
          FROM payment_reconciliation_runs
          WHERE provider_name = $1
          ORDER BY created_at DESC
        `,
        [
          providerName,
        ],
      );

    return result.rows.map(
      (row) =>
        this.map(row),
    );
  }

  private map(
    row:
      PaymentReconciliationRow,
  ): PaymentReconciliationRun {
    return {
      id:
        row.id,

      providerName:
        row.provider_name,

      status:
        row.status,

      periodStart:
        row.period_start,

      periodEnd:
        row.period_end,

      examinedCount:
        row.examined_count,

      matchedCount:
        row.matched_count,

      mismatchCount:
        row.mismatch_count,

      errorMessage:
        row.error_message ??
        undefined,

      metadata:
        row.metadata ?? {},

      startedAt:
        row.started_at ??
        undefined,

      completedAt:
        row.completed_at ??
        undefined,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }
}
