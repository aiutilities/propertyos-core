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
  PaymentProviderEvent,
} from '../entities';

import {
  PaymentProviderEventRepository,
} from './payment-provider-event.repository';

interface PaymentProviderEventRow {
  id: string;

  payment_id:
    string | null;

  provider_name:
    string;

  provider_event_id:
    string;

  event_type:
    string;

  provider_order_id:
    string | null;

  provider_payment_id:
    string | null;

  provider_refund_id:
    string | null;

  payload:
    Record<string, unknown> | null;

  metadata:
    Record<string, unknown> | null;

  occurred_at:
    Date | null;

  received_at:
    Date;

  created_at:
    Date;
}

@Injectable()
export class PostgresPaymentProviderEventRepository
  extends PaymentProviderEventRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool:
      Pool,
  ) {
    super();
  }

  async create(
    event:
      PaymentProviderEvent,
  ): Promise<
    PaymentProviderEvent
  > {
    const result =
      await this.pool.query<
        PaymentProviderEventRow
      >(
        `
          INSERT INTO payment_provider_events
          (
            id,
            payment_id,
            provider_name,
            provider_event_id,
            event_type,
            provider_order_id,
            provider_payment_id,
            provider_refund_id,
            payload,
            metadata,
            occurred_at,
            received_at,
            created_at
          )
          VALUES
          (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13
          )
          RETURNING *
        `,
        [
          event.id,
          event.paymentId ??
            null,
          event.providerName,
          event.providerEventId,
          event.eventType,
          event.providerOrderId ??
            null,
          event.providerPaymentId ??
            null,
          event.providerRefundId ??
            null,
          event.payload,
          event.metadata,
          event.occurredAt ??
            null,
          event.receivedAt,
          event.createdAt,
        ],
      );

    return this.map(
      result.rows[0],
    );
  }

  async findByProviderEventId(
    providerName:
      string,

    providerEventId:
      string,
  ): Promise<
    PaymentProviderEvent |
    null
  > {
    const result =
      await this.pool.query<
        PaymentProviderEventRow
      >(
        `
          SELECT *
          FROM payment_provider_events
          WHERE provider_name = $1
            AND provider_event_id = $2
        `,
        [
          providerName,
          providerEventId,
        ],
      );

    return result.rows[0]
      ? this.map(
          result.rows[0],
        )
      : null;
  }

  async listByPaymentId(
    paymentId:
      string,
  ): Promise<
    PaymentProviderEvent[]
  > {
    const result =
      await this.pool.query<
        PaymentProviderEventRow
      >(
        `
          SELECT *
          FROM payment_provider_events
          WHERE payment_id = $1
          ORDER BY
            COALESCE(
              occurred_at,
              received_at
            ) ASC,
            created_at ASC,
            id ASC
        `,
        [
          paymentId,
        ],
      );

    return result.rows.map(
      (row) =>
        this.map(row),
    );
  }

  private map(
    row:
      PaymentProviderEventRow,
  ): PaymentProviderEvent {
    return {
      id:
        row.id,

      paymentId:
        row.payment_id ??
        undefined,

      providerName:
        row.provider_name,

      providerEventId:
        row.provider_event_id,

      eventType:
        row.event_type,

      providerOrderId:
        row.provider_order_id ??
        undefined,

      providerPaymentId:
        row.provider_payment_id ??
        undefined,

      providerRefundId:
        row.provider_refund_id ??
        undefined,

      payload:
        row.payload ?? {},

      metadata:
        row.metadata ?? {},

      occurredAt:
        row.occurred_at ??
        undefined,

      receivedAt:
        row.received_at,

      createdAt:
        row.created_at,
    };
  }
}
