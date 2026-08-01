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
  ProcurementQuotation,
  ProcurementQuotationItem,
  ProcurementStatusHistory,
} from '../types/procurement.types';

import {
  ProcurementQuotationDetails,
  ProcurementQuotationFilters,
  ProcurementQuotationRepository,
} from './procurement-quotation.repository';

@Injectable()
export class PostgresProcurementQuotationRepository
  implements ProcurementQuotationRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async create(
    quotation: ProcurementQuotation,
    items: ProcurementQuotationItem[],
  ): Promise<ProcurementQuotationDetails> {
    const client =
      await this.pool.connect();

    try {
      await client.query(
        'BEGIN',
      );

      await this.insertQuotation(
        client,
        quotation,
      );

      await this.replaceItems(
        client,
        quotation.id,
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
        quotation.id,
      );

    if (!created) {
      throw new Error(
        'Quotation was not created',
      );
    }

    return created;
  }

  async findById(
    id: string,
  ): Promise<
    ProcurementQuotationDetails | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_quotations
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
      history,
    ] =
      await Promise.all([
        this.listItems(id),
        this.listHistory(id),
      ]);

    return {
      ...this.mapQuotation(row),
      items,
      history,
    };
  }

  async findByRfqAndVendor(
    rfqId: string,
    vendorId: string,
  ): Promise<
    ProcurementQuotation | null
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_quotations
        WHERE rfq_id = $1
          AND vendor_id = $2
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [
          rfqId,
          vendorId,
        ],
      );

    return result.rows[0]
      ? this.mapQuotation(
          result.rows[0],
        )
      : null;
  }

  async list(
    filters:
      ProcurementQuotationFilters = {},
  ): Promise<
    ProcurementQuotation[]
  > {
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

    if (filters.rfqId) {
      addCondition(
        'q.rfq_id',
        filters.rfqId,
      );
    }

    if (filters.vendorId) {
      addCondition(
        'q.vendor_id',
        filters.vendorId,
      );
    }

    if (filters.status) {
      addCondition(
        'q.status',
        filters.status,
      );
    }

    if (filters.propertyId) {
      values.push(
        filters.propertyId,
      );

      conditions.push(
        `EXISTS (
          SELECT 1
          FROM procurement_rfqs r
          WHERE r.id = q.rfq_id
            AND r.property_id =
              $${values.length}
        )`,
      );
    }

    if (filters.search) {
      values.push(
        `%${filters.search}%`,
      );

      conditions.push(
        `(
          q.quotation_number
            ILIKE $${values.length}
          OR q.vendor_reference
            ILIKE $${values.length}
          OR q.notes
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
        SELECT q.*
        FROM procurement_quotations q
        ${where}
        ORDER BY
          q.created_at DESC
        `,
        values,
      );

    return result.rows.map(
      (row) =>
        this.mapQuotation(row),
    );
  }

  async update(
    quotation: ProcurementQuotation,
    items?: ProcurementQuotationItem[],
  ): Promise<
    ProcurementQuotationDetails
  > {
    const client =
      await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query(
        `
        UPDATE procurement_quotations
        SET
          quotation_number = $2,
          rfq_id = $3,
          vendor_id = $4,
          status = $5,
          vendor_reference = $6,
          quotation_date = $7,
          valid_until = $8,
          delivery_days = $9,
          subtotal = $10,
          discount_amount = $11,
          tax_amount = $12,
          freight_amount = $13,
          total_amount = $14,
          currency = $15,
          payment_terms = $16,
          delivery_terms = $17,
          notes = $18,
          submitted_at = $19,
          selected_at = $20,
          rejected_at = $21,
          withdrawn_at = $22,
          expired_at = $23,
          updated_at = $24
        WHERE id = $1
        `,
        [
          quotation.id,
          quotation.quotationNumber,
          quotation.rfqId,
          quotation.vendorId,
          quotation.status,
          quotation.vendorReference ??
            null,
          quotation.quotationDate,
          quotation.validUntil,
          quotation.deliveryDays ??
            null,
          quotation.subtotal,
          quotation.discountAmount,
          quotation.taxAmount,
          quotation.freightAmount,
          quotation.totalAmount,
          quotation.currency,
          quotation.paymentTerms ??
            null,
          quotation.deliveryTerms ??
            null,
          quotation.notes ??
            null,
          quotation.submittedAt ??
            null,
          quotation.selectedAt ??
            null,
          quotation.rejectedAt ??
            null,
          quotation.withdrawnAt ??
            null,
          quotation.expiredAt ??
            null,
          quotation.updatedAt,
        ],
      );

      if (items) {
        await this.replaceItems(
          client,
          quotation.id,
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
        quotation.id,
      );

    if (!updated) {
      throw new Error(
        'Quotation was not updated',
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
          history.remarks ??
            null,
          history.createdAt,
        ],
      );

    return this.mapHistory(
      result.rows[0],
    );
  }

  async listRfqItemIds(
    rfqId: string,
  ): Promise<string[]> {
    const result =
      await this.pool.query(
        `
        SELECT id
        FROM procurement_rfq_items
        WHERE rfq_id = $1
        ORDER BY line_number ASC
        `,
        [rfqId],
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

  async isVendorInvited(
    rfqId: string,
    vendorId: string,
  ): Promise<boolean> {
    const result =
      await this.pool.query(
        `
        SELECT 1
        FROM procurement_rfq_vendors
        WHERE rfq_id = $1
          AND vendor_id = $2
        LIMIT 1
        `,
        [
          rfqId,
          vendorId,
        ],
      );

    return result.rowCount === 1;
  }

  private async insertQuotation(
    client: PoolClient,
    quotation: ProcurementQuotation,
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO procurement_quotations (
        id,
        quotation_number,
        rfq_id,
        vendor_id,
        status,
        vendor_reference,
        quotation_date,
        valid_until,
        delivery_days,
        subtotal,
        discount_amount,
        tax_amount,
        freight_amount,
        total_amount,
        currency,
        payment_terms,
        delivery_terms,
        notes,
        submitted_at,
        selected_at,
        rejected_at,
        withdrawn_at,
        expired_at,
        created_at,
        updated_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13,$14,$15,
        $16,$17,$18,$19,$20,$21,$22,
        $23,$24,$25
      )
      `,
      [
        quotation.id,
        quotation.quotationNumber,
        quotation.rfqId,
        quotation.vendorId,
        quotation.status,
        quotation.vendorReference ??
          null,
        quotation.quotationDate,
        quotation.validUntil,
        quotation.deliveryDays ??
          null,
        quotation.subtotal,
        quotation.discountAmount,
        quotation.taxAmount,
        quotation.freightAmount,
        quotation.totalAmount,
        quotation.currency,
        quotation.paymentTerms ??
          null,
        quotation.deliveryTerms ??
          null,
        quotation.notes ??
          null,
        quotation.submittedAt ??
          null,
        quotation.selectedAt ??
          null,
        quotation.rejectedAt ??
          null,
        quotation.withdrawnAt ??
          null,
        quotation.expiredAt ??
          null,
        quotation.createdAt,
        quotation.updatedAt,
      ],
    );
  }

  private async replaceItems(
    client: PoolClient,
    quotationId: string,
    items: ProcurementQuotationItem[],
  ): Promise<void> {
    await client.query(
      `
      DELETE FROM procurement_quotation_items
      WHERE quotation_id = $1
      `,
      [quotationId],
    );

    for (
      const item of items
    ) {
      await client.query(
        `
        INSERT INTO procurement_quotation_items (
          id,
          quotation_id,
          rfq_item_id,
          line_number,
          description,
          quantity,
          unit,
          unit_price,
          discount_amount,
          tax_rate,
          tax_amount,
          line_total,
          delivery_days,
          remarks,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          COALESCE(
            $5,
            (
              SELECT description
              FROM procurement_rfq_items
              WHERE id = $3
            )
          ),
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16
        )
        `,
        [
          item.id,
          item.quotationId,
          item.rfqItemId,
          item.lineNumber,
          item.description ??
            null,
          item.quantity,
          item.unit,
          item.unitPrice,
          item.discountAmount,
          item.taxRate,
          item.taxAmount,
          item.lineTotal,
          item.deliveryDays ??
            null,
          item.remarks ??
            null,
          item.createdAt,
          item.updatedAt,
        ],
      );
    }
  }

  private async listItems(
    quotationId: string,
  ): Promise<
    ProcurementQuotationItem[]
  > {
    const result =
      await this.pool.query(
        `
        SELECT *
        FROM procurement_quotation_items
        WHERE quotation_id = $1
        ORDER BY line_number ASC
        `,
        [quotationId],
      );

    return result.rows.map(
      (row) =>
        this.mapItem(row),
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
        WHERE entity_type =
          'QUOTATION'
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

  private mapQuotation(
    row: any,
  ): ProcurementQuotation {
    return {
      id:
        row.id,

      quotationNumber:
        row.quotation_number,

      rfqId:
        row.rfq_id,

      vendorId:
        row.vendor_id,

      status:
        row.status,

      vendorReference:
        row.vendor_reference ??
        undefined,

      quotationDate:
        row.quotation_date,

      validUntil:
        row.valid_until,

      deliveryDays:
        row.delivery_days ??
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

      notes:
        row.notes ??
        undefined,

      submittedAt:
        row.submitted_at ??
        undefined,

      selectedAt:
        row.selected_at ??
        undefined,

      rejectedAt:
        row.rejected_at ??
        undefined,

      withdrawnAt:
        row.withdrawn_at ??
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
  ): ProcurementQuotationItem {
    return {
      id:
        row.id,

      quotationId:
        row.quotation_id,

      rfqItemId:
        row.rfq_item_id,

      lineNumber:
        Number(
          row.line_number,
        ),

      description:
        row.description ??
        undefined,

      quantity:
        Number(
          row.quantity,
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

      deliveryDays:
        row.delivery_days ??
        undefined,

      remarks:
        row.remarks ??
        undefined,

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
