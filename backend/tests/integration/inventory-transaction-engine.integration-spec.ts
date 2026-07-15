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
  'Inventory transactional posting engine',
  () => {
    let app: any;
    let pool: Pool;

    let repository:
      InventoryStockLedgerRepository;

    const propertyId =
      randomUUID();

    const itemId =
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
            'Inventory Transaction Test Property',
            `INV-TXN-${Date.now()}`,
            'BOUTIQUE_ROOMS',
            'Chengalpattu',
            'Tamil Nadu',
            'India',
            true,
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
            itemId,
            `TXN-${Date.now()}`,
            'Transaction Engine Test Item',
            categoryId,
            unitId,
            'CONSUMABLE',
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
            `TXN-${String(
              Date.now(),
            ).slice(-8)}`,
            'Transaction Test Store',
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
            WHERE id = $1
            `,
            [
              itemId,
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
      'posts an opening stock movement',
      async () => {
        const result =
          await repository
            .postMovement({
              movementType:
                InventoryStockMovementType.OPENING,

              itemId,
              storeId,

              quantityDelta:
                10,

              unitCost:
                100,

              sourceType:
                'inventory.test',

              idempotencyKey:
                `opening:${itemId}`,
            });

        expect(
          result.idempotentReplay,
        ).toBe(false);

        expect(
          result.balance
            .quantityOnHand,
        ).toBe(10);

        expect(
          result.balance
            .averageUnitCost,
        ).toBe(100);

        expect(
          result.entry
            .quantityBefore,
        ).toBe(0);

        expect(
          result.entry
            .quantityAfter,
        ).toBe(10);
      },
    );

    it(
      'calculates weighted-average cost for receipts',
      async () => {
        const result =
          await repository
            .postMovement({
              movementType:
                InventoryStockMovementType.RECEIPT,

              itemId,
              storeId,

              quantityDelta:
                10,

              unitCost:
                200,

              sourceType:
                'inventory.test',

              idempotencyKey:
                `receipt:${itemId}`,
            });

        expect(
          result.balance
            .quantityOnHand,
        ).toBe(20);

        expect(
          result.balance
            .averageUnitCost,
        ).toBe(150);

        expect(
          result.entry
            .averageUnitCostBefore,
        ).toBe(100);

        expect(
          result.entry
            .averageUnitCostAfter,
        ).toBe(150);
      },
    );

    it(
      'keeps average cost unchanged for stock issues',
      async () => {
        const result =
          await repository
            .postMovement({
              movementType:
                InventoryStockMovementType.ISSUE,

              itemId,
              storeId,

              quantityDelta:
                -5,

              sourceType:
                'inventory.test',

              idempotencyKey:
                `issue:${itemId}`,
            });

        expect(
          result.balance
            .quantityOnHand,
        ).toBe(15);

        expect(
          result.balance
            .averageUnitCost,
        ).toBe(150);

        expect(
          result.entry
            .quantityDelta,
        ).toBe(-5);
      },
    );

    it(
      'replays idempotent postings without changing stock',
      async () => {
        const result =
          await repository
            .postMovement({
              movementType:
                InventoryStockMovementType.RECEIPT,

              itemId,
              storeId,

              quantityDelta:
                10,

              unitCost:
                200,

              sourceType:
                'inventory.test',

              idempotencyKey:
                `receipt:${itemId}`,
            });

        expect(
          result.idempotentReplay,
        ).toBe(true);

        expect(
          result.balance
            .quantityOnHand,
        ).toBe(15);

        const entries =
          await repository
            .listStockLedger({
              itemId,
              storeId,
            });

        expect(
          entries.filter(
            (entry) =>
              entry.idempotencyKey ===
              `receipt:${itemId}`,
          ),
        ).toHaveLength(1);
      },
    );

    it(
      'posts and releases stock reservations',
      async () => {
        const reservation =
          await repository
            .postMovement({
              movementType:
                InventoryStockMovementType.RESERVATION,

              itemId,
              storeId,

              quantityDelta:
                0,

              reservedQuantityDelta:
                4,

              sourceType:
                'inventory.test',

              idempotencyKey:
                `reserve:${itemId}`,
            });

        expect(
          reservation.balance
            .reservedQuantity,
        ).toBe(4);

        expect(
          reservation.balance
            .availableQuantity,
        ).toBe(11);

        const release =
          await repository
            .postMovement({
              movementType:
                InventoryStockMovementType.RESERVATION_RELEASE,

              itemId,
              storeId,

              quantityDelta:
                0,

              reservedQuantityDelta:
                -4,

              sourceType:
                'inventory.test',

              idempotencyKey:
                `release:${itemId}`,
            });

        expect(
          release.balance
            .reservedQuantity,
        ).toBe(0);

        expect(
          release.balance
            .availableQuantity,
        ).toBe(15);
      },
    );

    it(
      'rejects movements that would create negative stock',
      async () => {
        await expect(
          repository
            .postMovement({
              movementType:
                InventoryStockMovementType.ISSUE,

              itemId,
              storeId,

              quantityDelta:
                -100,

              sourceType:
                'inventory.test',

              idempotencyKey:
                `overdraw:${itemId}`,
            }),
        ).rejects.toThrow(
          'negative stock',
        );

        const balance =
          await pool.query(
            `
            SELECT quantity_on_hand
            FROM inventory_stock_balances
            WHERE item_id = $1
              AND store_id = $2
            `,
            [
              itemId,
              storeId,
            ],
          );

        expect(
          Number(
            balance.rows[0]
              .quantity_on_hand,
          ),
        ).toBe(15);
      },
    );

    it(
      'persists a complete immutable movement trail',
      async () => {
        const entries =
          await repository
            .listStockLedger({
              itemId,
              storeId,
              limit:
                100,
            });

        expect(
          entries.map(
            (entry) =>
              entry.movementType,
          ),
        ).toEqual(
          expect.arrayContaining([
            InventoryStockMovementType.OPENING,
            InventoryStockMovementType.RECEIPT,
            InventoryStockMovementType.ISSUE,
            InventoryStockMovementType.RESERVATION,
            InventoryStockMovementType.RESERVATION_RELEASE,
          ]),
        );

        expect(
          entries.every(
            (entry) =>
              entry.quantityAfter ===
              entry.quantityBefore +
              entry.quantityDelta,
          ),
        ).toBe(true);
      },
    );
  },
);
