import {
  Test,
} from '@nestjs/testing';

import {
  randomUUID,
} from 'crypto';

import {
  Pool,
} from 'pg';

import {
  AppModule,
} from '../../src/app.module';

import {
  POSTGRES_POOL,
} from '../../src/database/postgres';

import {
  PROCUREMENT_GOODS_RECEIPT_REPOSITORY,
  GoodsReceiptRepository,
} from '../../src/core/procurement/repositories/procurement-goods-receipt.repository';

import {
  GoodsReceiptStatus,
  PurchaseOrderStatus,
} from '../../src/core/procurement/types/procurement.types';

describe(
  'Procurement Batch receipt persistence',
  () => {
    let app: any;
    let pool: Pool;

    let repository:
      GoodsReceiptRepository;

    const propertyId =
      randomUUID();

    const personId =
      randomUUID();

    const vendorId =
      randomUUID();

    const inventoryItemId =
      randomUUID();

    const batchId =
      randomUUID();

    const purchaseOrderId =
      randomUUID();

    const purchaseOrderItemId =
      randomUUID();

    const goodsReceiptId =
      randomUUID();

    const goodsReceiptItemId =
      randomUUID();

    const categoryId =
      '33100000-0000-4000-8000-000000000001';

    const unitId =
      '33000000-0000-4000-8000-000000000001';

    beforeAll(
      async () => {
        const moduleRef =
          await Test
            .createTestingModule({
              imports: [
                AppModule,
              ],
            })
            .compile();

        app =
          moduleRef
            .createNestApplication();

        await app.init();

        pool =
          app.get(
            POSTGRES_POOL,
          );

        repository =
          app.get(
            PROCUREMENT_GOODS_RECEIPT_REPOSITORY,
          );

        await pool.query(
          `
          INSERT INTO persons (
            id,
            display_name,
            status
          )
          VALUES (
            $1,
            'Procurement Batch Persistence Tester',
            'ACTIVE'
          )
          `,
          [
            personId,
          ],
        );

        await pool.query(
          `
          INSERT INTO properties (
            id,
            name,
            code,
            property_type,
            city,
            state,
            country,
            is_active
          )
          VALUES (
            $1,$2,$3,
            'BOUTIQUE_ROOMS',
            'Chengalpattu',
            'Tamil Nadu',
            'India',
            TRUE
          )
          `,
          [
            propertyId,
            'Batch Receipt Test Property',
            `PBR-${Date.now()}`,
          ],
        );

        await pool.query(
          `
          INSERT INTO vendors (
            id,
            vendor_number,
            legal_name,
            display_name,
            vendor_type,
            status,
            country,
            metadata,
            created_by_person_id,
            created_at,
            updated_at
          )
          VALUES (
            $1,$2,$3,$4,
            'COMPANY',
            'ACTIVE',
            'India',
            '{}'::JSONB,
            $5,
            NOW(),
            NOW()
          )
          `,
          [
            vendorId,
            `VEN-PBR-${Date.now()}`,
            'Batch Persistence Vendor Private Limited',
            'Batch Persistence Vendor',
            personId,
          ],
        );

        await pool.query(
          `
          INSERT INTO inventory_items (
            id,
            sku,
            name,
            category_id,
            unit_of_measure_id,
            item_type,
            currency,
            is_batch_tracked,
            is_active
          )
          VALUES (
            $1,$2,$3,$4,$5,
            'CONSUMABLE',
            'INR',
            TRUE,
            TRUE
          )
          `,
          [
            inventoryItemId,
            `PBR-ITEM-${Date.now()}`,
            'Batch Persistence Item',
            categoryId,
            unitId,
          ],
        );

        await pool.query(
          `
          INSERT INTO inventory_batches (
            id,
            item_id,
            batch_number,
            manufacturer_batch_number,
            manufacture_date,
            expiry_date,
            status,
            metadata,
            created_by_person_id
          )
          VALUES (
            $1,$2,$3,$4,
            DATE '2026-07-01',
            DATE '2027-07-01',
            'ACTIVE',
            '{}'::JSONB,
            $5
          )
          `,
          [
            batchId,
            inventoryItemId,
            `PBR-BATCH-${Date.now()}`,
            'PBR-MFG-001',
            personId,
          ],
        );

        await pool.query(
          `
          INSERT INTO procurement_purchase_orders (
            id,
            purchase_order_number,
            title,
            property_id,
            vendor_id,
            status,
            order_date,
            subtotal,
            discount_amount,
            tax_amount,
            freight_amount,
            total_amount,
            currency,
            created_by_person_id
          )
          VALUES (
            $1,$2,$3,$4,$5,
            'ACKNOWLEDGED',
            CURRENT_DATE,
            100,
            0,
            0,
            0,
            100,
            'INR',
            $6
          )
          `,
          [
            purchaseOrderId,
            `PO-PBR-${Date.now()}`,
            'Batch Receipt Persistence PO',
            propertyId,
            vendorId,
            personId,
          ],
        );

        await pool.query(
          `
          INSERT INTO procurement_purchase_order_items (
            id,
            purchase_order_id,
            line_number,
            item_type,
            description,
            ordered_quantity,
            received_quantity,
            unit,
            unit_price,
            discount_amount,
            tax_rate,
            tax_amount,
            line_total,
            inventory_item_id
          )
          VALUES (
            $1,$2,1,
            'GOODS',
            'Batch Persistence Item',
            10,
            0,
            'EA',
            10,
            0,
            0,
            0,
            100,
            $3
          )
          `,
          [
            purchaseOrderItemId,
            purchaseOrderId,
            inventoryItemId,
          ],
        );

        await pool.query(
          `
          INSERT INTO procurement_goods_receipts (
            id,
            goods_receipt_number,
            purchase_order_id,
            property_id,
            vendor_id,
            status,
            receipt_date,
            received_by_person_id
          )
          VALUES (
            $1,$2,$3,$4,$5,
            'DRAFT',
            CURRENT_DATE,
            $6
          )
          `,
          [
            goodsReceiptId,
            `GRN-PBR-${Date.now()}`,
            purchaseOrderId,
            propertyId,
            vendorId,
            personId,
          ],
        );

        await pool.query(
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
            batch_number,
            manufacturer_batch_number,
            manufacture_date,
            expiry_date
          )
          VALUES (
            $1,$2,$3,
            10,
            0,
            5,
            5,
            0,
            'ACCEPTED',
            $4,
            'PBR-MFG-001',
            DATE '2026-07-01',
            DATE '2027-07-01'
          )
          `,
          [
            goodsReceiptItemId,
            goodsReceiptId,
            purchaseOrderItemId,
            `PBR-BATCH-${Date.now()}`,
          ],
        );
      },
    );

    afterAll(
      async () => {
        if (pool) {
          await pool.query(
            `
            DELETE FROM procurement_status_history
            WHERE entity_id IN (
              $1,
              $2
            )
            `,
            [
              goodsReceiptId,
              purchaseOrderId,
            ],
          );

          await pool.query(
            `
            DELETE FROM procurement_goods_receipts
            WHERE id = $1
            `,
            [
              goodsReceiptId,
            ],
          );

          await pool.query(
            `
            DELETE FROM procurement_purchase_orders
            WHERE id = $1
            `,
            [
              purchaseOrderId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_batches
            WHERE id = $1
            `,
            [
              batchId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_items
            WHERE id = $1
            `,
            [
              inventoryItemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM vendors
            WHERE id = $1
            `,
            [
              vendorId,
            ],
          );

          await pool.query(
            `
            DELETE FROM properties
            WHERE id = $1
            `,
            [
              propertyId,
            ],
          );

          await pool.query(
            `
            DELETE FROM persons
            WHERE id = $1
            `,
            [
              personId,
            ],
          );
        }

        if (app) {
          await app.close();
        }
      },
    );

    it(
      'persists the resolved Batch reference while posting the Goods Receipt',
      async () => {
        const current =
          await repository.findById(
            goodsReceiptId,
          );

        expect(current).not.toBeNull();

        const now =
          new Date();

        const result =
          await repository.post(
            {
              ...current!,

              status:
                GoodsReceiptStatus
                  .POSTED,

              postedByPersonId:
                personId,

              postedAt:
                now,

              updatedAt:
                now,
            },

            [
              {
                goodsReceiptItemId,

                purchaseOrderItemId,

                receivedQuantity:
                  5,

                newCumulativeReceivedQuantity:
                  5,

                batchId,
              },
            ],

            PurchaseOrderStatus
              .PARTIALLY_RECEIVED,

            {
              id:
                randomUUID(),

              entityType:
                'GOODS_RECEIPT',

              entityId:
                goodsReceiptId,

              fromStatus:
                GoodsReceiptStatus
                  .DRAFT,

              toStatus:
                GoodsReceiptStatus
                  .POSTED,

              changedByPersonId:
                personId,

              createdAt:
                now,
            },

            {
              id:
                randomUUID(),

              entityType:
                'PURCHASE_ORDER',

              entityId:
                purchaseOrderId,

              fromStatus:
                PurchaseOrderStatus
                  .ACKNOWLEDGED,

              toStatus:
                PurchaseOrderStatus
                  .PARTIALLY_RECEIVED,

              changedByPersonId:
                personId,

              createdAt:
                now,
            },
          );

        expect(
          result.goodsReceipt.items[0]
            .batchId,
        ).toBe(
          batchId,
        );

        const row =
          await pool.query(
            `
            SELECT
              batch_id,
              batch_number,
              manufacturer_batch_number,
              manufacture_date,
              expiry_date
            FROM procurement_goods_receipt_items
            WHERE id = $1
            `,
            [
              goodsReceiptItemId,
            ],
          );

        expect(
          row.rows[0].batch_id,
        ).toBe(
          batchId,
        );

        expect(
          row.rows[0].batch_number,
        ).toBeTruthy();

        expect(
          row.rows[0]
            .manufacturer_batch_number,
        ).toBe(
          'PBR-MFG-001',
        );
      },
    );
  },
);
