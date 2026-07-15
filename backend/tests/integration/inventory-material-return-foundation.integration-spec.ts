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
  'Inventory Material Return database foundation',
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
      'creates Material Return tables',
      async () => {
        const result =
          await pool.query(
            `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN (
                'inventory_material_returns',
                'inventory_material_return_items'
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
          'inventory_material_return_items',
          'inventory_material_returns',
        ]);
      },
    );

    it(
      'defines the Material Return lifecycle',
      async () => {
        const result =
          await pool.query(
            `
            SELECT pg_get_constraintdef(
              oid
            ) AS definition
            FROM pg_constraint
            WHERE conname =
              'ck_inventory_material_return_status'
            `,
          );

        expect(
          result.rows,
        ).toHaveLength(1);

        const definition =
          result.rows[0]
            .definition;

        expect(definition)
          .toContain('DRAFT');

        expect(definition)
          .toContain('POSTED');

        expect(definition)
          .toContain('CANCELLED');
      },
    );

    it(
      'links returns to the original Material Issue',
      async () => {
        const result =
          await pool.query(
            `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name =
                'inventory_material_returns'
              AND column_name IN (
                'material_issue_id',
                'returned_by_person_id'
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
          'material_issue_id',
          'returned_by_person_id',
        ]);
      },
    );

    it(
      'requires positive quantities and non-negative costs',
      async () => {
        const result =
          await pool.query(
            `
            SELECT conname
            FROM pg_constraint
            WHERE conname IN (
              'ck_inventory_material_return_quantity',
              'ck_inventory_material_return_cost'
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
          'ck_inventory_material_return_cost',
          'ck_inventory_material_return_quantity',
        ]);
      },
    );

    it(
      'prevents duplicate item and bin lines',
      async () => {
        const result =
          await pool.query(
            `
            SELECT pg_get_constraintdef(
              oid
            ) AS definition
            FROM pg_constraint
            WHERE conname =
              'uq_inventory_material_return_item'
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
            'material_return_id',
          );

        expect(definition)
          .toContain(
            'item_id',
          );

        expect(definition)
          .toContain(
            'bin_location_id',
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
              'ck_inventory_material_return_posted_state',
              'ck_inventory_material_return_cancelled_state'
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
          'ck_inventory_material_return_cancelled_state',
          'ck_inventory_material_return_posted_state',
        ]);
      },
    );
  },
);
