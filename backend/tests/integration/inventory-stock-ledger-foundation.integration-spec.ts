import {
  Test,
} from '@nestjs/testing';

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
  'Inventory stock-ledger database foundation',
  () => {
    let app: any;
    let pool: Pool;

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
      },
    );

    afterAll(
      async () => {
        if (app) {
          await app.close();
        }
      },
    );

    it(
      'creates all Stock Ledger foundation tables',
      async () => {
        const expectedTables = [
          'inventory_stock_ledger',
          'inventory_stock_reservations',
          'inventory_stock_adjustments',
          'inventory_stock_adjustment_items',
          'inventory_stock_transfers',
          'inventory_stock_transfer_items',
        ];

        const result =
          await pool.query(
            `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name =
                ANY($1::TEXT[])
            ORDER BY table_name
            `,
            [
              expectedTables,
            ],
          );

        expect(
          result.rows.map(
            (row) =>
              row.table_name,
          ),
        ).toEqual(
          [
            ...expectedTables,
          ].sort(),
        );
      },
    );

    it(
      'defines the immutable ledger movement constraint',
      async () => {
        const result =
          await pool.query(
            `
            SELECT constraint_name
            FROM information_schema
              .table_constraints
            WHERE table_schema = 'public'
              AND table_name =
                'inventory_stock_ledger'
              AND constraint_name =
                'ck_inventory_stock_ledger_quantity'
            `,
          );

        expect(
          result.rowCount,
        ).toBe(1);
      },
    );

    it(
      'defines idempotent ledger posting',
      async () => {
        const result =
          await pool.query(
            `
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND tablename =
                'inventory_stock_ledger'
              AND indexname =
                'uq_inventory_stock_ledger_idempotency'
            `,
          );

        expect(
          result.rowCount,
        ).toBe(1);
      },
    );

    it(
      'supports reservation lifecycle statuses',
      async () => {
        const result =
          await pool.query(
            `
            SELECT
              pg_get_constraintdef(
                oid
              ) AS definition
            FROM pg_constraint
            WHERE conname =
              'ck_inventory_reservation_status'
            `,
          );

        const definition =
          String(
            result.rows[0]
              ?.definition ?? '',
          );

        expect(
          definition,
        ).toContain(
          'PARTIALLY_FULFILLED',
        );

        expect(
          definition,
        ).toContain(
          'EXPIRED',
        );
      },
    );

    it(
      'prevents same-store transfers',
      async () => {
        const result =
          await pool.query(
            `
            SELECT constraint_name
            FROM information_schema
              .table_constraints
            WHERE table_schema = 'public'
              AND table_name =
                'inventory_stock_transfers'
              AND constraint_name =
                'ck_inventory_transfer_stores'
            `,
          );

        expect(
          result.rowCount,
        ).toBe(1);
      },
    );
  },
);
