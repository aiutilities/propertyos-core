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
  INVENTORY_BATCH_REPOSITORY,
  InventoryBatchRepository,
} from '../../src/core/inventory/repositories/inventory-batch.repository';

import {
  InventoryBatchStatus,
} from '../../src/core/inventory/types/inventory.types';

describe(
  'Inventory Batch PostgreSQL repository',
  () => {
    let app: any;
    let pool: Pool;

    let repository:
      InventoryBatchRepository;

    const personId =
      randomUUID();

    const inventoryItemId =
      randomUUID();

    const firstBatchId =
      randomUUID();

    const competingBatchId =
      randomUUID();

    const categoryId =
      '33100000-0000-4000-8000-000000000001';

    const unitId =
      '33000000-0000-4000-8000-000000000001';

    const batchNumber =
      `REPO-${Date.now()}`;

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
            INVENTORY_BATCH_REPOSITORY,
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
            'Inventory Batch Repository Tester',
            'ACTIVE'
          )
          `,
          [
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
            `BATCH-REPO-${Date.now()}`,
            'Batch Repository Integration Item',
            categoryId,
            unitId,
          ],
        );
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
              inventoryItemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_stock_ledger
            WHERE item_id = $1
            `,
            [
              inventoryItemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_batches
            WHERE item_id = $1
            `,
            [
              inventoryItemId,
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
      'creates and reads a Batch with complete metadata',
      async () => {
        const now =
          new Date();

        const created =
          await repository.create({
            id:
              firstBatchId,

            itemId:
              inventoryItemId,

            batchNumber,

            manufacturerBatchNumber:
              'MFG-REPO-001',

            manufactureDate:
              new Date(
                '2026-07-01T00:00:00.000Z',
              ),

            expiryDate:
              new Date(
                '2027-07-01T00:00:00.000Z',
              ),

            status:
              InventoryBatchStatus
                .ACTIVE,

            sourceType:
              'test.batch_repository',

            sourceId:
              randomUUID(),

            sourceLineId:
              randomUUID(),

            remarks:
              'Repository integration test',

            metadata: {
              test:
                true,

              purpose:
                'batch-resolution',
            },

            createdByPersonId:
              personId,

            createdAt:
              now,

            updatedAt:
              now,
          });

        expect(created).toEqual(
          expect.objectContaining({
            id:
              firstBatchId,

            itemId:
              inventoryItemId,

            batchNumber,

            manufacturerBatchNumber:
              'MFG-REPO-001',

            status:
              InventoryBatchStatus
                .ACTIVE,

            sourceType:
              'test.batch_repository',

            remarks:
              'Repository integration test',

            metadata: {
              test:
                true,

              purpose:
                'batch-resolution',
            },

            createdByPersonId:
              personId,
          }),
        );

        expect(
          created.manufactureDate
            ?.toISOString()
            .slice(
              0,
              10,
            ),
        ).toBe(
          '2026-07-01',
        );

        expect(
          created.expiryDate
            ?.toISOString()
            .slice(
              0,
              10,
            ),
        ).toBe(
          '2027-07-01',
        );

        const byId =
          await repository.findById(
            firstBatchId,
          );

        expect(byId?.id).toBe(
          firstBatchId,
        );

        const byNaturalKey =
          await repository
            .findByItemAndBatchNumber(
              inventoryItemId,
              batchNumber,
            );

        expect(
          byNaturalKey?.id,
        ).toBe(
          firstBatchId,
        );
      },
    );

    it(
      'returns the existing Batch when creation races on the natural key',
      async () => {
        const now =
          new Date();

        const result =
          await repository.create({
            id:
              competingBatchId,

            itemId:
              inventoryItemId,

            batchNumber,

            manufacturerBatchNumber:
              'MFG-REPO-001',

            manufactureDate:
              new Date(
                '2026-07-01T00:00:00.000Z',
              ),

            expiryDate:
              new Date(
                '2027-07-01T00:00:00.000Z',
              ),

            status:
              InventoryBatchStatus
                .ACTIVE,

            sourceType:
              'test.competing_create',

            remarks:
              'Competing create attempt',

            metadata: {},

            createdByPersonId:
              personId,

            createdAt:
              now,

            updatedAt:
              now,
          });

        expect(result.id).toBe(
          firstBatchId,
        );

        expect(result.id).not.toBe(
          competingBatchId,
        );

        const countResult =
          await pool.query(
            `
            SELECT COUNT(*)::INTEGER AS count
            FROM inventory_batches
            WHERE item_id = $1
              AND batch_number = $2
            `,
            [
              inventoryItemId,
              batchNumber,
            ],
          );

        expect(
          countResult.rows[0].count,
        ).toBe(1);
      },
    );

    it(
      'returns null for unknown identifiers',
      async () => {
        await expect(
          repository.findById(
            randomUUID(),
          ),
        ).resolves.toBeNull();

        await expect(
          repository
            .findByItemAndBatchNumber(
              inventoryItemId,
              'UNKNOWN-BATCH',
            ),
        ).resolves.toBeNull();
      },
    );
  },
);
