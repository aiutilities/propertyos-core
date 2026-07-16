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

import {
  InventoryMaterialReturnService,
} from '../../src/core/inventory/services/inventory-material-return.service';

describe(
  'Inventory Material Return Batch integration',
  () => {
    let app: any;
    let pool: Pool;

    let issueService:
      InventoryMaterialIssueService;

    let returnService:
      InventoryMaterialReturnService;

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

    let materialIssueId:
      string | undefined;

    let materialReturnId:
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

        issueService =
          app.get(
            InventoryMaterialIssueService,
          );

        returnService =
          app.get(
            InventoryMaterialReturnService,
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
            'Material Return Batch Tester',
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
            'Material Return Batch Property',
            `MRB-${Date.now()}`,
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
            `MRB-ST-${Date.now()}`,
            'Material Return Batch Store',
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
            `MRB-BIN-${Date.now()}`,
            'Material Return Batch Bin',
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
            `MRB-ITEM-${Date.now()}`,
            'Material Return Batch Item',
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
              `MRB-A-${Date.now()}`,
            ],
            [
              secondBatchId,
              `MRB-B-${Date.now()}`,
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

        const issue =
          await issueService
            .createMaterialIssue({
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
                  itemId,

                  binLocationId:
                    binId,

                  batchId:
                    firstBatchId,

                  quantity:
                    5,

                  unitCost:
                    10,
                },
              ],
            });

        materialIssueId =
          issue.materialIssue.id;

        await issueService
          .postMaterialIssue(
            materialIssueId,
            {
              postedByPersonId:
                personId,
            },
          );
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

          if (materialReturnId) {
            await pool.query(
              `
              DELETE FROM inventory_material_returns
              WHERE id = $1
              `,
              [
                materialReturnId,
              ],
            );
          }

          if (materialIssueId) {
            await pool.query(
              `
              DELETE FROM inventory_material_issues
              WHERE id = $1
              `,
              [
                materialIssueId,
              ],
            );
          }

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
      'rejects a linked return using a different Batch',
      async () => {
        await expect(
          returnService
            .createMaterialReturn({
              propertyId,
              storeId,

              materialIssueId:
                materialIssueId!,

              returnDate:
                '2026-07-16',

              reasonCode:
                'UNUSED_MATERIAL',

              createdByPersonId:
                personId,

              items: [
                {
                  itemId,

                  binLocationId:
                    binId,

                  batchId:
                    secondBatchId,

                  quantity:
                    1,

                  unitCost:
                    10,
                },
              ],
            }),
        ).rejects.toThrow(
          'The returned item, bin and Batch were not present on the original Material Issue',
        );
      },
    );

    it(
      'preserves Batch identity through document and ledger posting',
      async () => {
        const created =
          await returnService
            .createMaterialReturn({
              propertyId,
              storeId,

              materialIssueId:
                materialIssueId!,

              returnDate:
                '2026-07-16',

              reasonCode:
                'UNUSED_MATERIAL',

              createdByPersonId:
                personId,

              items: [
                {
                  itemId,

                  binLocationId:
                    binId,

                  batchId:
                    firstBatchId,

                  quantity:
                    2,

                  unitCost:
                    10,
                },
              ],
            });

        materialReturnId =
          created.materialReturn.id;

        expect(
          created.items[0]
            .batchId,
        ).toBe(
          firstBatchId,
        );

        const posted =
          await returnService
            .postMaterialReturn(
              materialReturnId,
              {
                postedByPersonId:
                  personId,
              },
            );

        expect(
          posted.items[0]
            .batchId,
        ).toBe(
          firstBatchId,
        );

        const movement =
          await pool.query(
            `
            SELECT
              batch_id,
              quantity_delta
            FROM inventory_stock_ledger
            WHERE source_type =
              'inventory.material_return'
              AND source_id = $1
            `,
            [
              materialReturnId,
            ],
          );

        expect(
          movement.rows,
        ).toHaveLength(1);

        expect(
          movement.rows[0]
            .batch_id,
        ).toBe(
          firstBatchId,
        );

        expect(
          Number(
            movement.rows[0]
              .quantity_delta,
          ),
        ).toBe(2);

        const persistedLine =
          await pool.query(
            `
            SELECT batch_id
            FROM inventory_material_return_items
            WHERE material_return_id = $1
            `,
            [
              materialReturnId,
            ],
          );

        expect(
          persistedLine.rows[0]
            .batch_id,
        ).toBe(
          firstBatchId,
        );
      },
    );
  },
);
