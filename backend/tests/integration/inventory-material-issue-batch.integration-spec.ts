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
  InventoryMaterialIssueService,
} from '../../src/core/inventory/services/inventory-material-issue.service';

describe(
  'Inventory Material Issue Batch integration',
  () => {
    let app: any;
    let pool: Pool;

    let service:
      InventoryMaterialIssueService;

    const propertyId =
      randomUUID();

    const personId =
      randomUUID();

    const storeId =
      randomUUID();

    const binId =
      randomUUID();

    const batchTrackedItemId =
      randomUUID();

    const nonBatchItemId =
      randomUUID();

    const firstBatchId =
      randomUUID();

    const secondBatchId =
      randomUUID();

    const categoryId =
      '33100000-0000-4000-8000-000000000001';

    const unitId =
      '33000000-0000-4000-8000-000000000001';

    const createdIssueIds:
      string[] = [];

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

        service =
          app.get(
            InventoryMaterialIssueService,
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
            'Material Issue Batch Tester',
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
            'Material Issue Batch Property',
            `MIB-${Date.now()}`,
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
            `MIB-ST-${Date.now()}`,
            'Material Issue Batch Store',
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
            `MIB-BIN-${Date.now()}`,
            'Material Issue Batch Bin',
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
          VALUES
            (
              $1,$2,$3,$4,$5,
              'CONSUMABLE',
              'INR',
              TRUE,
              TRUE
            ),
            (
              $6,$7,$8,$4,$5,
              'CONSUMABLE',
              'INR',
              FALSE,
              TRUE
            )
          `,
          [
            batchTrackedItemId,
            `MIB-BATCH-${Date.now()}`,
            'Batch-tracked Issue Item',
            categoryId,
            unitId,

            nonBatchItemId,
            `MIB-NON-${Date.now()}`,
            'Non-batch Issue Item',
          ],
        );

        for (
          const [
            id,
            number,
          ]
          of [
            [
              firstBatchId,
              `MIB-LOT-A-${Date.now()}`,
            ],
            [
              secondBatchId,
              `MIB-LOT-B-${Date.now()}`,
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
              id,
              batchTrackedItemId,
              number,
              personId,
            ],
          );
        }

        for (
          const batchId
          of [
            firstBatchId,
            secondBatchId,
          ]
        ) {
          await pool.query(
            `
            INSERT INTO inventory_stock_balances (
              id,
              item_id,
              store_id,
              bin_location_id,
              quantity_on_hand,
              reserved_quantity,
              average_unit_cost,
              created_at,
              updated_at
            )
            VALUES (
              $1,$2,$3,$4,
              20,
              0,
              10,
              NOW(),
              NOW()
            )
            ON CONFLICT DO NOTHING
            `,
            [
              randomUUID(),
              batchTrackedItemId,
              storeId,
              binId,
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
              average_unit_cost,
              created_at,
              updated_at
            )
            VALUES (
              $1,$2,$3,$4,$5,
              10,
              0,
              10,
              NOW(),
              NOW()
            )
            `,
            [
              randomUUID(),
              batchId,
              batchTrackedItemId,
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
            WHERE item_id IN (
              $1,
              $2
            )
            `,
            [
              batchTrackedItemId,
              nonBatchItemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_material_issues
            WHERE id = ANY($1::UUID[])
            `,
            [
              createdIssueIds,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_batch_balances
            WHERE item_id = $1
            `,
            [
              batchTrackedItemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_stock_balances
            WHERE item_id IN (
              $1,
              $2
            )
            `,
            [
              batchTrackedItemId,
              nonBatchItemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_batches
            WHERE item_id = $1
            `,
            [
              batchTrackedItemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_items
            WHERE id IN (
              $1,
              $2
            )
            `,
            [
              batchTrackedItemId,
              nonBatchItemId,
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
      'requires batchId for a batch-tracked Material Issue item',
      async () => {
        await expect(
          service.createMaterialIssue({
            propertyId,
            storeId,
            issueDate:
              '2026-07-16',

            reasonCode:
              'OPERATIONS',

            createdByPersonId:
              personId,

            items: [
              {
                itemId:
                  batchTrackedItemId,

                binLocationId:
                  binId,

                quantity:
                  1,

                unitCost:
                  10,
              },
            ],
          }),
        ).rejects.toThrow(
          'batchId is required for batch-tracked Inventory item',
        );
      },
    );

    it(
      'rejects batchId for a non-batch-tracked Material Issue item',
      async () => {
        await expect(
          service.createMaterialIssue({
            propertyId,
            storeId,
            issueDate:
              '2026-07-16',

            reasonCode:
              'OPERATIONS',

            createdByPersonId:
              personId,

            items: [
              {
                itemId:
                  nonBatchItemId,

                binLocationId:
                  binId,

                batchId:
                  firstBatchId,

                quantity:
                  1,

                unitCost:
                  10,
              },
            ],
          }),
        ).rejects.toThrow(
          'batchId cannot be used for an Inventory item that is not batch tracked',
        );
      },
    );

    it(
      'allows separate Batches of the same item and bin on one Material Issue',
      async () => {
        const created =
          await service.createMaterialIssue({
            propertyId,
            storeId,
            issueDate:
              '2026-07-16',

            reasonCode:
              'OPERATIONS',

            createdByPersonId:
              personId,

            items: [
              {
                itemId:
                  batchTrackedItemId,

                binLocationId:
                  binId,

                batchId:
                  firstBatchId,

                quantity:
                  2,

                unitCost:
                  10,
              },
              {
                itemId:
                  batchTrackedItemId,

                binLocationId:
                  binId,

                batchId:
                  secondBatchId,

                quantity:
                  3,

                unitCost:
                  10,
              },
            ],
          });

        createdIssueIds.push(
          created.materialIssue.id,
        );

        expect(
          created.items,
        ).toHaveLength(2);

        expect(
          created.items.map(
            (item) =>
              item.batchId,
          ),
        ).toEqual(
          expect.arrayContaining([
            firstBatchId,
            secondBatchId,
          ]),
        );

        const posted =
          await service.postMaterialIssue(
            created.materialIssue.id,
            {
              postedByPersonId:
                personId,
            },
          );

        expect(
          posted.materialIssue.status,
        ).toBe(
          'POSTED',
        );

        const movements =
          await pool.query(
            `
            SELECT
              batch_id,
              quantity_delta
            FROM inventory_stock_ledger
            WHERE source_type =
              'inventory.material_issue'
              AND source_id = $1
            ORDER BY batch_id
            `,
            [
              created.materialIssue.id,
            ],
          );

        expect(
          movements.rows,
        ).toHaveLength(2);

        expect(
          movements.rows.map(
            (row) =>
              row.batch_id,
          ),
        ).toEqual(
          expect.arrayContaining([
            firstBatchId,
            secondBatchId,
          ]),
        );

        expect(
          movements.rows.reduce(
            (
              total,
              row,
            ) =>
              total +
              Number(
                row.quantity_delta,
              ),

            0,
          ),
        ).toBe(-5);
      },
    );

    it(
      'rejects duplicate item, bin and Batch combinations',
      async () => {
        await expect(
          service.createMaterialIssue({
            propertyId,
            storeId,
            issueDate:
              '2026-07-16',

            reasonCode:
              'OPERATIONS',

            createdByPersonId:
              personId,

            items: [
              {
                itemId:
                  batchTrackedItemId,

                binLocationId:
                  binId,

                batchId:
                  firstBatchId,

                quantity:
                  1,

                unitCost:
                  10,
              },
              {
                itemId:
                  batchTrackedItemId,

                binLocationId:
                  binId,

                batchId:
                  firstBatchId,

                quantity:
                  1,

                unitCost:
                  10,
              },
            ],
          }),
        ).rejects.toThrow(
          'Duplicate Material Issue item and bin combination',
        );
      },
    );
  },
);
