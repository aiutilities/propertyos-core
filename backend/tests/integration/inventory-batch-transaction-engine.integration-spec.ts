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
  INVENTORY_STOCK_LEDGER_REPOSITORY,
  InventoryStockLedgerRepository,
} from '../../src/core/inventory/repositories/inventory-stock-ledger.repository';

import {
  InventoryStockMovementType,
} from '../../src/core/inventory/types/inventory.types';

import {
  POSTGRES_POOL,
} from '../../src/database/postgres';

describe(
  'Inventory Batch transaction engine',
  () => {
    let app: any;
    let pool: Pool;

    let repository:
      InventoryStockLedgerRepository;

    const propertyId =
      randomUUID();

    const trackedItemId =
      randomUUID();

    const otherTrackedItemId =
      randomUUID();

    const untrackedItemId =
      randomUUID();

    const storeId =
      randomUUID();

    const activeBatchAId =
      randomUUID();

    const activeBatchBId =
      randomUUID();

    const mismatchedBatchId =
      randomUUID();

    const expiredBatchId =
      randomUUID();

    const holdBatchId =
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
            INVENTORY_STOCK_LEDGER_REPOSITORY,
          );

        const stamp =
          Date.now();

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
            $1,$2,$3,$4,$5,$6,$7,$8
          )
          `,
          [
            propertyId,
            'Batch Engine Test Property',
            `BATCH-ENGINE-${stamp}`,
            'BOUTIQUE_ROOMS',
            'Chengalpattu',
            'Tamil Nadu',
            'India',
            true,
          ],
        );

        for (
          const item
          of [
            {
              id:
                trackedItemId,

              suffix:
                'TRACKED',

              tracked:
                true,
            },
            {
              id:
                otherTrackedItemId,

              suffix:
                'OTHER',

              tracked:
                true,
            },
            {
              id:
                untrackedItemId,

              suffix:
                'PLAIN',

              tracked:
                false,
            },
          ]
        ) {
          await pool.query(
            `
            INSERT INTO inventory_items (
              id,
              sku,
              name,
              category_id,
              unit_of_measure_id,
              item_type,
              minimum_stock_level,
              reorder_level,
              reorder_quantity,
              standard_cost,
              currency,
              is_serialized,
              is_batch_tracked,
              is_active
            )
            VALUES (
              $1,$2,$3,$4,$5,$6,
              0,0,0,0,'INR',FALSE,$7,TRUE
            )
            `,
            [
              item.id,
              `BATCH-${item.suffix}-${stamp}`,
              `Batch Engine ${item.suffix}`,
              categoryId,
              unitId,
              'CONSUMABLE',
              item.tracked,
            ],
          );
        }

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
            `BTE-${String(
              stamp,
            ).slice(-8)}`,
            'Batch Engine Store',
            propertyId,
          ],
        );

        for (
          const batch
          of [
            {
              id:
                activeBatchAId,

              itemId:
                trackedItemId,

              number:
                'ACTIVE-A',

              status:
                'ACTIVE',

              expiry:
                '2027-12-31',
            },
            {
              id:
                activeBatchBId,

              itemId:
                trackedItemId,

              number:
                'ACTIVE-B',

              status:
                'ACTIVE',

              expiry:
                '2028-12-31',
            },
            {
              id:
                mismatchedBatchId,

              itemId:
                otherTrackedItemId,

              number:
                'OTHER-ITEM',

              status:
                'ACTIVE',

              expiry:
                '2028-12-31',
            },
            {
              id:
                expiredBatchId,

              itemId:
                trackedItemId,

              number:
                'EXPIRED',

              status:
                'EXPIRED',

              expiry:
                '2025-12-31',
            },
            {
              id:
                holdBatchId,

              itemId:
                trackedItemId,

              number:
                'HOLD',

              status:
                'HOLD',

              expiry:
                '2028-12-31',
            },
          ]
        ) {
          await pool.query(
            `
            INSERT INTO inventory_batches (
              id,
              item_id,
              batch_number,
              manufacture_date,
              expiry_date,
              status
            )
            VALUES (
              $1,$2,$3,$4,$5,$6
            )
            `,
            [
              batch.id,
              batch.itemId,
              `${batch.number}-${stamp}`,
              '2025-01-01',
              batch.expiry,
              batch.status,
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
              $2,
              $3
            )
            `,
            [
              trackedItemId,
              otherTrackedItemId,
              untrackedItemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_batch_balances
            WHERE item_id IN (
              $1,
              $2
            )
            `,
            [
              trackedItemId,
              otherTrackedItemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_stock_balances
            WHERE item_id IN (
              $1,
              $2,
              $3
            )
            `,
            [
              trackedItemId,
              otherTrackedItemId,
              untrackedItemId,
            ],
          );

          await pool.query(
            `
            DELETE FROM inventory_batches
            WHERE id IN (
              $1,$2,$3,$4,$5
            )
            `,
            [
              activeBatchAId,
              activeBatchBId,
              mismatchedBatchId,
              expiredBatchId,
              holdBatchId,
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
            DELETE FROM inventory_items
            WHERE id IN (
              $1,$2,$3
            )
            `,
            [
              trackedItemId,
              otherTrackedItemId,
              untrackedItemId,
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
        }

        if (app) {
          await app.close();
        }
      },
    );

    it(
      'requires batchId for a batch-tracked item',
      async () => {
        await expect(
          repository.postMovement({
            movementType:
              InventoryStockMovementType
                .OPENING,

            itemId:
              trackedItemId,

            storeId,

            quantityDelta:
              10,

            unitCost:
              20,

            sourceType:
              'test.batch.required',
          }),
        ).rejects.toThrow(
          'batchId is required for a batch-tracked Inventory item',
        );
      },
    );

    it(
      'rejects batchId for an item that is not batch tracked',
      async () => {
        await expect(
          repository.postMovement({
            movementType:
              InventoryStockMovementType
                .OPENING,

            itemId:
              untrackedItemId,

            storeId,

            batchId:
              activeBatchAId,

            quantityDelta:
              10,

            unitCost:
              20,

            sourceType:
              'test.batch.untracked',
          }),
        ).rejects.toThrow(
          'batchId cannot be used for an Inventory item that is not batch tracked',
        );
      },
    );

    it(
      'rejects a Batch belonging to another Inventory item',
      async () => {
        await expect(
          repository.postMovement({
            movementType:
              InventoryStockMovementType
                .OPENING,

            itemId:
              trackedItemId,

            storeId,

            batchId:
              mismatchedBatchId,

            quantityDelta:
              10,

            unitCost:
              20,

            sourceType:
              'test.batch.mismatch',
          }),
        ).rejects.toThrow(
          'Invalid, inactive, or mismatched Inventory Batch',
        );
      },
    );

    it(
      'rejects an expired Batch',
      async () => {
        await expect(
          repository.postMovement({
            movementType:
              InventoryStockMovementType
                .RECEIPT,

            itemId:
              trackedItemId,

            storeId,

            batchId:
              expiredBatchId,

            quantityDelta:
              5,

            unitCost:
              20,

            sourceType:
              'test.batch.expired',
          }),
        ).rejects.toThrow(
          'Invalid, inactive, or mismatched Inventory Batch',
        );
      },
    );

    it(
      'rejects a Batch on operational hold',
      async () => {
        await expect(
          repository.postMovement({
            movementType:
              InventoryStockMovementType
                .RECEIPT,

            itemId:
              trackedItemId,

            storeId,

            batchId:
              holdBatchId,

            quantityDelta:
              5,

            unitCost:
              20,

            sourceType:
              'test.batch.hold',
          }),
        ).rejects.toThrow(
          'Invalid, inactive, or mismatched Inventory Batch',
        );
      },
    );

    it(
      'posts receipts into aggregate and Batch balances atomically',
      async () => {
        const result =
          await repository
            .postMovement({
              movementType:
                InventoryStockMovementType
                  .OPENING,

              itemId:
                trackedItemId,

              storeId,

              batchId:
                activeBatchAId,

              quantityDelta:
                10,

              unitCost:
                20,

              sourceType:
                'test.batch.opening',

              idempotencyKey:
                `batch-opening-${activeBatchAId}`,
            });

        expect(
          result.entry.batchId,
        ).toBe(
          activeBatchAId,
        );

        expect(
          result.balance
            .quantityOnHand,
        ).toBe(10);

        expect(
          result.batchBalance
            ?.quantityOnHand,
        ).toBe(10);

        expect(
          result.batchBalance
            ?.averageUnitCost,
        ).toBe(20);
      },
    );

    it(
      'maintains independent balances for separate Batches',
      async () => {
        await repository
          .postMovement({
            movementType:
              InventoryStockMovementType
                .OPENING,

            itemId:
              trackedItemId,

            storeId,

            batchId:
              activeBatchBId,

            quantityDelta:
              7,

            unitCost:
              30,

            sourceType:
              'test.batch.second',

            idempotencyKey:
              `batch-opening-${activeBatchBId}`,
          });

        const result =
          await pool.query(
            `
            SELECT
              batch_id,
              quantity_on_hand,
              average_unit_cost
            FROM inventory_batch_balances
            WHERE item_id = $1
              AND store_id = $2
            `,
            [
              trackedItemId,
              storeId,
            ],
          );

        expect(
          result.rows,
        ).toHaveLength(2);

        const balances =
          new Map(
            result.rows.map(
              (row) => [
                row.batch_id,
                {
                  quantity:
                    Number(
                      row.quantity_on_hand,
                    ),

                  cost:
                    Number(
                      row.average_unit_cost,
                    ),
                },
              ],
            ),
          );

        expect(
          balances.get(
            activeBatchAId,
          ),
        ).toEqual({
          quantity: 10,
          cost: 20,
        });

        expect(
          balances.get(
            activeBatchBId,
          ),
        ).toEqual({
          quantity: 7,
          cost: 30,
        });
      },
    );

    it(
      'issues stock only from the selected Batch',
      async () => {
        const result =
          await repository
            .postMovement({
              movementType:
                InventoryStockMovementType
                  .ISSUE,

              itemId:
                trackedItemId,

              storeId,

              batchId:
                activeBatchAId,

              quantityDelta:
                -4,

              unitCost:
                20,

              sourceType:
                'test.batch.issue',

              idempotencyKey:
                `batch-issue-${activeBatchAId}`,
            });

        expect(
          result.balance
            .quantityOnHand,
        ).toBe(13);

        expect(
          result.batchBalance
            ?.quantityOnHand,
        ).toBe(6);

        const secondBatch =
          await pool.query(
            `
            SELECT quantity_on_hand
            FROM inventory_batch_balances
            WHERE batch_id = $1
              AND item_id = $2
              AND store_id = $3
            `,
            [
              activeBatchBId,
              trackedItemId,
              storeId,
            ],
          );

        expect(
          Number(
            secondBatch.rows[0]
              .quantity_on_hand,
          ),
        ).toBe(7);
      },
    );

    it(
      'prevents an issue exceeding the selected Batch balance',
      async () => {
        await expect(
          repository.postMovement({
            movementType:
              InventoryStockMovementType
                .ISSUE,

            itemId:
              trackedItemId,

            storeId,

            batchId:
              activeBatchBId,

            quantityDelta:
              -8,

            unitCost:
              30,

            sourceType:
              'test.batch.negative',
          }),
        ).rejects.toThrow(
          'Inventory movement would create negative Batch stock',
        );

        const aggregate =
          await pool.query(
            `
            SELECT quantity_on_hand
            FROM inventory_stock_balances
            WHERE item_id = $1
              AND store_id = $2
            `,
            [
              trackedItemId,
              storeId,
            ],
          );

        expect(
          Number(
            aggregate.rows[0]
              .quantity_on_hand,
          ),
        ).toBe(13);
      },
    );

    it(
      'keeps aggregate quantity equal to the sum of Batch quantities',
      async () => {
        const result =
          await pool.query(
            `
            SELECT
              aggregate_balance.quantity_on_hand
                AS aggregate_quantity,

              COALESCE(
                SUM(
                  batch_balance.quantity_on_hand
                ),
                0
              ) AS batch_quantity

            FROM inventory_stock_balances
              aggregate_balance

            LEFT JOIN inventory_batch_balances
              batch_balance
              ON batch_balance.item_id =
                aggregate_balance.item_id
              AND batch_balance.store_id =
                aggregate_balance.store_id
              AND (
                batch_balance.bin_location_id =
                  aggregate_balance.bin_location_id
                OR (
                  batch_balance.bin_location_id IS NULL
                  AND aggregate_balance.bin_location_id IS NULL
                )
              )

            WHERE aggregate_balance.item_id = $1
              AND aggregate_balance.store_id = $2

            GROUP BY
              aggregate_balance.quantity_on_hand
            `,
            [
              trackedItemId,
              storeId,
            ],
          );

        expect(
          result.rows,
        ).toHaveLength(1);

        expect(
          Number(
            result.rows[0]
              .aggregate_quantity,
          ),
        ).toBe(
          Number(
            result.rows[0]
              .batch_quantity,
          ),
        );
      },
    );

    it(
      'replays an idempotent Batch movement without duplication',
      async () => {
        const input = {
          movementType:
            InventoryStockMovementType
              .RECEIPT,

          itemId:
            trackedItemId,

          storeId,

          batchId:
            activeBatchAId,

          quantityDelta:
            5,

          unitCost:
            24,

          sourceType:
            'test.batch.idempotency',

          idempotencyKey:
            `batch-receipt-${activeBatchAId}`,
        };

        const first =
          await repository
            .postMovement(
              input,
            );

        const replay =
          await repository
            .postMovement(
              input,
            );

        expect(
          first.idempotentReplay,
        ).toBe(false);

        expect(
          replay.idempotentReplay,
        ).toBe(true);

        expect(
          replay.entry.id,
        ).toBe(
          first.entry.id,
        );

        expect(
          replay.batchBalance
            ?.quantityOnHand,
        ).toBe(
          first.batchBalance
            ?.quantityOnHand,
        );

        const entries =
          await pool.query(
            `
            SELECT COUNT(*)::INTEGER AS count
            FROM inventory_stock_ledger
            WHERE idempotency_key = $1
            `,
            [
              input.idempotencyKey,
            ],
          );

        expect(
          entries.rows[0].count,
        ).toBe(1);
      },
    );

    it(
      'rolls back aggregate, Batch and ledger changes together',
      async () => {
        const aggregateBefore =
          await pool.query(
            `
            SELECT quantity_on_hand
            FROM inventory_stock_balances
            WHERE item_id = $1
              AND store_id = $2
            `,
            [
              trackedItemId,
              storeId,
            ],
          );

        const batchBefore =
          await pool.query(
            `
            SELECT quantity_on_hand
            FROM inventory_batch_balances
            WHERE batch_id = $1
              AND item_id = $2
              AND store_id = $3
            `,
            [
              activeBatchAId,
              trackedItemId,
              storeId,
            ],
          );

        const rollbackSource =
          `test.batch.rollback.${Date.now()}`;

        await expect(
          repository.withTransaction(
            async (
              transaction,
            ) => {
              await transaction
                .postMovement({
                  movementType:
                    InventoryStockMovementType
                      .RECEIPT,

                  itemId:
                    trackedItemId,

                  storeId,

                  batchId:
                    activeBatchAId,

                  quantityDelta:
                    3,

                  unitCost:
                    22,

                  sourceType:
                    rollbackSource,

                  idempotencyKey:
                    `${rollbackSource}.receipt`,
                });

              await transaction
                .postMovement({
                  movementType:
                    InventoryStockMovementType
                      .ISSUE,

                  itemId:
                    trackedItemId,

                  storeId,

                  batchId:
                    activeBatchBId,

                  quantityDelta:
                    -1000,

                  unitCost:
                    30,

                  sourceType:
                    rollbackSource,

                  idempotencyKey:
                    `${rollbackSource}.issue`,
                });
            },
          ),
        ).rejects.toThrow(
          'Inventory movement would create negative stock',
        );

        const aggregateAfter =
          await pool.query(
            `
            SELECT quantity_on_hand
            FROM inventory_stock_balances
            WHERE item_id = $1
              AND store_id = $2
            `,
            [
              trackedItemId,
              storeId,
            ],
          );

        const batchAfter =
          await pool.query(
            `
            SELECT quantity_on_hand
            FROM inventory_batch_balances
            WHERE batch_id = $1
              AND item_id = $2
              AND store_id = $3
            `,
            [
              activeBatchAId,
              trackedItemId,
              storeId,
            ],
          );

        expect(
          Number(
            aggregateAfter.rows[0]
              .quantity_on_hand,
          ),
        ).toBe(
          Number(
            aggregateBefore.rows[0]
              .quantity_on_hand,
          ),
        );

        expect(
          Number(
            batchAfter.rows[0]
              .quantity_on_hand,
          ),
        ).toBe(
          Number(
            batchBefore.rows[0]
              .quantity_on_hand,
          ),
        );

        const ledger =
          await pool.query(
            `
            SELECT id
            FROM inventory_stock_ledger
            WHERE source_type = $1
            `,
            [
              rollbackSource,
            ],
          );

        expect(
          ledger.rows,
        ).toHaveLength(0);
      },
    );
  },
);
