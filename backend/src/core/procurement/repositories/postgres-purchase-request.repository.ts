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
} from '../../../database/postgres';

import {
  ProcurementCategory,
  ProcurementMetrics,
  ProcurementStatusHistory,
  PurchaseRequest,
  PurchaseRequestItem,
} from '../types/procurement.types';

import {
  PurchaseRequestDetails,
  PurchaseRequestFilters,
  PurchaseRequestRepository,
} from './purchase-request.repository';

@Injectable()
export class PostgresPurchaseRequestRepository
  implements PurchaseRequestRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(
    request: PurchaseRequest,
    items: PurchaseRequestItem[],
  ): Promise<PurchaseRequestDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      await this.insertRequest(
        client,
        request,
      );

      await this.replaceItems(
        client,
        request.id,
        items,
      );

      await client.query('COMMIT');
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
        request.id,
      );

    if (!created) {
      throw new Error(
        'Purchase request was not created',
      );
    }

    return created;
  }

  async findById(
    id: string,
  ): Promise<
    PurchaseRequestDetails | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_purchase_requests
        WHERE id = $1
        `,
        [id],
      );

    const row =
      result.rows[0];

    if (!row) {
      return null;
    }

    const [
      items,
      category,
      history,
    ] =
      await Promise.all([
        this.listItems(id),
        this.findCategory(
          row.category_id,
        ),
        this.listHistory(id),
      ]);

    return {
      ...this.mapRequest(row),
      items,
      category:
        category ??
        undefined,
      history,
    };
  }

  async list(
    filters:
      PurchaseRequestFilters = {},
  ): Promise<PurchaseRequest[]> {
    const conditions: string[] =
      [];

    const values: unknown[] =
      [];

    const addCondition = (
      column: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${column} = $${values.length}`,
      );
    };

    if (filters.propertyId) {
      addCondition(
        'property_id',
        filters.propertyId,
      );
    }

    if (filters.categoryId) {
      addCondition(
        'category_id',
        filters.categoryId,
      );
    }

    if (
      filters.requestedByPersonId
    ) {
      addCondition(
        'requested_by_person_id',
        filters.requestedByPersonId,
      );
    }

    if (filters.status) {
      addCondition(
        'status',
        filters.status,
      );
    }

    if (filters.search) {
      values.push(
        `%${filters.search}%`,
      );

      conditions.push(
        `(
          request_number
            ILIKE $${values.length}
          OR title
            ILIKE $${values.length}
          OR description
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
        FROM procurement_purchase_requests
        ${where}
        ORDER BY
          created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapRequest(row),
    );
  }

  async update(
    request: PurchaseRequest,
    items?: PurchaseRequestItem[],
  ): Promise<PurchaseRequestDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `
        UPDATE procurement_purchase_requests
        SET
          property_id = $2,
          zone_id = $3,
          space_id = $4,
          category_id = $5,
          requested_by_person_id = $6,
          title = $7,
          description = $8,
          business_justification = $9,
          priority = $10,
          status = $11,
          required_by_date = $12,
          estimated_amount = $13,
          currency = $14,
          submitted_at = $15,
          approved_at = $16,
          rejected_at = $17,
          cancelled_at = $18,
          closed_at = $19,
          approved_by_person_id = $20,
          rejected_by_person_id = $21,
          cancelled_by_person_id = $22,
          rejection_reason = $23,
          cancellation_reason = $24,
          metadata = $25,
          updated_at = $26
        WHERE id = $1
        `,
        [
          request.id,
          request.propertyId,
          request.zoneId ?? null,
          request.spaceId ?? null,
          request.categoryId,
          request.requestedByPersonId,
          request.title,
          request.description ?? null,
          request.businessJustification ??
            null,
          request.priority,
          request.status,
          request.requiredByDate ?? null,
          request.estimatedAmount ??
            null,
          request.currency,
          request.submittedAt ?? null,
          request.approvedAt ?? null,
          request.rejectedAt ?? null,
          request.cancelledAt ?? null,
          request.closedAt ?? null,
          request.approvedByPersonId ??
            null,
          request.rejectedByPersonId ??
            null,
          request.cancelledByPersonId ??
            null,
          request.rejectionReason ??
            null,
          request.cancellationReason ??
            null,
          JSON.stringify(
            request.metadata,
          ),
          request.updatedAt,
        ],
      );

      if (items) {
        await this.replaceItems(
          client,
          request.id,
          items,
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query(
        'ROLLBACK',
      );

      throw error;
    } finally {
      client.release();
    }

    const updated =
      await this.findById(
        request.id,
      );

    if (!updated) {
      throw new Error(
        'Purchase request was not updated',
      );
    }

    return updated;
  }

  async addHistory(
    history: ProcurementStatusHistory,
  ): Promise<
    ProcurementStatusHistory
  > {
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
          history.fromStatus ??
            null,
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

  async listCategories(): Promise<
    ProcurementCategory[]
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_categories
        ORDER BY name ASC
        `,
      );

    return result.rows.map(
      (row) =>
        this.mapCategory(row),
    );
  }

  async getMetrics(): Promise<
    ProcurementMetrics
  > {
    const result =
      await this.pool.query(
        `
        SELECT
          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_purchase_requests
          ) AS pr_total,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_purchase_requests
            WHERE status IN (
              'SUBMITTED',
              'UNDER_REVIEW'
            )
          ) AS pr_pending_approval,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_purchase_requests
            WHERE status = 'APPROVED'
          ) AS pr_approved,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_purchase_requests
            WHERE status = 'REJECTED'
          ) AS pr_rejected,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_rfqs
            WHERE status IN (
              'ISSUED',
              'OPEN'
            )
          ) AS rfq_open,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_rfqs
            WHERE status IN (
              'ISSUED',
              'OPEN'
            )
              AND quotation_deadline
                BETWEEN NOW()
                AND NOW() + INTERVAL '7 days'
          ) AS rfq_expiring,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_rfqs
            WHERE status = 'AWARDED'
          ) AS rfq_awarded,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_purchase_orders
          ) AS po_total,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_purchase_orders
            WHERE status =
              'PENDING_APPROVAL'
          ) AS po_pending_approval,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_purchase_orders
            WHERE status IN (
              'APPROVED',
              'ISSUED',
              'ACKNOWLEDGED'
            )
          ) AS po_open,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_purchase_orders
            WHERE status =
              'PARTIALLY_RECEIVED'
          ) AS po_partially_received,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_goods_receipts
            WHERE status = 'DRAFT'
          ) AS grn_draft,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_goods_receipts
            WHERE status = 'POSTED'
          ) AS grn_posted,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_invoice_matches
            WHERE status = 'PENDING'
          ) AS match_pending,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_invoice_matches
            WHERE status IN (
              'MATCHED',
              'APPROVED'
            )
          ) AS match_matched,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_invoice_matches
            WHERE status IN (
              'PARTIAL_MATCH',
              'MISMATCH'
            )
          ) AS match_mismatched,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_payment_requests
            WHERE status IN (
              'DRAFT',
              'SUBMITTED'
            )
          ) AS payment_pending,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_payment_requests
            WHERE status = 'APPROVED'
          ) AS payment_approved,

          (
            SELECT COUNT(*)::INTEGER
            FROM procurement_payment_requests
            WHERE status IN (
              'SUBMITTED',
              'APPROVED'
            )
              AND due_date < CURRENT_DATE
          ) AS payment_overdue
        `,
      );

    const row =
      result.rows[0] ?? {};

    return {
      purchaseRequests: {
        total:
          Number(
            row.pr_total ?? 0,
          ),
        pendingApproval:
          Number(
            row.pr_pending_approval ??
              0,
          ),
        approved:
          Number(
            row.pr_approved ?? 0,
          ),
        rejected:
          Number(
            row.pr_rejected ?? 0,
          ),
      },

      rfqs: {
        open:
          Number(
            row.rfq_open ?? 0,
          ),
        expiring:
          Number(
            row.rfq_expiring ?? 0,
          ),
        awarded:
          Number(
            row.rfq_awarded ?? 0,
          ),
      },

      purchaseOrders: {
        total:
          Number(
            row.po_total ?? 0,
          ),
        pendingApproval:
          Number(
            row.po_pending_approval ??
              0,
          ),
        open:
          Number(
            row.po_open ?? 0,
          ),
        partiallyReceived:
          Number(
            row.po_partially_received ??
              0,
          ),
      },

      goodsReceipts: {
        draft:
          Number(
            row.grn_draft ?? 0,
          ),
        posted:
          Number(
            row.grn_posted ?? 0,
          ),
      },

      invoiceMatches: {
        pending:
          Number(
            row.match_pending ?? 0,
          ),
        matched:
          Number(
            row.match_matched ?? 0,
          ),
        mismatched:
          Number(
            row.match_mismatched ??
              0,
          ),
      },

      paymentRequests: {
        pending:
          Number(
            row.payment_pending ??
              0,
          ),
        approved:
          Number(
            row.payment_approved ??
              0,
          ),
        overdue:
          Number(
            row.payment_overdue ??
              0,
          ),
      },
    };
  }

  private async insertRequest(
    client: PoolClient,
    request: PurchaseRequest,
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO procurement_purchase_requests (
        id,
        request_number,
        property_id,
        zone_id,
        space_id,
        category_id,
        requested_by_person_id,
        title,
        description,
        business_justification,
        priority,
        status,
        required_by_date,
        estimated_amount,
        currency,
        submitted_at,
        approved_at,
        rejected_at,
        cancelled_at,
        closed_at,
        approved_by_person_id,
        rejected_by_person_id,
        cancelled_by_person_id,
        rejection_reason,
        cancellation_reason,
        metadata,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19,$20,$21,
        $22,$23,$24,$25,$26,$27,$28
      )
      `,
      [
        request.id,
        request.requestNumber,
        request.propertyId,
        request.zoneId ?? null,
        request.spaceId ?? null,
        request.categoryId,
        request.requestedByPersonId,
        request.title,
        request.description ?? null,
        request.businessJustification ??
          null,
        request.priority,
        request.status,
        request.requiredByDate ??
          null,
        request.estimatedAmount ??
          null,
        request.currency,
        request.submittedAt ??
          null,
        request.approvedAt ?? null,
        request.rejectedAt ?? null,
        request.cancelledAt ?? null,
        request.closedAt ?? null,
        request.approvedByPersonId ??
          null,
        request.rejectedByPersonId ??
          null,
        request.cancelledByPersonId ??
          null,
        request.rejectionReason ??
          null,
        request.cancellationReason ??
          null,
        JSON.stringify(
          request.metadata,
        ),
        request.createdAt,
        request.updatedAt,
      ],
    );
  }

  private async replaceItems(
    client: PoolClient,
    purchaseRequestId: string,
    items: PurchaseRequestItem[],
  ): Promise<void> {
    await client.query(
      `
      DELETE FROM
        procurement_purchase_request_items
      WHERE purchase_request_id = $1
      `,
      [purchaseRequestId],
    );

    for (
      const item of items
    ) {
      await client.query(
        `
        INSERT INTO
          procurement_purchase_request_items (
            id,
            purchase_request_id,
            line_number,
            item_type,
            item_code,
            description,
            quantity,
            unit,
            estimated_unit_price,
            estimated_amount,
            specifications,
            preferred_vendor_id,
            created_at,
            updated_at
          )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,
          $8,$9,$10,$11,$12,$13,$14
        )
        `,
        [
          item.id,
          item.purchaseRequestId,
          item.lineNumber,
          item.itemType,
          item.itemCode ?? null,
          item.description,
          item.quantity,
          item.unit,
          item.estimatedUnitPrice ??
            null,
          item.estimatedAmount ??
            null,
          item.specifications ??
            null,
          item.preferredVendorId ??
            null,
          item.createdAt,
          item.updatedAt,
        ],
      );
    }
  }

  private async listItems(
    purchaseRequestId: string,
  ): Promise<
    PurchaseRequestItem[]
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_purchase_request_items
        WHERE purchase_request_id = $1
        ORDER BY line_number ASC
        `,
        [purchaseRequestId],
      );

    return result.rows.map(
      (row) =>
        this.mapItem(row),
    );
  }

  private async findCategory(
    id: string,
  ): Promise<
    ProcurementCategory | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_categories
        WHERE id = $1
        `,
        [id],
      );

    return result.rows[0]
      ? this.mapCategory(
          result.rows[0],
        )
      : null;
  }

  private async listHistory(
    entityId: string,
  ): Promise<
    ProcurementStatusHistory[]
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_status_history
        WHERE entity_type =
          'PURCHASE_REQUEST'
          AND entity_id = $1
        ORDER BY created_at ASC
        `,
        [entityId],
      );

    return result.rows.map(
      (row) =>
        this.mapHistory(row),
    );
  }

  private mapRequest(
    row: any,
  ): PurchaseRequest {
    return {
      id:
        row.id,

      requestNumber:
        row.request_number,

      propertyId:
        row.property_id,

      zoneId:
        row.zone_id ??
        undefined,

      spaceId:
        row.space_id ??
        undefined,

      categoryId:
        row.category_id,

      requestedByPersonId:
        row.requested_by_person_id,

      title:
        row.title,

      description:
        row.description ??
        undefined,

      businessJustification:
        row.business_justification ??
        undefined,

      priority:
        row.priority,

      status:
        row.status,

      requiredByDate:
        row.required_by_date ??
        undefined,

      estimatedAmount:
        row.estimated_amount ===
        null
          ? undefined
          : Number(
              row.estimated_amount,
            ),

      currency:
        row.currency,

      submittedAt:
        row.submitted_at ??
        undefined,

      approvedAt:
        row.approved_at ??
        undefined,

      rejectedAt:
        row.rejected_at ??
        undefined,

      cancelledAt:
        row.cancelled_at ??
        undefined,

      closedAt:
        row.closed_at ??
        undefined,

      approvedByPersonId:
        row.approved_by_person_id ??
        undefined,

      rejectedByPersonId:
        row.rejected_by_person_id ??
        undefined,

      cancelledByPersonId:
        row.cancelled_by_person_id ??
        undefined,

      rejectionReason:
        row.rejection_reason ??
        undefined,

      cancellationReason:
        row.cancellation_reason ??
        undefined,

      metadata:
        row.metadata ?? {},

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  private mapItem(
    row: any,
  ): PurchaseRequestItem {
    return {
      id:
        row.id,

      purchaseRequestId:
        row.purchase_request_id,

      lineNumber:
        Number(
          row.line_number,
        ),

      itemType:
        row.item_type,

      itemCode:
        row.item_code ??
        undefined,

      description:
        row.description,

      quantity:
        Number(
          row.quantity,
        ),

      unit:
        row.unit,

      estimatedUnitPrice:
        row.estimated_unit_price ===
        null
          ? undefined
          : Number(
              row.estimated_unit_price,
            ),

      estimatedAmount:
        row.estimated_amount ===
        null
          ? undefined
          : Number(
              row.estimated_amount,
            ),

      specifications:
        row.specifications ??
        undefined,

      preferredVendorId:
        row.preferred_vendor_id ??
        undefined,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  private mapCategory(
    row: any,
  ): ProcurementCategory {
    return {
      id:
        row.id,

      code:
        row.code,

      name:
        row.name,

      description:
        row.description ??
        undefined,

      isActive:
        Boolean(
          row.is_active,
        ),

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
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
        row.created_at,
    };
  }
}
