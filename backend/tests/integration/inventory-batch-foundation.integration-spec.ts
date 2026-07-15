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
  'Inventory Batch database foundation',
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
      'creates Batch master and balance tables',
      async () => {
        const result =
          await pool.query(
            `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN (
                'inventory_batches',
                'inventory_batch_balances'
              )
            ORDER BY table_name
            `,
          );

        expect(
          result.rows.map(
            (row) =>
              row.table_name,
          ),
        ).toEqual([
          'inventory_batch_balances',
          'inventory_batches',
        ]);
      },
    );

    it(
      'supports manufacture and expiry dates',
      async () => {
        const result =
          await pool.query(
            `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name =
                'inventory_batches'
              AND column_name IN (
                'manufacturer_batch_number',
                'manufacture_date',
                'expiry_date'
              )
            ORDER BY column_name
            `,
          );

        expect(
          result.rows.map(
            (row) =>
              row.column_name,
          ),
        ).toEqual([
          'expiry_date',
          'manufacture_date',
          'manufacturer_batch_number',
        ]);
      },
    );

    it(
      'defines the Batch lifecycle statuses',
      async () => {
        const result =
          await pool.query(
            `
            SELECT pg_get_constraintdef(
              oid
            ) AS definition
            FROM pg_constraint
            WHERE conname =
              'ck_inventory_batch_status'
            `,
          );

        expect(
          result.rows,
        ).toHaveLength(1);

        const definition =
          result.rows[0]
            .definition;

        expect(definition)
          .toContain('ACTIVE');

        expect(definition)
          .toContain('HOLD');

        expect(definition)
          .toContain('EXPIRED');

        expect(definition)
          .toContain('CLOSED');
      },
    );

    it(
      'prevents expiry before manufacture',
      async () => {
        const result =
          await pool.query(
            `
            SELECT pg_get_constraintdef(
              oid
            ) AS definition
            FROM pg_constraint
            WHERE conname =
              'ck_inventory_batch_dates'
            `,
          );

        expect(
          result.rows,
        ).toHaveLength(1);

        expect(
          result.rows[0]
            .definition,
        ).toContain(
          'expiry_date >= manufacture_date',
        );
      },
    );

    it(
      'tracks Batch quantity by store and optional bin',
      async () => {
        const result =
          await pool.query(
            `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name =
                'inventory_batch_balances'
              AND column_name IN (
                'batch_id',
                'item_id',
                'store_id',
                'bin_location_id',
                'quantity_on_hand',
                'reserved_quantity',
                'average_unit_cost'
              )
            ORDER BY column_name
            `,
          );

        expect(
          result.rows.map(
            (row) =>
              row.column_name,
          ),
        ).toEqual([
          'average_unit_cost',
          'batch_id',
          'bin_location_id',
          'item_id',
          'quantity_on_hand',
          'reserved_quantity',
          'store_id',
        ]);
      },
    );

    it(
      'enforces valid Batch balance quantities',
      async () => {
        const result =
          await pool.query(
            `
            SELECT pg_get_constraintdef(
              oid
            ) AS definition
            FROM pg_constraint
            WHERE conname =
              'ck_inventory_batch_balance_quantities'
            `,
          );

        expect(
          result.rows,
        ).toHaveLength(1);

        const definition =
          result.rows[0]
            .definition;

        expect(definition)
          .toContain(
            'quantity_on_hand >=',
          );

        expect(definition)
          .toContain(
            'reserved_quantity <= quantity_on_hand',
          );
      },
    );

    it(
      'links immutable ledger movements to an optional Batch',
      async () => {
        const columnResult =
          await pool.query(
            `
            SELECT
              is_nullable,
              data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name =
                'inventory_stock_ledger'
              AND column_name =
                'batch_id'
            `,
          );

        expect(
          columnResult.rows,
        ).toHaveLength(1);

        expect(
          columnResult.rows[0]
            .is_nullable,
        ).toBe('YES');

        expect(
          columnResult.rows[0]
            .data_type,
        ).toBe('uuid');

        const foreignKeyResult =
          await pool.query(
            `
            SELECT
              foreign_table.table_name
                AS foreign_table_name
            FROM information_schema
              .table_constraints constraint_record
            INNER JOIN information_schema
              .key_column_usage key_usage
              ON constraint_record
                .constraint_name =
                key_usage.constraint_name
              AND constraint_record
                .constraint_schema =
                key_usage.constraint_schema
            INNER JOIN information_schema
              .constraint_column_usage
                foreign_table
              ON foreign_table
                .constraint_name =
                constraint_record
                  .constraint_name
              AND foreign_table
                .constraint_schema =
                constraint_record
                  .constraint_schema
            WHERE constraint_record
                .constraint_type =
                'FOREIGN KEY'
              AND constraint_record
                .table_schema =
                'public'
              AND constraint_record
                .table_name =
                'inventory_stock_ledger'
              AND key_usage
                .column_name =
                'batch_id'
            `,
          );

        expect(
          foreignKeyResult.rows,
        ).toHaveLength(1);

        expect(
          foreignKeyResult.rows[0]
            .foreign_table_name,
        ).toBe(
          'inventory_batches',
        );
      },
    );
  },
);
