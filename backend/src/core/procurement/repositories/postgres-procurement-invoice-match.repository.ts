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
  ProcurementInvoiceMatch,
  ProcurementInvoiceMatchItem,
  ProcurementStatusHistory,
} from '../types/procurement.types';

import {
  ProcurementInvoiceMatchDetails,
  ProcurementInvoiceMatchFilters,
  ProcurementInvoiceMatchRepository,
} from './procurement-invoice-match.repository';

@Injectable()
export class PostgresProcurementInvoiceMatchRepository
  implements ProcurementInvoiceMatchRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(
    invoiceMatch: ProcurementInvoiceMatch,
    items: ProcurementInvoiceMatchItem[],
    history: ProcurementStatusHistory,
  ): Promise<ProcurementInvoiceMatchDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await this.insertInvoiceMatch(
        client,
        invoiceMatch,
      );

      await this.replaceItems(
        client,
        invoiceMatch.id,
        items,
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
        invoiceMatch.id,
      );

    if (!created) {
      throw new Error(
        'Invoice Match was not created',
      );
    }

    return created;
  }

  async findById(
    id: string,
  ): Promise<ProcurementInvoiceMatchDetails | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_invoice_matches
        WHERE id = $1
        `,
        [id],
      );

    if (!result.rows[0]) {
      return null;
    }

    const [
      items,
      history,
    ] =
      await Promise.all([
        this.listItems(id),
        this.listHistory(id),
      ]);

    return {
      ...this.mapInvoiceMatch(
        result.rows[0],
      ),
      items,
      history,
    };
  }

  async list(
    filters:
      ProcurementInvoiceMatchFilters = {},
  ): Promise<ProcurementInvoiceMatch[]> {
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

    if (filters.purchaseOrderId) {
      addCondition(
        'purchase_order_id',
        filters.purchaseOrderId,
      );
    }

    if (filters.goodsReceiptId) {
      addCondition(
        'goods_receipt_id',
        filters.goodsReceiptId,
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

    if (filters.search) {
      values.push(
        `%${filters.search}%`,
      );

      conditions.push(
        `(
          invoice_match_number
            ILIKE $${values.length}
          OR external_invoice_number
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
        FROM procurement_invoice_matches
        ${where}
        ORDER BY created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapInvoiceMatch(row),
    );
  }

  async update(
    invoiceMatch: ProcurementInvoiceMatch,
    items?: ProcurementInvoiceMatchItem[],
  ): Promise<ProcurementInvoiceMatchDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await this.updateInvoiceMatch(
        client,
        invoiceMatch,
      );

      if (items) {
        await this.replaceItems(
          client,
          invoiceMatch.id,
          items,
        );
      }

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

    const updated =
      await this.findById(
        invoiceMatch.id,
      );

    if (!updated) {
      throw new Error(
        'Invoice Match was not updated',
      );
    }

    return updated;
  }

  async transition(
    invoiceMatch: ProcurementInvoiceMatch,
    history: ProcurementStatusHistory,
  ): Promise<ProcurementInvoiceMatchDetails> {
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
          FROM procurement_invoice_matches
          WHERE id = $1
          FOR UPDATE
          `,
          [
            invoiceMatch.id,
          ],
        );

      if (!locked.rows[0]) {
        throw new Error(
          'Invoice Match was not found',
        );
      }

      await this.updateInvoiceMatch(
        client,
        invoiceMatch,
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
        invoiceMatch.id,
      );

    if (!transitioned) {
      throw new Error(
        'Transitioned Invoice Match was not found',
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

  async listItems(
    invoiceMatchId: string,
  ): Promise<ProcurementInvoiceMatchItem[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_invoice_match_items
        WHERE invoice_match_id = $1
        ORDER BY created_at ASC, id ASC
        `,
        [invoiceMatchId],
      );

    return result.rows.map(
      (row) =>
        this.mapInvoiceMatchItem(row),
    );
  }

  async listHistory(
    invoiceMatchId: string,
  ): Promise<ProcurementStatusHistory[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_status_history
        WHERE entity_type =
          'INVOICE_MATCH'
          AND entity_id = $1
        ORDER BY created_at ASC
        `,
        [invoiceMatchId],
      );

    return result.rows.map(
      (row) =>
        this.mapHistory(row),
    );
  }

  private async insertInvoiceMatch(
    client: PoolClient,
    invoiceMatch: ProcurementInvoiceMatch,
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO procurement_invoice_matches (
        id,
        invoice_match_number,
        purchase_order_id,
        goods_receipt_id,
        invoice_id,
        vendor_id,
        property_id,
        external_invoice_number,
        invoice_date,
        invoice_amount,
        purchase_order_amount,
        goods_receipt_amount,
        amount_variance,
        quantity_variance,
        status,
        matched_by_person_id,
        approved_by_person_id,
        rejected_by_person_id,
        matched_at,
        approved_at,
        rejected_at,
        rejection_reason,
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
        invoiceMatch.id,
        invoiceMatch.invoiceMatchNumber,
        invoiceMatch.purchaseOrderId,
        invoiceMatch.goodsReceiptId ?? null,
        invoiceMatch.invoiceId ?? null,
        invoiceMatch.vendorId,
        invoiceMatch.propertyId,
        invoiceMatch.externalInvoiceNumber ?? null,
        invoiceMatch.invoiceDate ?? null,
        invoiceMatch.invoiceAmount,
        invoiceMatch.purchaseOrderAmount,
        invoiceMatch.goodsReceiptAmount ?? null,
        invoiceMatch.amountVariance,
        invoiceMatch.quantityVariance,
        invoiceMatch.status,
        invoiceMatch.matchedByPersonId,
        invoiceMatch.approvedByPersonId ?? null,
        invoiceMatch.rejectedByPersonId ?? null,
        invoiceMatch.matchedAt ?? null,
        invoiceMatch.approvedAt ?? null,
        invoiceMatch.rejectedAt ?? null,
        invoiceMatch.rejectionReason ?? null,
        invoiceMatch.remarks ?? null,
        invoiceMatch.createdAt,
        invoiceMatch.updatedAt,
      ],
    );
  }

  private async updateInvoiceMatch(
    client: PoolClient,
    invoiceMatch: ProcurementInvoiceMatch,
  ): Promise<void> {
    await client.query(
      `
      UPDATE procurement_invoice_matches
      SET
        invoice_match_number = $2,
        purchase_order_id = $3,
        goods_receipt_id = $4,
        invoice_id = $5,
        vendor_id = $6,
        property_id = $7,
        external_invoice_number = $8,
        invoice_date = $9,
        invoice_amount = $10,
        purchase_order_amount = $11,
        goods_receipt_amount = $12,
        amount_variance = $13,
        quantity_variance = $14,
        status = $15,
        matched_by_person_id = $16,
        approved_by_person_id = $17,
        rejected_by_person_id = $18,
        matched_at = $19,
        approved_at = $20,
        rejected_at = $21,
        rejection_reason = $22,
        remarks = $23,
        updated_at = $24
      WHERE id = $1
      `,
      [
        invoiceMatch.id,
        invoiceMatch.invoiceMatchNumber,
        invoiceMatch.purchaseOrderId,
        invoiceMatch.goodsReceiptId ?? null,
        invoiceMatch.invoiceId ?? null,
        invoiceMatch.vendorId,
        invoiceMatch.propertyId,
        invoiceMatch.externalInvoiceNumber ?? null,
        invoiceMatch.invoiceDate ?? null,
        invoiceMatch.invoiceAmount,
        invoiceMatch.purchaseOrderAmount,
        invoiceMatch.goodsReceiptAmount ?? null,
        invoiceMatch.amountVariance,
        invoiceMatch.quantityVariance,
        invoiceMatch.status,
        invoiceMatch.matchedByPersonId,
        invoiceMatch.approvedByPersonId ?? null,
        invoiceMatch.rejectedByPersonId ?? null,
        invoiceMatch.matchedAt ?? null,
        invoiceMatch.approvedAt ?? null,
        invoiceMatch.rejectedAt ?? null,
        invoiceMatch.rejectionReason ?? null,
        invoiceMatch.remarks ?? null,
        invoiceMatch.updatedAt,
      ],
    );
  }

  private async replaceItems(
    client: PoolClient,
    invoiceMatchId: string,
    items: ProcurementInvoiceMatchItem[],
  ): Promise<void> {
    await client.query(
      `
      DELETE FROM procurement_invoice_match_items
      WHERE invoice_match_id = $1
      `,
      [invoiceMatchId],
    );

    for (const item of items) {
      await client.query(
        `
        INSERT INTO procurement_invoice_match_items (
          id,
          invoice_match_id,
          purchase_order_item_id,
          goods_receipt_item_id,
          invoiced_quantity,
          ordered_quantity,
          received_quantity,
          unit_price,
          invoice_line_amount,
          purchase_order_line_amount,
          amount_variance,
          quantity_variance,
          is_matched,
          remarks,
          created_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,$12,$13,$14,$15
        )
        `,
        [
          item.id,
          item.invoiceMatchId,
          item.purchaseOrderItemId,
          item.goodsReceiptItemId ?? null,
          item.invoicedQuantity,
          item.orderedQuantity,
          item.receivedQuantity,
          item.unitPrice,
          item.invoiceLineAmount,
          item.purchaseOrderLineAmount,
          item.amountVariance,
          item.quantityVariance,
          item.isMatched,
          item.remarks ?? null,
          item.createdAt,
        ],
      );
    }
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

  private mapInvoiceMatch(
    row: any,
  ): ProcurementInvoiceMatch {
    return {
      id:
        row.id,

      invoiceMatchNumber:
        row.invoice_match_number,

      purchaseOrderId:
        row.purchase_order_id,

      goodsReceiptId:
        row.goods_receipt_id ??
        undefined,

      invoiceId:
        row.invoice_id ??
        undefined,

      vendorId:
        row.vendor_id,

      propertyId:
        row.property_id,

      externalInvoiceNumber:
        row.external_invoice_number ??
        undefined,

      invoiceDate:
        row.invoice_date
          ? new Date(
              row.invoice_date,
            )
          : undefined,

      invoiceAmount:
        Number(
          row.invoice_amount,
        ),

      purchaseOrderAmount:
        Number(
          row.purchase_order_amount,
        ),

      goodsReceiptAmount:
        row.goods_receipt_amount !==
        null
          ? Number(
              row.goods_receipt_amount,
            )
          : undefined,

      amountVariance:
        Number(
          row.amount_variance,
        ),

      quantityVariance:
        Number(
          row.quantity_variance,
        ),

      status:
        row.status,

      matchedByPersonId:
        row.matched_by_person_id,

      approvedByPersonId:
        row.approved_by_person_id ??
        undefined,

      rejectedByPersonId:
        row.rejected_by_person_id ??
        undefined,

      matchedAt:
        row.matched_at
          ? new Date(
              row.matched_at,
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

      rejectionReason:
        row.rejection_reason ??
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

  private mapInvoiceMatchItem(
    row: any,
  ): ProcurementInvoiceMatchItem {
    return {
      id:
        row.id,

      invoiceMatchId:
        row.invoice_match_id,

      purchaseOrderItemId:
        row.purchase_order_item_id,

      goodsReceiptItemId:
        row.goods_receipt_item_id ??
        undefined,

      invoicedQuantity:
        Number(
          row.invoiced_quantity,
        ),

      orderedQuantity:
        Number(
          row.ordered_quantity,
        ),

      receivedQuantity:
        Number(
          row.received_quantity,
        ),

      unitPrice:
        Number(
          row.unit_price,
        ),

      invoiceLineAmount:
        Number(
          row.invoice_line_amount,
        ),

      purchaseOrderLineAmount:
        Number(
          row.purchase_order_line_amount,
        ),

      amountVariance:
        Number(
          row.amount_variance,
        ),

      quantityVariance:
        Number(
          row.quantity_variance,
        ),

      isMatched:
        row.is_matched,

      remarks:
        row.remarks ??
        undefined,

      createdAt:
        new Date(
          row.created_at,
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
