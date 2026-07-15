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
  'Inventory Cycle Count database foundation',
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
      'creates Cycle Count tables',
      async () => {
        const result =
          await pool.query(
            `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN (
                'inventory_cycle_counts',
                'inventory_cycle_count_items'
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
          'inventory_cycle_count_items',
          'inventory_cycle_counts',
        ]);
      },
    );

    it(
      'defines the Cycle Count lifecycle statuses',
      async () => {
        const result =
          await pool.query(
            `
            SELECT pg_get_constraintdef(
              oid
            ) AS definition
            FROM pg_constraint
            WHERE conname =
              'ck_inventory_cycle_count_status'
            `,
          );

        expect(
          result.rows,
        ).toHaveLength(1);

        expect(
          result.rows[0]
            .definition,
        ).toContain(
          'DRAFT',
        );

        expect(
          result.rows[0]
            .definition,
        ).toContain(
          'IN_PROGRESS',
        );

        expect(
          result.rows[0]
            .definition,
        ).toContain(
          'COMPLETED',
        );

        expect(
          result.rows[0]
            .definition,
        ).toContain(
          'POSTED',
        );

        expect(
          result.rows[0]
            .definition,
        ).toContain(
          'CANCELLED',
        );
      },
    );

    it(
      'prevents multiple open counts for one store',
      async () => {
        const result =
          await pool.query(
            `
            SELECT indexdef
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND indexname =
                'uq_inventory_open_cycle_count_store'
            `,
          );

        expect(
          result.rows,
        ).toHaveLength(1);

        expect(
          result.rows[0]
            .indexdef,
        ).toContain(
          'inventory_cycle_counts',
        );

        expect(
          result.rows[0]
            .indexdef,
        ).toContain(
          'DRAFT',
        );

        expect(
          result.rows[0]
            .indexdef,
        ).toContain(
          'IN_PROGRESS',
        );

        expect(
          result.rows[0]
            .indexdef,
        ).toContain(
          'COMPLETED',
        );
      },
    );

    it(
      'supports store, bin, and item count scopes',
      async () => {
        const result =
          await pool.query(
            `
            SELECT pg_get_constraintdef(
              oid
            ) AS definition
            FROM pg_constraint
            WHERE conname =
              'ck_inventory_cycle_count_scope'
            `,
          );

        expect(
          result.rows,
        ).toHaveLength(1);

        expect(
          result.rows[0]
            .definition,
        ).toContain(
          'STORE',
        );

        expect(
          result.rows[0]
            .definition,
        ).toContain(
          'BIN',
        );

        expect(
          result.rows[0]
            .definition,
        ).toContain(
          'ITEM',
        );
      },
    );

    it(
      'tracks system, counted, variance, and valuation quantities',
      async () => {
        const result =
          await pool.query(
            `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name =
                'inventory_cycle_count_items'
              AND column_name IN (
                'system_quantity',
                'counted_quantity',
                'variance_quantity',
                'average_unit_cost',
                'variance_value'
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
          'counted_quantity',
          'system_quantity',
          'variance_quantity',
          'variance_value',
        ]);
      },
    );

    it(
      'enforces computed variance quantities',
      async () => {
        const result =
          await pool.query(
            `
            SELECT
              conname,
              pg_get_constraintdef(
                oid
              ) AS definition
            FROM pg_constraint
            WHERE conname IN (
              'ck_inventory_cycle_count_variance',
              'ck_inventory_cycle_count_variance_value'
            )
            ORDER BY conname
            `,
          );

        expect(
          result.rows,
        ).toHaveLength(2);

        const definitions =
          result.rows
            .map(
              (row) =>
                row.definition,
            )
            .join(' ');

        expect(
          definitions,
        ).toContain(
          'counted_quantity',
        );

        expect(
          definitions,
        ).toContain(
          'system_quantity',
        );

        expect(
          definitions,
        ).toContain(
          'average_unit_cost',
        );
      },
    );
  },
);
