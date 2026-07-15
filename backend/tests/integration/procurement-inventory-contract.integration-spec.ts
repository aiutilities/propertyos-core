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

describe(
  'Procurement and Inventory contract foundation',
  () => {
    let app: any;
    let pool: Pool;

    const propertyId =
      randomUUID();

    const otherPropertyId =
      randomUUID();

    const personId =
      randomUUID();

    const vendorId =
      randomUUID();

    const purchaseOrderId =
      randomUUID();

    const purchaseOrderItemId =
      randomUUID();

    const goodsReceiptId =
      randomUUID();

    const inventoryItemId =
      randomUUID();

    const storeId =
      randomUUID();

    const otherStoreId =
      randomUUID();

    const binId =
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

        await pool.query(
          `
          INSERT INTO persons (
            id,
            display_name,
            status
          )
          VALUES (
            $1,
            'Procurement Inventory Contract Tester',
            'ACTIVE'
          )
          `,
          [
            personId,
          ],
        );

        for (
          const [
            id,
            code,
          ]
          of [
            [
              propertyId,
              `PIC-A-${Date.now()}`,
            ],
            [
              otherPropertyId,
              `PIC-B-${Date.now()}`,
            ],
          ]
        ) {
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
              id,
              `Property ${code}`,
              code,
            ],
          );
        }
        await pool.query(
          `
          INSERT INTO vendors (
            id,
            vendor_number,
            legal_name,
            display_name,
            vendor_type,
            status,
            email,
            phone,
            country,
            metadata,
            created_by_person_id,
            created_at,
            updated_at
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7,
            $8,$9,$10,$11,NOW(),NOW()
          )
          `,
          [
            vendorId,
            `VEN-${String(
              Date.now(),
            ).slice(-8)}`,
            'Contract Test Vendor Private Limited',
            'Contract Test Vendor',
            'COMPANY',
            'ACTIVE',
            `vendor-${Date.now()}@propertyos.test`,
            '9876543210',
            'India',
            JSON.stringify({
              source:
                'procurement-inventory-contract-test',
            }),
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
            is_active
          )
          VALUES (
            $1,$2,$3,$4,$5,
            'CONSUMABLE',
            'INR',
            TRUE
          )
          `,
          [
            inventoryItemId,
            `PIC-${Date.now()}`,
            'Procurement Contract Inventory Item',
            categoryId,
            unitId,
          ],
        );

        await pool.query(
          `
          INSERT INTO inventory_stores (
            id,
            store_code,
            name,
            property_id,
            is_active
          )
          VALUES
            (
              $1,$2,$3,$4,TRUE
            ),
            (
              $5,$6,$7,$8,TRUE
            )
          `,
          [
            storeId,
            `MAIN-${String(
              Date.now(),
            ).slice(-6)}`,
            'Main Contract Store',
            propertyId,

            otherStoreId,
            `OTHER-${String(
              Date.now(),
            ).slice(-6)}`,
            'Other Property Store',
            otherPropertyId,
          ],
        );

        await pool.query(
          `
          INSERT INTO inventory_bin_locations (
            id,
            store_id,
            bin_code,
            name,
            is_receiving_bin,
            is_active
          )
          VALUES (
            $1,$2,$3,$4,TRUE,TRUE
          )
          `,
          [
            binId,
            storeId,
            `REC-${String(
              Date.now(),
            ).slice(-6)}`,
            'Receiving Bin',
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
            `PO-PIC-${Date.now()}`,
            'Procurement Inventory Contract Test Order',
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
            inventory_item_id
          )
          VALUES (
            $1,$2,1,
            'CONSUMABLE',
            $3,
            'Mapped Inventory line',
            10,
            0,
            'EA',
            10,
            0,
            0,
            0,
            100,
            $4
          )
          `,
          [
            purchaseOrderItemId,
            purchaseOrderId,
            `PIC-${Date.now()}`,
            inventoryItemId,
          ],
        );
      },
    );

    afterAll(
      async () => {
        if (pool) {
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
            DELETE FROM procurement_purchase_order_items
            WHERE purchase_order_id = $1
            `,
            [
              purchaseOrderId,
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
            DELETE FROM inventory_bin_locations
            WHERE id = $1
            `,
            [
              binId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_stores
            WHERE id = ANY($1::UUID[])
            `,
            [
              [
                storeId,
                otherStoreId,
              ],
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
            WHERE id = ANY($1::UUID[])
            `,
            [
              [
                propertyId,
                otherPropertyId,
              ],
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
      'adds Inventory mapping to purchase-order lines',
      async () => {
        const result =
          await pool.query(
            `
            SELECT inventory_item_id
            FROM procurement_purchase_order_items
            WHERE id = $1
            `,
            [
              purchaseOrderItemId,
            ],
          );

        expect(
          result.rows[0]
            .inventory_item_id,
        ).toBe(
          inventoryItemId,
        );
      },
    );

    it(
      'accepts a Goods Receipt destination from the same property',
      async () => {
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
            received_by_person_id,
            destination_store_id,
            destination_bin_location_id
          )
          VALUES (
            $1,$2,$3,$4,$5,
            'DRAFT',
            CURRENT_DATE,
            $6,$7,$8
          )
          `,
          [
            goodsReceiptId,
            `GRN-PIC-${Date.now()}`,
            purchaseOrderId,
            propertyId,
            vendorId,
            personId,
            storeId,
            binId,
          ],
        );

        const result =
          await pool.query(
            `
            SELECT
              destination_store_id,
              destination_bin_location_id
            FROM procurement_goods_receipts
            WHERE id = $1
            `,
            [
              goodsReceiptId,
            ],
          );

        expect(
          result.rows[0]
            .destination_store_id,
        ).toBe(
          storeId,
        );

        expect(
          result.rows[0]
            .destination_bin_location_id,
        ).toBe(
          binId,
        );
      },
    );

    it(
      'rejects a destination store from another property',
      async () => {
        await expect(
          pool.query(
            `
            UPDATE procurement_goods_receipts
            SET destination_store_id = $2,
                destination_bin_location_id = NULL
            WHERE id = $1
            `,
            [
              goodsReceiptId,
              otherStoreId,
            ],
          ),
        ).rejects.toMatchObject({
          code:
            '23514',
        });
      },
    );

    it(
      'rejects a destination bin without its store',
      async () => {
        await expect(
          pool.query(
            `
            UPDATE procurement_goods_receipts
            SET destination_store_id = NULL,
                destination_bin_location_id = $2
            WHERE id = $1
            `,
            [
              goodsReceiptId,
              binId,
            ],
          ),
        ).rejects.toMatchObject({
          code:
            '23514',
        });
      },
    );
  },
);
