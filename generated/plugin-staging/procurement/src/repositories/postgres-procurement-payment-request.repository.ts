import {
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  Pool,
  PoolClient,
} from 'pg';

import {
  POSTGRES_POOL,
} from '@propertyos/core-contracts';

import {
  ProcurementPaymentRequest,
  ProcurementStatusHistory,
} from '../types/procurement.types';

import {
  ProcurementPaymentRequestDetails,
  ProcurementPaymentRequestFilters,
  ProcurementPaymentRequestRepository,
} from './procurement-payment-request.repository';

@Injectable()
export class PostgresProcurementPaymentRequestRepository
  implements ProcurementPaymentRequestRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(
    paymentRequest: ProcurementPaymentRequest,
    history: ProcurementStatusHistory,
  ): Promise<ProcurementPaymentRequestDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await this.insertPaymentRequest(
        client,
        paymentRequest,
      );

      await this.insertHistory(
        client,
        history,
      );

      await client.query(
        'COMMIT',
      );
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }

    const created =
      await this.findById(
        paymentRequest.id,
      );

    if (!created) {
      throw new Error(
        'Payment Request was not created',
      );
    }

    return created;
  }

  async findById(
    id: string,
  ): Promise<ProcurementPaymentRequestDetails | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_payment_requests
        WHERE id = $1
        `,
        [id],
      );

    if (!result.rows[0]) {
      return null;
    }

    return {
      ...this.mapPaymentRequest(
        result.rows[0],
      ),

      history:
        await this.listHistory(
          id,
        ),
    };
  }

  async findActiveByInvoiceMatchId(
    invoiceMatchId: string,
  ): Promise<ProcurementPaymentRequest | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_payment_requests
        WHERE invoice_match_id = $1
          AND status NOT IN (
            'REJECTED',
            'CANCELLED'
          )
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [invoiceMatchId],
      );

    return result.rows[0]
      ? this.mapPaymentRequest(
          result.rows[0],
        )
      : null;
  }

  async list(
    filters:
      ProcurementPaymentRequestFilters = {},
  ): Promise<ProcurementPaymentRequest[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    const addCondition = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${column} = $${values.length}`,
      );
    };

    if (filters.invoiceMatchId) {
      addCondition(
        'invoice_match_id',
        filters.invoiceMatchId,
      );
    }

    if (filters.purchaseOrderId) {
      addCondition(
        'purchase_order_id',
        filters.purchaseOrderId,
      );
    }

    if (filters.vendorId) {
      addCondition(
        'vendor_id',
        filters.vendorId,
      );
    }

    if (filters.propertyId) {
      addCondition(
        'property_id',
        filters.propertyId,
      );
    }

    if (filters.status) {
      addCondition(
        'status',
        filters.status,
      );
    }

    if (filters.overdue) {
      conditions.push(
        `(
          due_date IS NOT NULL
          AND due_date < CURRENT_DATE
          AND status IN (
            'SUBMITTED',
            'APPROVED'
          )
        )`,
      );
    }

    if (filters.search) {
      values.push(
        `%${filters.search}%`,
      );

      conditions.push(
        `(
          payment_request_number
            ILIKE $${values.length}
          OR payment_reference
            ILIKE $${values.length}
          OR remarks
            ILIKE $${values.length}
        )`,
      );
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(
            ' AND ',
          )}`
        : '';

    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_payment_requests
        ${where}
        ORDER BY created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapPaymentRequest(
          row,
        ),
    );
  }

  async update(
    paymentRequest: ProcurementPaymentRequest,
  ): Promise<ProcurementPaymentRequestDetails> {
    await this.pool.query(
      `
      UPDATE procurement_payment_requests
      SET
        payment_request_number = $2,
        vendor_id = $3,
        property_id = $4,
        purchase_order_id = $5,
        invoice_match_id = $6,
        requested_amount = $7,
        approved_amount = $8,
        paid_amount = $9,
        currency = $10,
        due_date = $11,
        status = $12,
        requested_by_person_id = $13,
        approved_by_person_id = $14,
        rejected_by_person_id = $15,
        paid_by_person_id = $16,
        submitted_at = $17,
        approved_at = $18,
        rejected_at = $19,
        paid_at = $20,
        rejection_reason = $21,
        payment_reference = $22,
        remarks = $23,
        updated_at = $24
      WHERE id = $1
      `,
      this.paymentRequestValues(
        paymentRequest,
      ),
    );

    const updated =
      await this.findById(
        paymentRequest.id,
      );

    if (!updated) {
      throw new Error(
        'Payment Request was not updated',
      );
    }

    return updated;
  }

  async transition(
    paymentRequest: ProcurementPaymentRequest,
    history: ProcurementStatusHistory,
  ): Promise<ProcurementPaymentRequestDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      const locked =
        await client.query(
          `
          SELECT id
          FROM procurement_payment_requests
          WHERE id = $1
          FOR UPDATE
          `,
          [
            paymentRequest.id,
          ],
        );

      if (!locked.rows[0]) {
        throw new Error(
          'Payment Request was not found',
        );
      }

      await this.updatePaymentRequest(
        client,
        paymentRequest,
      );

      await this.insertHistory(
        client,
        history,
      );

      await client.query(
        'COMMIT',
      );
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }

    const transitioned =
      await this.findById(
        paymentRequest.id,
      );

    if (!transitioned) {
      throw new Error(
        'Transitioned Payment Request was not found',
      );
    }

    return transitioned;
  }

  async addHistory(
    history: ProcurementStatusHistory,
  ): Promise<ProcurementStatusHistory> {
    const result =
      await this.pool.query(
        `
        INSERT INTO procurement_status_history (
          id,
          entity_type,
          entity_id,
          from_status,
          to_status,
          changed_by_person_id,
          remarks,
          created_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8
        )
        RETURNING *
        `,
        [
          history.id,
          history.entityType,
          history.entityId,
          history.fromStatus ?? null,
          history.toStatus,
          history.changedByPersonId,
          history.remarks ?? null,
          history.createdAt,
        ],
      );

    return this.mapHistory(
      result.rows[0],
    );
  }

  async listHistory(
    paymentRequestId: string,
  ): Promise<ProcurementStatusHistory[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_status_history
        WHERE entity_type =
          'PAYMENT_REQUEST'
          AND entity_id = $1
        ORDER BY created_at ASC
        `,
        [paymentRequestId],
      );

    return result.rows.map(
      (row) =>
        this.mapHistory(
          row,
        ),
    );
  }

  private async insertPaymentRequest(
    client: PoolClient,
    paymentRequest: ProcurementPaymentRequest,
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO procurement_payment_requests (
        id,
        payment_request_number,
        vendor_id,
        property_id,
        purchase_order_id,
        invoice_match_id,
        requested_amount,
        approved_amount,
        paid_amount,
        currency,
        due_date,
        status,
        requested_by_person_id,
        approved_by_person_id,
        rejected_by_person_id,
        paid_by_person_id,
        submitted_at,
        approved_at,
        rejected_at,
        paid_at,
        rejection_reason,
        payment_reference,
        remarks,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20,$21,$22,$23,
        $24,$25
      )
      `,
      [
        paymentRequest.id,
        paymentRequest.paymentRequestNumber,
        paymentRequest.vendorId,
        paymentRequest.propertyId,
        paymentRequest.purchaseOrderId ?? null,
        paymentRequest.invoiceMatchId ?? null,
        paymentRequest.requestedAmount,
        paymentRequest.approvedAmount ?? null,
        paymentRequest.paidAmount ?? null,
        paymentRequest.currency,
        paymentRequest.dueDate ?? null,
        paymentRequest.status,
        paymentRequest.requestedByPersonId,
        paymentRequest.approvedByPersonId ?? null,
        paymentRequest.rejectedByPersonId ?? null,
        paymentRequest.paidByPersonId ?? null,
        paymentRequest.submittedAt ?? null,
        paymentRequest.approvedAt ?? null,
        paymentRequest.rejectedAt ?? null,
        paymentRequest.paidAt ?? null,
        paymentRequest.rejectionReason ?? null,
        paymentRequest.paymentReference ?? null,
        paymentRequest.remarks ?? null,
        paymentRequest.createdAt,
        paymentRequest.updatedAt,
      ],
    );
  }

  private async updatePaymentRequest(
    client: PoolClient,
    paymentRequest: ProcurementPaymentRequest,
  ): Promise<void> {
    await client.query(
      `
      UPDATE procurement_payment_requests
      SET
        payment_request_number = $2,
        vendor_id = $3,
        property_id = $4,
        purchase_order_id = $5,
        invoice_match_id = $6,
        requested_amount = $7,
        approved_amount = $8,
        paid_amount = $9,
        currency = $10,
        due_date = $11,
        status = $12,
        requested_by_person_id = $13,
        approved_by_person_id = $14,
        rejected_by_person_id = $15,
        paid_by_person_id = $16,
        submitted_at = $17,
        approved_at = $18,
        rejected_at = $19,
        paid_at = $20,
        rejection_reason = $21,
        payment_reference = $22,
        remarks = $23,
        updated_at = $24
      WHERE id = $1
      `,
      this.paymentRequestValues(
        paymentRequest,
      ),
    );
  }

  private paymentRequestValues(
    paymentRequest: ProcurementPaymentRequest,
  ) {
    return [
      paymentRequest.id,
      paymentRequest.paymentRequestNumber,
      paymentRequest.vendorId,
      paymentRequest.propertyId,
      paymentRequest.purchaseOrderId ?? null,
      paymentRequest.invoiceMatchId ?? null,
      paymentRequest.requestedAmount,
      paymentRequest.approvedAmount ?? null,
      paymentRequest.paidAmount ?? null,
      paymentRequest.currency,
      paymentRequest.dueDate ?? null,
      paymentRequest.status,
      paymentRequest.requestedByPersonId,
      paymentRequest.approvedByPersonId ?? null,
      paymentRequest.rejectedByPersonId ?? null,
      paymentRequest.paidByPersonId ?? null,
      paymentRequest.submittedAt ?? null,
      paymentRequest.approvedAt ?? null,
      paymentRequest.rejectedAt ?? null,
      paymentRequest.paidAt ?? null,
      paymentRequest.rejectionReason ?? null,
      paymentRequest.paymentReference ?? null,
      paymentRequest.remarks ?? null,
      paymentRequest.updatedAt,
    ];
  }

  private async insertHistory(
    client: PoolClient,
    history: ProcurementStatusHistory,
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO procurement_status_history (
        id,
        entity_type,
        entity_id,
        from_status,
        to_status,
        changed_by_person_id,
        remarks,
        created_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8
      )
      `,
      [
        history.id,
        history.entityType,
        history.entityId,
        history.fromStatus ?? null,
        history.toStatus,
        history.changedByPersonId,
        history.remarks ?? null,
        history.createdAt,
      ],
    );
  }

  private mapPaymentRequest(
    row: any,
  ): ProcurementPaymentRequest {
    return {
      id:
        row.id,

      paymentRequestNumber:
        row.payment_request_number,

      vendorId:
        row.vendor_id,

      propertyId:
        row.property_id,

      purchaseOrderId:
        row.purchase_order_id ??
        undefined,

      invoiceMatchId:
        row.invoice_match_id ??
        undefined,

      requestedAmount:
        Number(
          row.requested_amount,
        ),

      approvedAmount:
        row.approved_amount !==
        null
          ? Number(
              row.approved_amount,
            )
          : undefined,

      paidAmount:
        row.paid_amount !==
        null
          ? Number(
              row.paid_amount,
            )
          : undefined,

      currency:
        row.currency,

      dueDate:
        row.due_date
          ? new Date(
              row.due_date,
            )
          : undefined,

      status:
        row.status,

      requestedByPersonId:
        row.requested_by_person_id,

      approvedByPersonId:
        row.approved_by_person_id ??
        undefined,

      rejectedByPersonId:
        row.rejected_by_person_id ??
        undefined,

      paidByPersonId:
        row.paid_by_person_id ??
        undefined,

      submittedAt:
        row.submitted_at
          ? new Date(
              row.submitted_at,
            )
          : undefined,

      approvedAt:
        row.approved_at
          ? new Date(
              row.approved_at,
            )
          : undefined,

      rejectedAt:
        row.rejected_at
          ? new Date(
              row.rejected_at,
            )
          : undefined,

      paidAt:
        row.paid_at
          ? new Date(
              row.paid_at,
            )
          : undefined,

      rejectionReason:
        row.rejection_reason ??
        undefined,

      paymentReference:
        row.payment_reference ??
        undefined,

      remarks:
        row.remarks ??
        undefined,

      createdAt:
        new Date(
          row.created_at,
        ),

      updatedAt:
        new Date(
          row.updated_at,
        ),
    };
  }

  private mapHistory(
    row: any,
  ): ProcurementStatusHistory {
    return {
      id:
        row.id,

      entityType:
        row.entity_type,

      entityId:
        row.entity_id,

      fromStatus:
        row.from_status ??
        undefined,

      toStatus:
        row.to_status,

      changedByPersonId:
        row.changed_by_person_id,

      remarks:
        row.remarks ??
        undefined,

      createdAt:
        new Date(
          row.created_at,
        ),
    };
  }
}
