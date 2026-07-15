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
  GoodsReceipt,
  GoodsReceiptItem,
  ProcurementStatusHistory,
  PurchaseOrderStatus,
} from '../types/procurement.types';

import {
  GoodsReceiptDetails,
  GoodsReceiptFilters,
  GoodsReceiptPostingItem,
  GoodsReceiptPostingResult,
  GoodsReceiptRepository,
  GoodsReceiptReversalItem,
  GoodsReceiptReversalResult,
  PostedReceiptQuantity,
} from './procurement-goods-receipt.repository';

@Injectable()
export class PostgresProcurementGoodsReceiptRepository
  implements GoodsReceiptRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(
    goodsReceipt: GoodsReceipt,
    items: GoodsReceiptItem[],
    history: ProcurementStatusHistory,
  ): Promise<GoodsReceiptDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await this.insertGoodsReceipt(
        client,
        goodsReceipt,
      );

      await this.replaceItems(
        client,
        goodsReceipt.id,
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
        goodsReceipt.id,
      );

    if (!created) {
      throw new Error(
        'Goods Receipt was not created',
      );
    }

    return created;
  }

  async findById(
    id: string,
  ): Promise<GoodsReceiptDetails | null> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_goods_receipts
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
      ...this.mapGoodsReceipt(
        result.rows[0],
      ),
      items,
      history,
    };
  }

  async list(
    filters:
      GoodsReceiptFilters = {},
  ): Promise<GoodsReceipt[]> {
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

    if (filters.propertyId) {
      addCondition(
        'property_id',
        filters.propertyId,
      );
    }

    if (filters.vendorId) {
      addCondition(
        'vendor_id',
        filters.vendorId,
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
          goods_receipt_number
            ILIKE $${values.length}
          OR delivery_reference
            ILIKE $${values.length}
          OR invoice_reference
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
        FROM procurement_goods_receipts
        ${where}
        ORDER BY created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapGoodsReceipt(row),
    );
  }

  async update(
    goodsReceipt: GoodsReceipt,
    items?: GoodsReceiptItem[],
  ): Promise<GoodsReceiptDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await this.updateGoodsReceipt(
        client,
        goodsReceipt,
      );

      if (items) {
        await this.replaceItems(
          client,
          goodsReceipt.id,
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
        goodsReceipt.id,
      );

    if (!updated) {
      throw new Error(
        'Goods Receipt was not updated',
      );
    }

    return updated;
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
    goodsReceiptId: string,
  ): Promise<GoodsReceiptItem[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_goods_receipt_items
        WHERE goods_receipt_id = $1
        ORDER BY created_at ASC, id ASC
        `,
        [goodsReceiptId],
      );

    return result.rows.map(
      (row) =>
        this.mapGoodsReceiptItem(row),
    );
  }

  async listHistory(
    goodsReceiptId: string,
  ): Promise<ProcurementStatusHistory[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_status_history
        WHERE entity_type =
          'GOODS_RECEIPT'
          AND entity_id = $1
        ORDER BY created_at ASC
        `,
        [goodsReceiptId],
      );

    return result.rows.map(
      (row) =>
        this.mapHistory(row),
    );
  }

  async aggregatePostedQuantities(
    purchaseOrderId: string,
  ): Promise<PostedReceiptQuantity[]> {
    const result =
      await this.pool.query(
        `
        SELECT
          item.purchase_order_item_id,
          COALESCE(
            SUM(item.received_quantity),
            0
          ) AS posted_received_quantity
        FROM procurement_goods_receipt_items item
        INNER JOIN procurement_goods_receipts receipt
          ON receipt.id =
            item.goods_receipt_id
        WHERE receipt.purchase_order_id = $1
          AND receipt.status = 'POSTED'
        GROUP BY
          item.purchase_order_item_id
        ORDER BY
          item.purchase_order_item_id
        `,
        [purchaseOrderId],
      );

    return result.rows.map(
      (row) => ({
        purchaseOrderItemId:
          row.purchase_order_item_id,

        postedReceivedQuantity:
          Number(
            row.posted_received_quantity,
          ),
      }),
    );
  }

  async post(
    goodsReceipt: GoodsReceipt,
    items: GoodsReceiptPostingItem[],
    purchaseOrderStatus: PurchaseOrderStatus,
    history: ProcurementStatusHistory,
    purchaseOrderHistory: ProcurementStatusHistory,
  ): Promise<GoodsReceiptPostingResult> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      const lockedReceipt =
        await client.query(
          `
          SELECT id, status
          FROM procurement_goods_receipts
          WHERE id = $1
          FOR UPDATE
          `,
          [goodsReceipt.id],
        );

      if (!lockedReceipt.rows[0]) {
        throw new Error(
          'Goods Receipt was not found',
        );
      }

      for (const item of items) {
        const lockedItem =
          await client.query(
            `
            SELECT
              id,
              purchase_order_id,
              received_quantity
            FROM procurement_purchase_order_items
            WHERE id = $1
            FOR UPDATE
            `,
            [
              item.purchaseOrderItemId,
            ],
          );

        if (!lockedItem.rows[0]) {
          throw new Error(
            'Purchase Order item was not found',
          );
        }

        if (
          lockedItem.rows[0]
            .purchase_order_id !==
          goodsReceipt.purchaseOrderId
        ) {
          throw new Error(
            'Purchase Order item does not belong to the Goods Receipt Purchase Order',
          );
        }

        await client.query(
          `
          UPDATE procurement_purchase_order_items
          SET
            received_quantity = $2,
            updated_at = $3
          WHERE id = $1
          `,
          [
            item.purchaseOrderItemId,
            item.newCumulativeReceivedQuantity,
            goodsReceipt.updatedAt,
          ],
        );
      }

      await client.query(
        `
        UPDATE procurement_purchase_orders
        SET
          status = $2,
          updated_at = $3
        WHERE id = $1
        `,
        [
          goodsReceipt.purchaseOrderId,
          purchaseOrderStatus,
          goodsReceipt.updatedAt,
        ],
      );

      await this.updateGoodsReceipt(
        client,
        goodsReceipt,
      );

      await this.insertHistory(
        client,
        history,
      );

      await this.insertHistory(
        client,
        purchaseOrderHistory,
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

    const posted =
      await this.findById(
        goodsReceipt.id,
      );

    if (!posted) {
      throw new Error(
        'Posted Goods Receipt was not found',
      );
    }

    return {
      goodsReceipt:
        posted,

      purchaseOrderStatus,
    };
  }

  async reverse(
    goodsReceipt: GoodsReceipt,
    items: GoodsReceiptReversalItem[],
    purchaseOrderStatus: PurchaseOrderStatus,
    history: ProcurementStatusHistory,
    purchaseOrderHistory: ProcurementStatusHistory,
  ): Promise<GoodsReceiptReversalResult> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      const lockedReceipt =
        await client.query(
          `
          SELECT id, status
          FROM procurement_goods_receipts
          WHERE id = $1
          FOR UPDATE
          `,
          [goodsReceipt.id],
        );

      if (!lockedReceipt.rows[0]) {
        throw new Error(
          'Goods Receipt was not found',
        );
      }

      for (const item of items) {
        const lockedItem =
          await client.query(
            `
            SELECT
              id,
              purchase_order_id,
              received_quantity
            FROM procurement_purchase_order_items
            WHERE id = $1
            FOR UPDATE
            `,
            [
              item.purchaseOrderItemId,
            ],
          );

        if (!lockedItem.rows[0]) {
          throw new Error(
            'Purchase Order item was not found',
          );
        }

        if (
          lockedItem.rows[0]
            .purchase_order_id !==
          goodsReceipt.purchaseOrderId
        ) {
          throw new Error(
            'Purchase Order item does not belong to the Goods Receipt Purchase Order',
          );
        }

        if (
          Number(
            lockedItem.rows[0]
              .received_quantity,
          ) <
          item.receivedQuantity
        ) {
          throw new Error(
            'Purchase Order received quantity cannot be restored below zero',
          );
        }

        await client.query(
          `
          UPDATE procurement_purchase_order_items
          SET
            received_quantity = $2,
            updated_at = $3
          WHERE id = $1
          `,
          [
            item.purchaseOrderItemId,
            item.restoredCumulativeReceivedQuantity,
            goodsReceipt.updatedAt,
          ],
        );
      }

      await client.query(
        `
        UPDATE procurement_purchase_orders
        SET
          status = $2,
          updated_at = $3
        WHERE id = $1
        `,
        [
          goodsReceipt.purchaseOrderId,
          purchaseOrderStatus,
          goodsReceipt.updatedAt,
        ],
      );

      await this.updateGoodsReceipt(
        client,
        goodsReceipt,
      );

      await this.insertHistory(
        client,
        history,
      );

      await this.insertHistory(
        client,
        purchaseOrderHistory,
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

    const reversed =
      await this.findById(
        goodsReceipt.id,
      );

    if (!reversed) {
      throw new Error(
        'Reversed Goods Receipt was not found',
      );
    }

    return {
      goodsReceipt:
        reversed,

      purchaseOrderStatus,
    };
  }

  private async insertGoodsReceipt(
    client: PoolClient,
    goodsReceipt: GoodsReceipt,
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO procurement_goods_receipts (
        id,
        goods_receipt_number,
        purchase_order_id,
        property_id,
        vendor_id,
        destination_store_id,
        destination_bin_location_id,
        status,
        receipt_date,
        delivery_reference,
        invoice_reference,
        received_by_person_id,
        posted_by_person_id,
        reversed_by_person_id,
        remarks,
        posted_at,
        reversed_at,
        reversal_reason,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,
        $10,$11,$12,$13,$14,$15,$16,
        $17,$18,$19,$20
      )
      `,
      [
        goodsReceipt.id,
        goodsReceipt.goodsReceiptNumber,
        goodsReceipt.purchaseOrderId,
        goodsReceipt.propertyId,
        goodsReceipt.vendorId,
        goodsReceipt.destinationStoreId ?? null,
        goodsReceipt.destinationBinLocationId ?? null,
        goodsReceipt.status,
        goodsReceipt.receiptDate,
        goodsReceipt.deliveryReference ?? null,
        goodsReceipt.invoiceReference ?? null,
        goodsReceipt.receivedByPersonId,
        goodsReceipt.postedByPersonId ?? null,
        goodsReceipt.reversedByPersonId ?? null,
        goodsReceipt.remarks ?? null,
        goodsReceipt.postedAt ?? null,
        goodsReceipt.reversedAt ?? null,
        goodsReceipt.reversalReason ?? null,
        goodsReceipt.createdAt,
        goodsReceipt.updatedAt,
      ],
    );
  }

  private async updateGoodsReceipt(
    client: PoolClient,
    goodsReceipt: GoodsReceipt,
  ): Promise<void> {
    await client.query(
      `
      UPDATE procurement_goods_receipts
      SET
        goods_receipt_number = $2,
        purchase_order_id = $3,
        property_id = $4,
        vendor_id = $5,
        destination_store_id = $6,
        destination_bin_location_id = $7,
        status = $8,
        receipt_date = $9,
        delivery_reference = $10,
        invoice_reference = $11,
        received_by_person_id = $12,
        posted_by_person_id = $13,
        reversed_by_person_id = $14,
        remarks = $15,
        posted_at = $16,
        reversed_at = $17,
        reversal_reason = $18,
        updated_at = $19
      WHERE id = $1
      `,
      [
        goodsReceipt.id,
        goodsReceipt.goodsReceiptNumber,
        goodsReceipt.purchaseOrderId,
        goodsReceipt.propertyId,
        goodsReceipt.vendorId,
        goodsReceipt.destinationStoreId ?? null,
        goodsReceipt.destinationBinLocationId ?? null,
        goodsReceipt.status,
        goodsReceipt.receiptDate,
        goodsReceipt.deliveryReference ?? null,
        goodsReceipt.invoiceReference ?? null,
        goodsReceipt.receivedByPersonId,
        goodsReceipt.postedByPersonId ?? null,
        goodsReceipt.reversedByPersonId ?? null,
        goodsReceipt.remarks ?? null,
        goodsReceipt.postedAt ?? null,
        goodsReceipt.reversedAt ?? null,
        goodsReceipt.reversalReason ?? null,
        goodsReceipt.updatedAt,
      ],
    );
  }

  private async replaceItems(
    client: PoolClient,
    goodsReceiptId: string,
    items: GoodsReceiptItem[],
  ): Promise<void> {
    await client.query(
      `
      DELETE FROM procurement_goods_receipt_items
      WHERE goods_receipt_id = $1
      `,
      [goodsReceiptId],
    );

    for (const item of items) {
      await client.query(
        `
        INSERT INTO procurement_goods_receipt_items (
          id,
          goods_receipt_id,
          purchase_order_item_id,
          ordered_quantity,
          previously_received_quantity,
          received_quantity,
          accepted_quantity,
          rejected_quantity,
          status,
          rejection_reason,
          remarks,
          created_at,
          updated_at
        )
        VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,
          $9,$10,$11,$12,$13
        )
        `,
        [
          item.id,
          item.goodsReceiptId,
          item.purchaseOrderItemId,
          item.orderedQuantity,
          item.previouslyReceivedQuantity,
          item.receivedQuantity,
          item.acceptedQuantity,
          item.rejectedQuantity,
          item.status,
          item.rejectionReason ?? null,
          item.remarks ?? null,
          item.createdAt,
          item.updatedAt,
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

  private mapGoodsReceipt(
    row: any,
  ): GoodsReceipt {
    return {
      id:
        row.id,

      goodsReceiptNumber:
        row.goods_receipt_number,

      purchaseOrderId:
        row.purchase_order_id,

      propertyId:
        row.property_id,

      vendorId:
        row.vendor_id,

      destinationStoreId:
        row.destination_store_id ??
        undefined,

      destinationBinLocationId:
        row.destination_bin_location_id ??
        undefined,

      status:
        row.status,

      receiptDate:
        new Date(
          row.receipt_date,
        ),

      deliveryReference:
        row.delivery_reference ??
        undefined,

      invoiceReference:
        row.invoice_reference ??
        undefined,

      receivedByPersonId:
        row.received_by_person_id,

      postedByPersonId:
        row.posted_by_person_id ??
        undefined,

      reversedByPersonId:
        row.reversed_by_person_id ??
        undefined,

      remarks:
        row.remarks ??
        undefined,

      postedAt:
        row.posted_at
          ? new Date(row.posted_at)
          : undefined,

      reversedAt:
        row.reversed_at
          ? new Date(row.reversed_at)
          : undefined,

      reversalReason:
        row.reversal_reason ??
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

  private mapGoodsReceiptItem(
    row: any,
  ): GoodsReceiptItem {
    return {
      id:
        row.id,

      goodsReceiptId:
        row.goods_receipt_id,

      purchaseOrderItemId:
        row.purchase_order_item_id,

      orderedQuantity:
        Number(
          row.ordered_quantity,
        ),

      previouslyReceivedQuantity:
        Number(
          row.previously_received_quantity,
        ),

      receivedQuantity:
        Number(
          row.received_quantity,
        ),

      acceptedQuantity:
        Number(
          row.accepted_quantity,
        ),

      rejectedQuantity:
        Number(
          row.rejected_quantity,
        ),

      status:
        row.status,

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
