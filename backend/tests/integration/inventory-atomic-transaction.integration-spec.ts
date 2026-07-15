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
  'Inventory atomic transaction framework',
  () => {
    let app: any;
    let pool: Pool;

    let repository:
      InventoryStockLedgerRepository;

    const propertyId =
      randomUUID();

    const firstItemId =
      randomUUID();

    const secondItemId =
      randomUUID();

    const storeId =
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
            'Atomic Inventory Test Property',
            `INV-ATOMIC-${Date.now()}`,
            'BOUTIQUE_ROOMS',
            'Chengalpattu',
            'Tamil Nadu',
            'India',
            true,
          ],
        );

        for (
          const [
            id,
            suffix,
          ] of [
            [
              firstItemId,
              'A',
            ],
            [
              secondItemId,
              'B',
            ],
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
              is_active
            )
            VALUES (
              $1,$2,$3,$4,$5,$6,
              0,0,0,0,'INR',TRUE
            )
            `,
            [
              id,
              `ATOMIC-${suffix}-${Date.now()}`,
              `Atomic Transaction Item ${suffix}`,
              categoryId,
              unitId,
              'CONSUMABLE',
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
            `ATM-${String(
              Date.now(),
            ).slice(-8)}`,
            'Atomic Transaction Store',
            propertyId,
          ],
        );
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
              firstItemId,
              secondItemId,
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
              firstItemId,
              secondItemId,
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
              $1,
              $2
            )
            `,
            [
              firstItemId,
              secondItemId,
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
      'commits every movement when the transaction succeeds',
      async () => {
        await repository
          .withTransaction(
            async (
              transaction,
            ) => {
              await transaction
                .postMovement({
                  movementType:
                    InventoryStockMovementType
                      .OPENING,

                  itemId:
                    firstItemId,

                  storeId,

                  quantityDelta:
                    10,

                  unitCost:
                    50,

                  sourceType:
                    'test.atomic.commit',

                  idempotencyKey:
                    `atomic-commit-${firstItemId}`,
                });

              await transaction
                .postMovement({
                  movementType:
                    InventoryStockMovementType
                      .OPENING,

                  itemId:
                    secondItemId,

                  storeId,

                  quantityDelta:
                    20,

                  unitCost:
                    25,

                  sourceType:
                    'test.atomic.commit',

                  idempotencyKey:
                    `atomic-commit-${secondItemId}`,
                });
            },
          );

        const result =
          await pool.query(
            `
            SELECT
              item_id,
              quantity_on_hand
            FROM inventory_stock_balances
            WHERE item_id IN (
              $1,
              $2
            )
            ORDER BY item_id
            `,
            [
              firstItemId,
              secondItemId,
            ],
          );

        expect(
          result.rows,
        ).toHaveLength(2);

        expect(
          result.rows.map(
            (row) =>
              Number(
                row.quantity_on_hand,
              ),
          ).sort(
            (
              left,
              right,
            ) =>
              left - right,
          ),
        ).toEqual([
          10,
          20,
        ]);
      },
    );

    it(
      'serializes concurrent work using the same transaction lock',
      async () => {
        const order:
          string[] = [];

        const first =
          repository.withTransaction(
            async (
              transaction,
            ) => {
              await transaction
                .acquireLock(
                  'inventory-linked-return-test',
                );

              order.push(
                'first-locked',
              );

              await new Promise(
                (
                  resolve,
                ) =>
                  setTimeout(
                    resolve,
                    100,
                  ),
              );

              order.push(
                'first-complete',
              );
            },
          );

        await new Promise(
          (
            resolve,
          ) =>
            setTimeout(
              resolve,
              20,
            ),
        );

        const second =
          repository.withTransaction(
            async (
              transaction,
            ) => {
              order.push(
                'second-started',
              );

              await transaction
                .acquireLock(
                  'inventory-linked-return-test',
                );

              order.push(
                'second-locked',
              );
            },
          );

        await Promise.all([
          first,
          second,
        ]);

        expect(
          order.indexOf(
            'second-locked',
          ),
        ).toBeGreaterThan(
          order.indexOf(
            'first-complete',
          ),
        );
      },
    );

    it(
      'rolls back an earlier movement when a later movement fails',
      async () => {
        const firstBalanceBefore =
          await pool.query(
            `
            SELECT quantity_on_hand
            FROM inventory_stock_balances
            WHERE item_id = $1
              AND store_id = $2
            `,
            [
              firstItemId,
              storeId,
            ],
          );

        const secondBalanceBefore =
          await pool.query(
            `
            SELECT quantity_on_hand
            FROM inventory_stock_balances
            WHERE item_id = $1
              AND store_id = $2
            `,
            [
              secondItemId,
              storeId,
            ],
          );

        await expect(
          repository
            .withTransaction(
              async (
                transaction,
              ) => {
                await transaction
                  .postMovement({
                    movementType:
                      InventoryStockMovementType
                        .RECEIPT,

                    itemId:
                      firstItemId,

                    storeId,

                    quantityDelta:
                      5,

                    unitCost:
                      50,

                    sourceType:
                      'test.atomic.rollback',

                    idempotencyKey:
                      `atomic-rollback-${firstItemId}`,
                  });

                await transaction
                  .postMovement({
                    movementType:
                      InventoryStockMovementType
                        .ISSUE,

                    itemId:
                      secondItemId,

                    storeId,

                    quantityDelta:
                      -1000,

                    unitCost:
                      25,

                    sourceType:
                      'test.atomic.rollback',

                    idempotencyKey:
                      `atomic-rollback-${secondItemId}`,
                  });
              },
            ),
        ).rejects.toThrow(
          'Inventory movement would create negative stock',
        );

        const firstBalanceAfter =
          await pool.query(
            `
            SELECT quantity_on_hand
            FROM inventory_stock_balances
            WHERE item_id = $1
              AND store_id = $2
            `,
            [
              firstItemId,
              storeId,
            ],
          );

        const secondBalanceAfter =
          await pool.query(
            `
            SELECT quantity_on_hand
            FROM inventory_stock_balances
            WHERE item_id = $1
              AND store_id = $2
            `,
            [
              secondItemId,
              storeId,
            ],
          );

        expect(
          Number(
            firstBalanceAfter
              .rows[0]
              .quantity_on_hand,
          ),
        ).toBe(
          Number(
            firstBalanceBefore
              .rows[0]
              .quantity_on_hand,
          ),
        );

        expect(
          Number(
            secondBalanceAfter
              .rows[0]
              .quantity_on_hand,
          ),
        ).toBe(
          Number(
            secondBalanceBefore
              .rows[0]
              .quantity_on_hand,
          ),
        );

        const rolledBackEntries =
          await pool.query(
            `
            SELECT id
            FROM inventory_stock_ledger
            WHERE source_type =
              'test.atomic.rollback'
            `,
          );

        expect(
          rolledBackEntries.rows,
        ).toHaveLength(0);
      },
    );
  },
);
