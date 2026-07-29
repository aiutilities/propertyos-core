import {
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  PaymentStatus,
  UpdatePaymentStateInput,
} from '@forgeos/payment';

import {
  Pool,
} from 'pg';

import {
  POSTGRES_POOL,
} from '../../../database/postgres';

import {
  PaymentTransaction,
} from '../entities';

import {
  PaymentTransactionFilters,
  PaymentTransactionRepository,
} from './payment-transaction.repository';

interface PaymentTransactionRow {
  id: string;

  source: string;

  source_reference_id:
    string | null;

  provider_name: string;

  provider_order_id:
    string | null;

  provider_payment_id:
    string | null;

  provider_refund_id:
    string | null;

  idempotency_key: string;

  status:
    PaymentStatus;

  amount_minor:
    string | number;

  currency: string;

  customer_id:
    string | null;

  description:
    string | null;

  failure_code:
    string | null;

  failure_message:
    string | null;

  metadata:
    Record<string, unknown> | null;

  created_at:
    Date;

  updated_at:
    Date;
}

@Injectable()
export class PostgresPaymentTransactionRepository
  extends PaymentTransactionRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool:
      Pool,
  ) {
    super();
  }

  async create(
    transaction:
      PaymentTransaction,
  ): Promise<PaymentTransaction> {
    const result =
      await this.pool.query<
        PaymentTransactionRow
      >(
        `
          INSERT INTO payment_transactions
          (
            id,
            source,
            source_reference_id,
            provider_name,
            provider_order_id,
            provider_payment_id,
            provider_refund_id,
            idempotency_key,
            status,
            amount_minor,
            currency,
            customer_id,
            description,
            failure_code,
            failure_message,
            metadata,
            created_at,
            updated_at
          )
          VALUES
          (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11,
            $12, $13, $14, $15,
            $16, $17, $18
          )
          RETURNING *
        `,
        [
          transaction.id,
          transaction.source,
          transaction
            .sourceReferenceId ??
            null,
          transaction.providerName,
          transaction
            .providerOrderId ??
            null,
          transaction
            .providerPaymentId ??
            null,
          transaction
            .providerRefundId ??
            null,
          transaction.idempotencyKey,
          transaction.status,
          transaction.money
            .amountMinor,
          transaction.money
            .currency,
          transaction.customerId ??
            null,
          transaction.description ??
            null,
          transaction.failureCode ??
            null,
          transaction.failureMessage ??
            null,
          transaction.metadata,
          transaction.createdAt,
          transaction.updatedAt,
        ],
      );

    return this.map(
      result.rows[0],
    );
  }

  async findById(
    id: string,
  ): Promise<
    PaymentTransaction |
    null
  > {
    const result =
      await this.pool.query<
        PaymentTransactionRow
      >(
        `
          SELECT *
          FROM payment_transactions
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

  async findByIdempotencyKey(
    idempotencyKey:
      string,
  ): Promise<
    PaymentTransaction |
    null
  > {
    const result =
      await this.pool.query<
        PaymentTransactionRow
      >(
        `
          SELECT *
          FROM payment_transactions
          WHERE idempotency_key = $1
        `,
        [
          idempotencyKey,
        ],
      );

    return result.rows[0]
      ? this.map(
          result.rows[0],
        )
      : null;
  }

  async findByProviderIdentifiers(
    providerName:
      string,

    identifiers: {
      providerOrderId?:
        string;

      providerPaymentId?:
        string;

      providerRefundId?:
        string;
    },
  ): Promise<
    PaymentTransaction |
    null
  > {
    const conditions:
      string[] = [];

    const values:
      unknown[] = [
        providerName,
      ];

    const addIdentifier = (
      column: string,
      value:
        string | undefined,
    ): void => {
      if (!value) {
        return;
      }

      values.push(value);

      conditions.push(
        `${column} = $${values.length}`,
      );
    };

    addIdentifier(
      'provider_payment_id',
      identifiers
        .providerPaymentId,
    );

    addIdentifier(
      'provider_order_id',
      identifiers
        .providerOrderId,
    );

    addIdentifier(
      'provider_refund_id',
      identifiers
        .providerRefundId,
    );

    if (
      conditions.length === 0
    ) {
      return null;
    }

    const result =
      await this.pool.query<
        PaymentTransactionRow
      >(
        `
          SELECT *
          FROM payment_transactions
          WHERE provider_name = $1
            AND (
              ${conditions.join(
                ' OR ',
              )}
            )
          ORDER BY updated_at DESC
          LIMIT 1
        `,
        values,
      );

    return result.rows[0]
      ? this.map(
          result.rows[0],
        )
      : null;
  }

  async updateState(
    input:
      UpdatePaymentStateInput,
  ): Promise<
    PaymentTransaction |
    null
  > {
    const result =
      await this.pool.query<
        PaymentTransactionRow
      >(
        `
          UPDATE payment_transactions
          SET
            status = $2,
            provider_name =
              COALESCE(
                $3,
                provider_name
              ),
            provider_order_id =
              COALESCE(
                $4,
                provider_order_id
              ),
            provider_payment_id =
              COALESCE(
                $5,
                provider_payment_id
              ),
            provider_refund_id =
              COALESCE(
                $6,
                provider_refund_id
              ),
            amount_minor =
              COALESCE(
                $7,
                amount_minor
              ),
            currency =
              COALESCE(
                $8,
                currency
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
          input.paymentId,
          input.status,
          input.providerName ??
            null,
          input.providerOrderId ??
            null,
          input.providerPaymentId ??
            null,
          input.providerRefundId ??
            null,
          input.money
            ?.amountMinor ??
            null,
          input.money
            ?.currency ??
            null,
          JSON.stringify(
            input.metadata ?? {},
          ),
        ],
      );

    return result.rows[0]
      ? this.map(
          result.rows[0],
        )
      : null;
  }

  async list(
    filters:
      PaymentTransactionFilters = {},
  ): Promise<
    PaymentTransaction[]
  > {
    const conditions:
      string[] = [];

    const values:
      unknown[] = [];

    const addCondition = (
      column: string,
      value: unknown,
    ): void => {
      values.push(value);

      conditions.push(
        `${column} = $${values.length}`,
      );
    };

    if (
      filters.providerName
    ) {
      addCondition(
        'provider_name',
        filters.providerName,
      );
    }

    if (filters.status) {
      addCondition(
        'status',
        filters.status,
      );
    }

    if (filters.source) {
      addCondition(
        'source',
        filters.source,
      );
    }

    if (
      filters
        .sourceReferenceId
    ) {
      addCondition(
        'source_reference_id',
        filters
          .sourceReferenceId,
      );
    }

    if (filters.customerId) {
      addCondition(
        'customer_id',
        filters.customerId,
      );
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            ' AND ',
          )}`
        : '';

    const result =
      await this.pool.query<
        PaymentTransactionRow
      >(
        `
          SELECT *
          FROM payment_transactions
          ${where}
          ORDER BY created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.map(row),
    );
  }

  async listForReconciliation(
    providerName:
      string,

    periodStart:
      Date,

    periodEnd:
      Date,
  ): Promise<
    PaymentTransaction[]
  > {
    const result =
      await this.pool.query<
        PaymentTransactionRow
      >(
        `
          SELECT *
          FROM payment_transactions
          WHERE provider_name = $1
            AND updated_at >= $2
            AND updated_at <= $3
          ORDER BY updated_at ASC
        `,
        [
          providerName,
          periodStart,
          periodEnd,
        ],
      );

    return result.rows.map(
      (row) =>
        this.map(row),
    );
  }

  private map(
    row:
      PaymentTransactionRow,
  ): PaymentTransaction {
    return {
      id:
        row.id,

      source:
        row.source,

      sourceReferenceId:
        row.source_reference_id ??
        undefined,

      providerName:
        row.provider_name,

      providerOrderId:
        row.provider_order_id ??
        undefined,

      providerPaymentId:
        row.provider_payment_id ??
        undefined,

      providerRefundId:
        row.provider_refund_id ??
        undefined,

      idempotencyKey:
        row.idempotency_key,

      status:
        row.status,

      money: {
        amountMinor:
          Number(
            row.amount_minor,
          ),

        currency:
          row.currency,
      },

      customerId:
        row.customer_id ??
        undefined,

      description:
        row.description ??
        undefined,

      failureCode:
        row.failure_code ??
        undefined,

      failureMessage:
        row.failure_message ??
        undefined,

      metadata:
        row.metadata ?? {},

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }
}
