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
  InventoryBatchAllocationService,
} from '../../src/core/inventory/services/inventory-batch-allocation.service';

import {
  InventoryBatchAllocationStrategy,
} from '../../src/core/inventory/types/inventory.types';

describe(
  'Inventory Batch Allocation PostgreSQL repository',
  () => {
    let app: any;
    let pool: Pool;

    let allocationService:
      InventoryBatchAllocationService;

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

    const fifoOldBatchId =
      randomUUID();

    const fifoNewBatchId =
      randomUUID();

    const fefoFirstBatchId =
      randomUUID();

    const heldBatchId =
      randomUUID();

    const expiredBatchId =
      randomUUID();

    const closedBatchId =
      randomUUID();

    const fullyReservedBatchId =
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

        allocationService =
          app.get(
            InventoryBatchAllocationService,
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
            'Batch Allocation Tester',
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
            'Batch Allocation Property',
            `BAP-${Date.now()}`,
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
            `BA-ST-${Date.now()}`,
            'Batch Allocation Store',
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
            `BA-BIN-${Date.now()}`,
            'Batch Allocation Bin',
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
            `BA-ITEM-${Date.now()}`,
            'Batch Allocation Item',
            categoryId,
            unitId,
          ],
        );

        const batches = [
          {
            id:
              fifoOldBatchId,

            number:
              'FIFO-OLD',

            manufactureDate:
              '2026-01-01',

            expiryDate:
              '2027-12-31',

            status:
              'ACTIVE',

            quantity:
              5,

            reserved:
              1,
          },

          {
            id:
              fifoNewBatchId,

            number:
              'FIFO-NEW',

            manufactureDate:
              '2026-03-01',

            expiryDate:
              '2027-10-31',

            status:
              'ACTIVE',

            quantity:
              8,

            reserved:
              2,
          },

          {
            id:
              fefoFirstBatchId,

            number:
              'FEFO-FIRST',

            manufactureDate:
              '2026-04-01',

            expiryDate:
              '2026-12-01',

            status:
              'ACTIVE',

            quantity:
              6,

            reserved:
              0,
          },

          {
            id:
              heldBatchId,

            number:
              'HELD',

            manufactureDate:
              '2025-01-01',

            expiryDate:
              '2026-08-01',

            status:
              'HOLD',

            quantity:
              20,

            reserved:
              0,
          },

          {
            id:
              expiredBatchId,

            number:
              'EXPIRED-DATE',

            manufactureDate:
              '2025-01-01',

            expiryDate:
              '2026-06-30',

            status:
              'ACTIVE',

            quantity:
              20,

            reserved:
              0,
          },

          {
            id:
              closedBatchId,

            number:
              'CLOSED',

            manufactureDate:
              '2025-01-01',

            expiryDate:
              '2027-01-01',

            status:
              'CLOSED',

            quantity:
              20,

            reserved:
              0,
          },

          {
            id:
              fullyReservedBatchId,

            number:
              'FULLY-RESERVED',

            manufactureDate:
              '2025-01-01',

            expiryDate:
              '2026-09-01',

            status:
              'ACTIVE',

            quantity:
              10,

            reserved:
              10,
          },
        ];

        for (
          const batch
          of batches
        ) {
          await pool.query(
            `
            INSERT INTO inventory_batches (
              id,
              item_id,
              batch_number,
              manufacture_date,
              expiry_date,
              status,
              metadata,
              created_by_person_id
            )
            VALUES (
              $1,$2,$3,$4,$5,$6,
              '{}'::JSONB,
              $7
            )
            `,
            [
              batch.id,
              itemId,
              batch.number,
              batch.manufactureDate,
              batch.expiryDate,
              batch.status,
              personId,
            ],
          );

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
              $1,$2,$3,$4,$5,$6,$7,$8
            )
            `,
            [
              randomUUID(),
              batch.id,
              itemId,
              storeId,
              binId,
              batch.quantity,
              batch.reserved,
              10,
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
            DELETE FROM inventory_batch_balances
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
      'orders eligible Batches by FIFO manufacture date',
      async () => {
        const result =
          await allocationService
            .allocate({
              itemId,
              storeId,

              binLocationId:
                binId,

              quantity:
                12,

              strategy:
                InventoryBatchAllocationStrategy
                  .FIFO,

              asOf:
                new Date(
                  '2026-07-16T00:00:00.000Z',
                ),
            });

        expect(
          result.allocations.map(
            (line) =>
              line.batchId,
          ),
        ).toEqual([
          fifoOldBatchId,
          fifoNewBatchId,
          fefoFirstBatchId,
        ]);

        expect(
          result.allocations.map(
            (line) =>
              line.allocatedQuantity,
          ),
        ).toEqual([
          4,
          6,
          2,
        ]);

        expect(
          result.fullyAllocated,
        ).toBe(true);
      },
    );

    it(
      'orders eligible Batches by FEFO expiry date',
      async () => {
        const result =
          await allocationService
            .allocate({
              itemId,
              storeId,

              binLocationId:
                binId,

              quantity:
                10,

              strategy:
                InventoryBatchAllocationStrategy
                  .FEFO,

              asOf:
                new Date(
                  '2026-07-16T00:00:00.000Z',
                ),
            });

        expect(
          result.allocations.map(
            (line) =>
              line.batchId,
          ),
        ).toEqual([
          fefoFirstBatchId,
          fifoNewBatchId,
        ]);

        expect(
          result.allocations.map(
            (line) =>
              line.allocatedQuantity,
          ),
        ).toEqual([
          6,
          4,
        ]);
      },
    );

    it(
      'preserves MANUAL Batch order',
      async () => {
        const result =
          await allocationService
            .allocate({
              itemId,
              storeId,

              binLocationId:
                binId,

              quantity:
                8,

              strategy:
                InventoryBatchAllocationStrategy
                  .MANUAL,

              manualBatchIds: [
                fifoNewBatchId,
                fifoOldBatchId,
              ],

              asOf:
                new Date(
                  '2026-07-16T00:00:00.000Z',
                ),
            });

        expect(
          result.allocations.map(
            (line) =>
              line.batchId,
          ),
        ).toEqual([
          fifoNewBatchId,
          fifoOldBatchId,
        ]);

        expect(
          result.allocations.map(
            (line) =>
              line.allocatedQuantity,
          ),
        ).toEqual([
          6,
          2,
        ]);
      },
    );

    it(
      'excludes held, closed, expired and fully reserved Batches',
      async () => {
        const result =
          await allocationService
            .allocate({
              itemId,
              storeId,

              binLocationId:
                binId,

              quantity:
                100,

              strategy:
                InventoryBatchAllocationStrategy
                  .FEFO,

              asOf:
                new Date(
                  '2026-07-16T00:00:00.000Z',
                ),
            });

        expect(
          result.allocations.map(
            (line) =>
              line.batchId,
          ),
        ).toEqual(
          expect.arrayContaining([
            fifoOldBatchId,
            fifoNewBatchId,
            fefoFirstBatchId,
          ]),
        );

        expect(
          result.allocations.map(
            (line) =>
              line.batchId,
          ),
        ).not.toEqual(
          expect.arrayContaining([
            heldBatchId,
            expiredBatchId,
            closedBatchId,
            fullyReservedBatchId,
          ]),
        );

        expect(
          result.allocatedQuantity,
        ).toBe(16);

        expect(
          result.shortageQuantity,
        ).toBe(84);

        expect(
          result.fullyAllocated,
        ).toBe(false);
      },
    );

    it(
      'uses reservation-aware available quantities',
      async () => {
        const result =
          await allocationService
            .allocate({
              itemId,
              storeId,

              binLocationId:
                binId,

              quantity:
                20,

              strategy:
                InventoryBatchAllocationStrategy
                  .FIFO,

              asOf:
                new Date(
                  '2026-07-16T00:00:00.000Z',
                ),
            });

        expect(
          result.allocations.map(
            (line) => ({
              batchId:
                line.batchId,

              available:
                line.availableQuantity,
            }),
          ),
        ).toEqual([
          {
            batchId:
              fifoOldBatchId,

            available:
              4,
          },
          {
            batchId:
              fifoNewBatchId,

            available:
              6,
          },
          {
            batchId:
              fefoFirstBatchId,

            available:
              6,
          },
        ]);
      },
    );
  },
);
