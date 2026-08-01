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
  ProcurementRfq,
  ProcurementRfqItem,
  ProcurementRfqVendor,
  ProcurementStatusHistory,
} from '../types/procurement.types';

import {
  ProcurementRfqDetails,
  ProcurementRfqFilters,
  ProcurementRfqRepository,
} from './procurement-rfq.repository';

@Injectable()
export class PostgresProcurementRfqRepository
  implements ProcurementRfqRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(
    rfq: ProcurementRfq,
    items: ProcurementRfqItem[],
    vendors: ProcurementRfqVendor[],
  ): Promise<ProcurementRfqDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      await this.insertRfq(
        client,
        rfq,
      );

      await this.replaceItems(
        client,
        rfq.id,
        items,
      );

      await this.replaceVendors(
        client,
        rfq.id,
        vendors,
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
        rfq.id,
      );

    if (!created) {
      throw new Error(
        'RFQ was not created',
      );
    }

    return created;
  }

  async findById(
    id: string,
  ): Promise<
    ProcurementRfqDetails | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_rfqs
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
      vendors,
      history,
    ] =
      await Promise.all([
        this.listItems(id),
        this.listVendors(id),
        this.listHistory(id),
      ]);

    return {
      ...this.mapRfq(row),
      items,
      vendors,
      history,
    };
  }

  async findByPurchaseRequestId(
    purchaseRequestId: string,
  ): Promise<
    ProcurementRfq | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_rfqs
        WHERE purchase_request_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [
          purchaseRequestId,
        ],
      );

    return result.rows[0]
      ? this.mapRfq(
          result.rows[0],
        )
      : null;
  }

  async findActiveVendorIds(
    vendorIds: string[],
  ): Promise<string[]> {
    if (
      vendorIds.length === 0
    ) {
      return [];
    }

    const result =
      await this.pool.query(
        `
        SELECT id
        FROM vendors
        WHERE id = ANY($1::uuid[])
          AND status = 'ACTIVE'
        `,
        [
          vendorIds,
        ],
      );

    return result.rows.map(
      (
        row: {
          id: string;
        },
      ) =>
        row.id,
    );
  }

  async list(
    filters:
      ProcurementRfqFilters = {},
  ): Promise<ProcurementRfq[]> {
    const conditions: string[] =
      [];

    const values: unknown[] =
      [];

    const addCondition = (
      expression: string,
      value: unknown,
    ) => {
      values.push(value);

      conditions.push(
        `${expression} = $${values.length}`,
      );
    };

    if (
      filters.purchaseRequestId
    ) {
      addCondition(
        'r.purchase_request_id',
        filters.purchaseRequestId,
      );
    }

    if (filters.propertyId) {
      addCondition(
        'r.property_id',
        filters.propertyId,
      );
    }

    if (filters.status) {
      addCondition(
        'r.status',
        filters.status,
      );
    }

    if (filters.vendorId) {
      values.push(
        filters.vendorId,
      );

      conditions.push(
        `EXISTS (
          SELECT 1
          FROM procurement_rfq_vendors rv
          WHERE rv.rfq_id = r.id
            AND rv.vendor_id = $${values.length}
        )`,
      );
    }

    if (filters.search) {
      values.push(
        `%${filters.search}%`,
      );

      conditions.push(
        `(
          r.rfq_number
            ILIKE $${values.length}
          OR r.title
            ILIKE $${values.length}
          OR r.description
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
        SELECT r.*
        FROM procurement_rfqs r
        ${where}
        ORDER BY
          r.created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapRfq(row),
    );
  }

  async update(
    rfq: ProcurementRfq,
    items?: ProcurementRfqItem[],
    vendors?: ProcurementRfqVendor[],
  ): Promise<ProcurementRfqDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `
        UPDATE procurement_rfqs
        SET
          purchase_request_id = $2,
          property_id = $3,
          title = $4,
          description = $5,
          status = $6,
          issue_date = $7,
          quotation_deadline = $8,
          delivery_required_by = $9,
          currency = $10,
          terms_and_conditions = $11,
          created_by_person_id = $12,
          issued_by_person_id = $13,
          awarded_quotation_id = $14,
          issued_at = $15,
          closed_at = $16,
          awarded_at = $17,
          cancelled_at = $18,
          expired_at = $19,
          updated_at = $20
        WHERE id = $1
        `,
        [
          rfq.id,
          rfq.purchaseRequestId,
          rfq.propertyId,
          rfq.title,
          rfq.description ?? null,
          rfq.status,
          rfq.issueDate ?? null,
          rfq.quotationDeadline,
          rfq.deliveryRequiredBy ??
            null,
          rfq.currency,
          rfq.termsAndConditions ??
            null,
          rfq.createdByPersonId,
          rfq.issuedByPersonId ??
            null,
          rfq.awardedQuotationId ??
            null,
          rfq.issuedAt ?? null,
          rfq.closedAt ?? null,
          rfq.awardedAt ?? null,
          rfq.cancelledAt ?? null,
          rfq.expiredAt ?? null,
          rfq.updatedAt,
        ],
      );

      if (items) {
        await this.replaceItems(
          client,
          rfq.id,
          items,
        );
      }

      if (vendors) {
        await this.replaceVendors(
          client,
          rfq.id,
          vendors,
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
        rfq.id,
      );

    if (!updated) {
      throw new Error(
        'RFQ was not updated',
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

  async markVendorViewed(
    rfqId: string,
    vendorId: string,
    viewedAt: Date,
  ): Promise<
    ProcurementRfqVendor | null
  > {
    const result =
      await this.pool.query(
        `
        UPDATE procurement_rfq_vendors
        SET
          status = CASE
            WHEN status = 'INVITED'
              THEN 'VIEWED'
            ELSE status
          END,
          viewed_at =
            COALESCE(
              viewed_at,
              $3
            )
        WHERE rfq_id = $1
          AND vendor_id = $2
        RETURNING *
        `,
        [
          rfqId,
          vendorId,
          viewedAt,
        ],
      );

    return result.rows[0]
      ? this.mapVendor(
          result.rows[0],
        )
      : null;
  }

  async markVendorResponded(
    rfqId: string,
    vendorId: string,
    respondedAt: Date,
  ): Promise<
    ProcurementRfqVendor | null
  > {
    const result =
      await this.pool.query(
        `
        UPDATE procurement_rfq_vendors
        SET
          status = 'RESPONDED',
          responded_at = $3
        WHERE rfq_id = $1
          AND vendor_id = $2
        RETURNING *
        `,
        [
          rfqId,
          vendorId,
          respondedAt,
        ],
      );

    return result.rows[0]
      ? this.mapVendor(
          result.rows[0],
        )
      : null;
  }

  async markVendorDeclined(
    rfqId: string,
    vendorId: string,
    declinedAt: Date,
    declineReason: string,
  ): Promise<
    ProcurementRfqVendor | null
  > {
    const result =
      await this.pool.query(
        `
        UPDATE procurement_rfq_vendors
        SET
          status = 'DECLINED',
          declined_at = $3,
          decline_reason = $4
        WHERE rfq_id = $1
          AND vendor_id = $2
        RETURNING *
        `,
        [
          rfqId,
          vendorId,
          declinedAt,
          declineReason,
        ],
      );

    return result.rows[0]
      ? this.mapVendor(
          result.rows[0],
        )
      : null;
  }

  private async insertRfq(
    client: PoolClient,
    rfq: ProcurementRfq,
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO procurement_rfqs (
        id,
        rfq_number,
        purchase_request_id,
        property_id,
        title,
        description,
        status,
        issue_date,
        quotation_deadline,
        delivery_required_by,
        currency,
        terms_and_conditions,
        created_by_person_id,
        issued_by_person_id,
        awarded_quotation_id,
        issued_at,
        closed_at,
        awarded_at,
        cancelled_at,
        expired_at,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,$14,
        $15,$16,$17,$18,$19,$20,$21,$22
      )
      `,
      [
        rfq.id,
        rfq.rfqNumber,
        rfq.purchaseRequestId,
        rfq.propertyId,
        rfq.title,
        rfq.description ?? null,
        rfq.status,
        rfq.issueDate ?? null,
        rfq.quotationDeadline,
        rfq.deliveryRequiredBy ??
          null,
        rfq.currency,
        rfq.termsAndConditions ??
          null,
        rfq.createdByPersonId,
        rfq.issuedByPersonId ??
          null,
        rfq.awardedQuotationId ??
          null,
        rfq.issuedAt ?? null,
        rfq.closedAt ?? null,
        rfq.awardedAt ?? null,
        rfq.cancelledAt ?? null,
        rfq.expiredAt ?? null,
        rfq.createdAt,
        rfq.updatedAt,
      ],
    );
  }

  private async replaceItems(
    client: PoolClient,
    rfqId: string,
    items: ProcurementRfqItem[],
  ): Promise<void> {
    await client.query(
      `
      DELETE FROM procurement_rfq_items
      WHERE rfq_id = $1
      `,
      [rfqId],
    );

    for (
      const item of items
    ) {
      await client.query(
        `
        INSERT INTO procurement_rfq_items (
          id,
          rfq_id,
          purchase_request_item_id,
          line_number,
          item_type,
          item_code,
          description,
          quantity,
          unit,
          specifications,
          created_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,
          $7,$8,$9,$10,$11
        )
        `,
        [
          item.id,
          item.rfqId,
          item.purchaseRequestItemId ??
            null,
          item.lineNumber,
          item.itemType,
          item.itemCode ?? null,
          item.description,
          item.quantity,
          item.unit,
          item.specifications ??
            null,
          item.createdAt,
        ],
      );
    }
  }

  private async replaceVendors(
    client: PoolClient,
    rfqId: string,
    vendors: ProcurementRfqVendor[],
  ): Promise<void> {
    await client.query(
      `
      DELETE FROM procurement_rfq_vendors
      WHERE rfq_id = $1
      `,
      [rfqId],
    );

    for (
      const vendor of vendors
    ) {
      await client.query(
        `
        INSERT INTO procurement_rfq_vendors (
          id,
          rfq_id,
          vendor_id,
          status,
          invited_at,
          viewed_at,
          responded_at,
          declined_at,
          decline_reason
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9
        )
        `,
        [
          vendor.id,
          vendor.rfqId,
          vendor.vendorId,
          vendor.status,
          vendor.invitedAt,
          vendor.viewedAt ?? null,
          vendor.respondedAt ??
            null,
          vendor.declinedAt ??
            null,
          vendor.declineReason ??
            null,
        ],
      );
    }
  }

  private async listItems(
    rfqId: string,
  ): Promise<
    ProcurementRfqItem[]
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_rfq_items
        WHERE rfq_id = $1
        ORDER BY line_number ASC
        `,
        [rfqId],
      );

    return result.rows.map(
      (row) =>
        this.mapItem(row),
    );
  }

  private async listVendors(
    rfqId: string,
  ): Promise<
    ProcurementRfqVendor[]
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_rfq_vendors
        WHERE rfq_id = $1
        ORDER BY invited_at ASC
        `,
        [rfqId],
      );

    return result.rows.map(
      (row) =>
        this.mapVendor(row),
    );
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
        WHERE entity_type = 'RFQ'
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

  private mapRfq(
    row: any,
  ): ProcurementRfq {
    return {
      id:
        row.id,

      rfqNumber:
        row.rfq_number,

      purchaseRequestId:
        row.purchase_request_id,

      propertyId:
        row.property_id,

      title:
        row.title,

      description:
        row.description ??
        undefined,

      status:
        row.status,

      issueDate:
        row.issue_date ??
        undefined,

      quotationDeadline:
        row.quotation_deadline,

      deliveryRequiredBy:
        row.delivery_required_by ??
        undefined,

      currency:
        row.currency,

      termsAndConditions:
        row.terms_and_conditions ??
        undefined,

      createdByPersonId:
        row.created_by_person_id,

      issuedByPersonId:
        row.issued_by_person_id ??
        undefined,

      awardedQuotationId:
        row.awarded_quotation_id ??
        undefined,

      issuedAt:
        row.issued_at ??
        undefined,

      closedAt:
        row.closed_at ??
        undefined,

      awardedAt:
        row.awarded_at ??
        undefined,

      cancelledAt:
        row.cancelled_at ??
        undefined,

      expiredAt:
        row.expired_at ??
        undefined,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    };
  }

  private mapItem(
    row: any,
  ): ProcurementRfqItem {
    return {
      id:
        row.id,

      rfqId:
        row.rfq_id,

      purchaseRequestItemId:
        row.purchase_request_item_id ??
        undefined,

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

      specifications:
        row.specifications ??
        undefined,

      createdAt:
        row.created_at,
    };
  }

  private mapVendor(
    row: any,
  ): ProcurementRfqVendor {
    return {
      id:
        row.id,

      rfqId:
        row.rfq_id,

      vendorId:
        row.vendor_id,

      status:
        row.status,

      invitedAt:
        row.invited_at,

      viewedAt:
        row.viewed_at ??
        undefined,

      respondedAt:
        row.responded_at ??
        undefined,

      declinedAt:
        row.declined_at ??
        undefined,

      declineReason:
        row.decline_reason ??
        undefined,
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
