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
  InventoryStockReservationService,
} from '../../src/core/inventory/services/inventory-stock-reservation.service';

describe(
  'Inventory Stock Reservation Batch integration',
  () => {
    let app: any;
    let pool: Pool;

    let reservationService:
      InventoryStockReservationService;

    const propertyId =
      randomUUID();

    const personId =
      randomUUID();

    const storeId =
      randomUUID();

    const binId =
      randomUUID();

    const itemId =
      randomUUID();

    const firstBatchId =
      randomUUID();

    const secondBatchId =
      randomUUID();

    let firstReservationId:
      string | undefined;

    let secondReservationId:
      string | undefined;

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

        reservationService =
          app.get(
            InventoryStockReservationService,
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
            'Batch Reservation Tester',
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
            'Batch Reservation Property',
            `BRP-${Date.now()}`,
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
          VALUES (
            $1,$2,$3,$4,TRUE
          )
          `,
          [
            storeId,
            `BR-ST-${Date.now()}`,
            'Batch Reservation Store',
            propertyId,
          ],
        );

        await pool.query(
          `
          INSERT INTO inventory_bin_locations (
            id,
            store_id,
            bin_code,
            name,
            is_active
          )
          VALUES (
            $1,$2,$3,$4,TRUE
          )
          `,
          [
            binId,
            storeId,
            `BR-BIN-${Date.now()}`,
            'Batch Reservation Bin',
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
            itemId,
            `BR-ITEM-${Date.now()}`,
            'Batch Reservation Item',
            categoryId,
            unitId,
          ],
        );

        for (
          const [
            batchId,
            batchNumber,
          ]
          of [
            [
              firstBatchId,
              `BR-A-${Date.now()}`,
            ],
            [
              secondBatchId,
              `BR-B-${Date.now()}`,
            ],
          ]
        ) {
          await pool.query(
            `
            INSERT INTO inventory_batches (
              id,
              item_id,
              batch_number,
              expiry_date,
              status,
              metadata,
              created_by_person_id
            )
            VALUES (
              $1,$2,$3,
              DATE '2027-07-01',
              'ACTIVE',
              '{}'::JSONB,
              $4
            )
            `,
            [
              batchId,
              itemId,
              batchNumber,
              personId,
            ],
          );
        }

        await pool.query(
          `
          INSERT INTO inventory_stock_balances (
            id,
            item_id,
            store_id,
            bin_location_id,
            quantity_on_hand,
            reserved_quantity,
            average_unit_cost
          )
          VALUES (
            $1,$2,$3,$4,
            20,
            0,
            10
          )
          `,
          [
            randomUUID(),
            itemId,
            storeId,
            binId,
          ],
        );

        for (
          const batchId
          of [
            firstBatchId,
            secondBatchId,
          ]
        ) {
          await pool.query(
            `
            INSERT INTO inventory_batch_balances (
              id,
              batch_id,
              item_id,
              store_id,
              bin_location_id,
              quantity_on_hand,
              reserved_quantity,
              average_unit_cost
            )
            VALUES (
              $1,$2,$3,$4,$5,
              10,
              0,
              10
            )
            `,
            [
              randomUUID(),
              batchId,
              itemId,
              storeId,
              binId,
            ],
          );
        }
      },
    );

    afterAll(
      async () => {
        if (pool) {
          await pool.query(
            `
            DELETE FROM inventory_stock_ledger
            WHERE item_id = $1
            `,
            [
              itemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_stock_reservations
            WHERE item_id = $1
            `,
            [
              itemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_batch_balances
            WHERE item_id = $1
            `,
            [
              itemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_stock_balances
            WHERE item_id = $1
            `,
            [
              itemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_batches
            WHERE item_id = $1
            `,
            [
              itemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_items
            WHERE id = $1
            `,
            [
              itemId,
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
            WHERE id = $1
            `,
            [
              storeId,
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
      'persists and filters reservations by Batch',
      async () => {
        const first =
          await reservationService
            .createReservation({
              itemId,
              storeId,
              binLocationId:
                binId,

              batchId:
                firstBatchId,

              quantity:
                4,

              sourceType:
                'maintenance.work_order',

              referenceNumber:
                'BR-001',

              createdByPersonId:
                personId,
            });

        firstReservationId =
          first.id;

        const second =
          await reservationService
            .createReservation({
              itemId,
              storeId,
              binLocationId:
                binId,

              batchId:
                secondBatchId,

              quantity:
                3,

              sourceType:
                'maintenance.work_order',

              referenceNumber:
                'BR-002',

              createdByPersonId:
                personId,
            });

        secondReservationId =
          second.id;

        expect(
          first.batchId,
        ).toBe(
          firstBatchId,
        );

        expect(
          second.batchId,
        ).toBe(
          secondBatchId,
        );

        const firstRows =
          await reservationService
            .listReservations({
              batchId:
                firstBatchId,
            });

        expect(
          firstRows,
        ).toHaveLength(1);

        expect(
          firstRows[0]
            .id,
        ).toBe(
          firstReservationId,
        );

        const persisted =
          await pool.query(
            `
            SELECT batch_id
            FROM inventory_stock_reservations
            WHERE id = $1
            `,
            [
              firstReservationId,
            ],
          );

        expect(
          persisted.rows[0]
            .batch_id,
        ).toBe(
          firstBatchId,
        );
      },
    );

    it(
      'preserves Batch identity across release and fulfilment movements',
      async () => {
        const released =
          await reservationService
            .releaseReservation(
              firstReservationId!,
              {
                quantity:
                  1,

                releasedByPersonId:
                  personId,
              },
            );

        expect(
          released.batchId,
        ).toBe(
          firstBatchId,
        );

        const fulfilled =
          await reservationService
            .fulfillReservation(
              firstReservationId!,
              {
                quantity:
                  3,

                fulfilledByPersonId:
                  personId,
              },
            );

        expect(
          fulfilled.batchId,
        ).toBe(
          firstBatchId,
        );

        const movements =
          await pool.query(
            `
            SELECT
              movement_type,
              batch_id,
              quantity_delta,
              reserved_quantity_delta
            FROM inventory_stock_ledger
            WHERE source_type =
              'inventory.stock_reservation'
              AND source_id = $1
            ORDER BY created_at
            `,
            [
              firstReservationId,
            ],
          );

        expect(
          movements.rows,
        ).toHaveLength(3);

        expect(
          movements.rows.map(
            (row) =>
              row.batch_id,
          ),
        ).toEqual([
          firstBatchId,
          firstBatchId,
          firstBatchId,
        ]);

        expect(
          movements.rows.map(
            (row) =>
              row.movement_type,
          ),
        ).toEqual([
          'RESERVATION',
          'RESERVATION_RELEASE',
          'ISSUE',
        ]);
      },
    );

    it(
      'maintains independent Batch reservation balances',
      async () => {
        const balances =
          await pool.query(
            `
            SELECT
              batch_id,
              quantity_on_hand,
              reserved_quantity
            FROM inventory_batch_balances
            WHERE item_id = $1
              AND store_id = $2
              AND bin_location_id = $3
            ORDER BY batch_id
            `,
            [
              itemId,
              storeId,
              binId,
            ],
          );

        const byBatch =
          new Map(
            balances.rows.map(
              (row) => [
                row.batch_id,
                {
                  quantity:
                    Number(
                      row.quantity_on_hand,
                    ),

                  reserved:
                    Number(
                      row.reserved_quantity,
                    ),
                },
              ],
            ),
          );

        expect(
          byBatch.get(
            firstBatchId,
          ),
        ).toEqual({
          quantity:
            7,

          reserved:
            0,
        });

        expect(
          byBatch.get(
            secondBatchId,
          ),
        ).toEqual({
          quantity:
            10,

          reserved:
            3,
        });
      },
    );
  },
);
