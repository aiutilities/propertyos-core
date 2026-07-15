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
  ProcurementStatusHistory,
  PurchaseOrder,
  PurchaseOrderItem,
} from '../types/procurement.types';

import {
  PurchaseOrderDetails,
  PurchaseOrderFilters,
  PurchaseOrderRepository,
} from './procurement-purchase-order.repository';

@Injectable()
export class PostgresProcurementPurchaseOrderRepository
  implements PurchaseOrderRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(
    purchaseOrder: PurchaseOrder,
    items: PurchaseOrderItem[],
  ): Promise<PurchaseOrderDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await client.query(
        `
        INSERT INTO procurement_purchase_orders (
          id,
          purchase_order_number,
          property_id,
          vendor_id,
          purchase_request_id,
          rfq_id,
          quotation_id,
          vendor_contract_id,
          title,
          description,
          status,
          order_date,
          expected_delivery_date,
          subtotal,
          discount_amount,
          tax_amount,
          freight_amount,
          total_amount,
          currency,
          payment_terms,
          delivery_terms,
          shipping_address,
          billing_address,
          created_by_person_id,
          approved_by_person_id,
          issued_by_person_id,
          acknowledged_by_person_id,
          cancelled_by_person_id,
          approved_at,
          issued_at,
          acknowledged_at,
          closed_at,
          cancelled_at,
          cancellation_reason,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36
        )
        `,
        [
          purchaseOrder.id,
          purchaseOrder.purchaseOrderNumber,
          purchaseOrder.propertyId,
          purchaseOrder.vendorId,
          purchaseOrder.purchaseRequestId ?? null,
          purchaseOrder.rfqId ?? null,
          purchaseOrder.quotationId ?? null,
          purchaseOrder.vendorContractId ?? null,
          purchaseOrder.title,
          purchaseOrder.description ?? null,
          purchaseOrder.status,
          purchaseOrder.orderDate,
          purchaseOrder.expectedDeliveryDate ?? null,
          purchaseOrder.subtotal,
          purchaseOrder.discountAmount,
          purchaseOrder.taxAmount,
          purchaseOrder.freightAmount,
          purchaseOrder.totalAmount,
          purchaseOrder.currency,
          purchaseOrder.paymentTerms ?? null,
          purchaseOrder.deliveryTerms ?? null,
          purchaseOrder.shippingAddress ?? null,
          purchaseOrder.billingAddress ?? null,
          purchaseOrder.createdByPersonId,
          purchaseOrder.approvedByPersonId ?? null,
          purchaseOrder.issuedByPersonId ?? null,
          purchaseOrder.acknowledgedByPersonId ?? null,
          purchaseOrder.cancelledByPersonId ?? null,
          purchaseOrder.approvedAt ?? null,
          purchaseOrder.issuedAt ?? null,
          purchaseOrder.acknowledgedAt ?? null,
          purchaseOrder.closedAt ?? null,
          purchaseOrder.cancelledAt ?? null,
          purchaseOrder.cancellationReason ?? null,
          purchaseOrder.createdAt,
          purchaseOrder.updatedAt,
        ],
      );

      await this.replaceItems(
        client,
        purchaseOrder.id,
        items,
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
        purchaseOrder.id,
      );

    if (!created) {
      throw new Error(
        'Purchase Order was not created',
      );
    }

    return created;
  }

  async findById(
    id: string,
  ): Promise<
    PurchaseOrderDetails | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_purchase_orders
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
      ...this.mapPurchaseOrder(
        result.rows[0],
      ),
      items,
      history,
    };
  }

  async findByQuotationId(
    quotationId: string,
  ): Promise<
    PurchaseOrder | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_purchase_orders
        WHERE quotation_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [quotationId],
      );

    return result.rows[0]
      ? this.mapPurchaseOrder(
          result.rows[0],
        )
      : null;
  }

  async list(
    filters:
      PurchaseOrderFilters = {},
  ): Promise<PurchaseOrder[]> {
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

    if (filters.quotationId) {
      addCondition(
        'quotation_id',
        filters.quotationId,
      );
    }

    if (filters.rfqId) {
      addCondition(
        'rfq_id',
        filters.rfqId,
      );
    }

    if (filters.purchaseRequestId) {
      addCondition(
        'purchase_request_id',
        filters.purchaseRequestId,
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
          purchase_order_number
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
        FROM procurement_purchase_orders
        ${where}
        ORDER BY created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapPurchaseOrder(row),
    );
  }

  async update(
    purchaseOrder: PurchaseOrder,
    items?: PurchaseOrderItem[],
  ): Promise<PurchaseOrderDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await client.query(
        `
        UPDATE procurement_purchase_orders
        SET
          purchase_order_number = $2,
          property_id = $3,
          vendor_id = $4,
          purchase_request_id = $5,
          rfq_id = $6,
          quotation_id = $7,
          vendor_contract_id = $8,
          title = $9,
          description = $10,
          status = $11,
          order_date = $12,
          expected_delivery_date = $13,
          subtotal = $14,
          discount_amount = $15,
          tax_amount = $16,
          freight_amount = $17,
          total_amount = $18,
          currency = $19,
          payment_terms = $20,
          delivery_terms = $21,
          shipping_address = $22,
          billing_address = $23,
          created_by_person_id = $24,
          approved_by_person_id = $25,
          issued_by_person_id = $26,
          acknowledged_by_person_id = $27,
          cancelled_by_person_id = $28,
          approved_at = $29,
          issued_at = $30,
          acknowledged_at = $31,
          closed_at = $32,
          cancelled_at = $33,
          cancellation_reason = $34,
          updated_at = $35
        WHERE id = $1
        `,
        [
          purchaseOrder.id,
          purchaseOrder.purchaseOrderNumber,
          purchaseOrder.propertyId,
          purchaseOrder.vendorId,
          purchaseOrder.purchaseRequestId ?? null,
          purchaseOrder.rfqId ?? null,
          purchaseOrder.quotationId ?? null,
          purchaseOrder.vendorContractId ?? null,
          purchaseOrder.title,
          purchaseOrder.description ?? null,
          purchaseOrder.status,
          purchaseOrder.orderDate,
          purchaseOrder.expectedDeliveryDate ?? null,
          purchaseOrder.subtotal,
          purchaseOrder.discountAmount,
          purchaseOrder.taxAmount,
          purchaseOrder.freightAmount,
          purchaseOrder.totalAmount,
          purchaseOrder.currency,
          purchaseOrder.paymentTerms ?? null,
          purchaseOrder.deliveryTerms ?? null,
          purchaseOrder.shippingAddress ?? null,
          purchaseOrder.billingAddress ?? null,
          purchaseOrder.createdByPersonId,
          purchaseOrder.approvedByPersonId ?? null,
          purchaseOrder.issuedByPersonId ?? null,
          purchaseOrder.acknowledgedByPersonId ?? null,
          purchaseOrder.cancelledByPersonId ?? null,
          purchaseOrder.approvedAt ?? null,
          purchaseOrder.issuedAt ?? null,
          purchaseOrder.acknowledgedAt ?? null,
          purchaseOrder.closedAt ?? null,
          purchaseOrder.cancelledAt ?? null,
          purchaseOrder.cancellationReason ?? null,
          purchaseOrder.updatedAt,
        ],
      );

      if (items) {
        await this.replaceItems(
          client,
          purchaseOrder.id,
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
        purchaseOrder.id,
      );

    if (!updated) {
      throw new Error(
        'Purchase Order was not updated',
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

  private async replaceItems(
    client: PoolClient,
    purchaseOrderId: string,
    items: PurchaseOrderItem[],
  ): Promise<void> {
    await client.query(
      `
      DELETE FROM procurement_purchase_order_items
      WHERE purchase_order_id = $1
      `,
      [purchaseOrderId],
    );

    for (const item of items) {
      await client.query(
        `
        INSERT INTO procurement_purchase_order_items (
          id,
          purchase_order_id,
          quotation_item_id,
          purchase_request_item_id,
          inventory_item_id,
          line_number,
          item_type,
          item_code,
          description,
          ordered_quantity,
          received_quantity,
          unit,
          unit_price,
          discount_amount,
          tax_rate,
          tax_amount,
          line_total,
          created_at,
          updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
        `,
        [
          item.id,
          item.purchaseOrderId,
          item.quotationItemId ?? null,
          item.purchaseRequestItemId ?? null,
          item.inventoryItemId ?? null,
          item.lineNumber,
          item.itemType,
          item.itemCode ?? null,
          item.description,
          item.orderedQuantity,
          item.receivedQuantity,
          item.unit,
          item.unitPrice,
          item.discountAmount,
          item.taxRate,
          item.taxAmount,
          item.lineTotal,
          item.createdAt,
          item.updatedAt,
        ],
      );
    }
  }

  private async listItems(
    purchaseOrderId: string,
  ): Promise<PurchaseOrderItem[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_purchase_order_items
        WHERE purchase_order_id = $1
        ORDER BY line_number ASC
        `,
        [purchaseOrderId],
      );

    return result.rows.map(
      (row) =>
        this.mapPurchaseOrderItem(row),
    );
  }

  private async listHistory(
    entityId: string,
  ): Promise<ProcurementStatusHistory[]> {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_status_history
        WHERE entity_type =
          'PURCHASE_ORDER'
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

  private mapPurchaseOrder(
    row: any,
  ): PurchaseOrder {
    return {
      id:
        row.id,

      purchaseOrderNumber:
        row.purchase_order_number,

      propertyId:
        row.property_id,

      vendorId:
        row.vendor_id,

      purchaseRequestId:
        row.purchase_request_id ??
        undefined,

      rfqId:
        row.rfq_id ??
        undefined,

      quotationId:
        row.quotation_id ??
        undefined,

      vendorContractId:
        row.vendor_contract_id ??
        undefined,

      title:
        row.title,

      description:
        row.description ??
        undefined,

      status:
        row.status,

      orderDate:
        row.order_date,

      expectedDeliveryDate:
        row.expected_delivery_date ??
        undefined,

      subtotal:
        Number(
          row.subtotal,
        ),

      discountAmount:
        Number(
          row.discount_amount,
        ),

      taxAmount:
        Number(
          row.tax_amount,
        ),

      freightAmount:
        Number(
          row.freight_amount,
        ),

      totalAmount:
        Number(
          row.total_amount,
        ),

      currency:
        row.currency,

      paymentTerms:
        row.payment_terms ??
        undefined,

      deliveryTerms:
        row.delivery_terms ??
        undefined,

      shippingAddress:
        row.shipping_address ??
        undefined,

      billingAddress:
        row.billing_address ??
        undefined,

      createdByPersonId:
        row.created_by_person_id,

      approvedByPersonId:
        row.approved_by_person_id ??
        undefined,

      issuedByPersonId:
        row.issued_by_person_id ??
        undefined,

      acknowledgedByPersonId:
        row.acknowledged_by_person_id ??
        undefined,

      cancelledByPersonId:
        row.cancelled_by_person_id ??
        undefined,

      approvedAt:
        row.approved_at ??
        undefined,

      issuedAt:
        row.issued_at ??
        undefined,

      acknowledgedAt:
        row.acknowledged_at ??
        undefined,

      closedAt:
        row.closed_at ??
        undefined,

      cancelledAt:
        row.cancelled_at ??
        undefined,

      cancellationReason:
        row.cancellation_reason ??
        undefined,

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,

    };
  }

  private mapPurchaseOrderItem(
    row: any,
  ): PurchaseOrderItem {
    return {
      id:
        row.id,

      purchaseOrderId:
        row.purchase_order_id,

      quotationItemId:
        row.quotation_item_id ??
        undefined,

      purchaseRequestItemId:
        row.purchase_request_item_id ??
        undefined,

      inventoryItemId:
        row.inventory_item_id ??
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

      orderedQuantity:
        Number(
          row.ordered_quantity,
        ),

      receivedQuantity:
        Number(
          row.received_quantity,
        ),

      unit:
        row.unit,

      unitPrice:
        Number(
          row.unit_price,
        ),

      discountAmount:
        Number(
          row.discount_amount,
        ),

      taxRate:
        Number(
          row.tax_rate,
        ),

      taxAmount:
        Number(
          row.tax_amount,
        ),

      lineTotal:
        Number(
          row.line_total,
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
