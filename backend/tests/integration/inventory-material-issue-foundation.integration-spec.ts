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
  'Inventory Material Issue database foundation',
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
      'creates Material Issue tables',
      async () => {
        const result =
          await pool.query(
            `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN (
                'inventory_material_issues',
                'inventory_material_issue_items'
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
          'inventory_material_issue_items',
          'inventory_material_issues',
        ]);
      },
    );

    it(
      'defines the Material Issue lifecycle',
      async () => {
        const result =
          await pool.query(
            `
            SELECT pg_get_constraintdef(
              oid
            ) AS definition
            FROM pg_constraint
            WHERE conname =
              'ck_inventory_material_issue_status'
            `,
          );

        expect(
          result.rows,
        ).toHaveLength(1);

        const definition =
          result.rows[0]
            .definition;

        expect(
          definition,
        ).toContain(
          'DRAFT',
        );

        expect(
          definition,
        ).toContain(
          'POSTED',
        );

        expect(
          definition,
        ).toContain(
          'CANCELLED',
        );
      },
    );

    it(
      'tracks Material Issue ownership and lifecycle actors',
      async () => {
        const result =
          await pool.query(
            `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name =
                'inventory_material_issues'
              AND column_name IN (
                'property_id',
                'store_id',
                'requested_by_person_id',
                'created_by_person_id',
                'posted_by_person_id',
                'cancelled_by_person_id',
                'posted_at',
                'cancelled_at'
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
          'cancelled_at',
          'cancelled_by_person_id',
          'created_by_person_id',
          'posted_at',
          'posted_by_person_id',
          'property_id',
          'requested_by_person_id',
          'store_id',
        ]);
      },
    );

    it(
      'requires positive issue quantities',
      async () => {
        const result =
          await pool.query(
            `
            SELECT pg_get_constraintdef(
              oid
            ) AS definition
            FROM pg_constraint
            WHERE conname =
              'ck_inventory_material_issue_item_quantity'
            `,
          );

        expect(
          result.rows,
        ).toHaveLength(1);

        expect(
          result.rows[0]
            .definition,
        ).toContain(
          'quantity >',
        );
      },
    );

    it(
      'prevents duplicate item and bin lines',
      async () => {
        const result =
          await pool.query(
            `
            SELECT indexdef AS definition
            FROM pg_indexes
            WHERE schemaname = 'public'
              AND tablename =
                'inventory_material_issue_items'
              AND indexname =
                'uq_inventory_material_issue_item'
            `,
          );

        expect(
          result.rows,
        ).toHaveLength(1);

        const definition =
          result.rows[0]
            .definition;

        expect(
          definition,
        ).toContain(
          'material_issue_id',
        );

        expect(
          definition,
        ).toContain(
          'item_id',
        );

        expect(
          definition,
        ).toContain(
          'bin_location_id',
        );

        expect(
          definition,
        ).toContain(
          'batch_id',
        );

        expect(
          definition,
        ).toContain(
          'COALESCE',
        );
      },
    );

    it(
      'enforces lifecycle actor metadata',
      async () => {
        const result =
          await pool.query(
            `
            SELECT conname
            FROM pg_constraint
            WHERE conname IN (
              'ck_inventory_material_issue_posted_state',
              'ck_inventory_material_issue_cancelled_state'
            )
            ORDER BY conname
            `,
          );

        expect(
          result.rows.map(
            (row) =>
              row.conname,
          ),
        ).toEqual([
          'ck_inventory_material_issue_cancelled_state',
          'ck_inventory_material_issue_posted_state',
        ]);
      },
    );
  },
);
