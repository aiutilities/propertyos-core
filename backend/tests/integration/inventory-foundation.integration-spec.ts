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
  'Inventory database foundation',
  () => {
    let app: any;
    let pool: Pool;

    beforeAll(
      async () => {
        const moduleRef =
          await Test.createTestingModule({
            imports: [
              AppModule,
            ],
          }).compile();

        app =
          moduleRef.createNestApplication();

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
      'creates the Inventory foundation tables',
      async () => {
        const expectedTables = [
          'inventory_units_of_measure',
          'inventory_item_categories',
          'inventory_brands',
          'inventory_items',
          'inventory_stores',
          'inventory_bin_locations',
          'inventory_stock_balances',
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
      'seeds the standard Units of Measure',
      async () => {
        const result =
          await pool.query(
            `
            SELECT code
            FROM inventory_units_of_measure
            WHERE code IN (
              'EA',
              'KG',
              'LTR',
              'MTR',
              'BOX'
            )
            ORDER BY code
            `,
          );

        expect(
          result.rows.map(
            (row) =>
              row.code,
          ),
        ).toEqual(
          [
            'BOX',
            'EA',
            'KG',
            'LTR',
            'MTR',
          ],
        );
      },
    );

    it(
      'seeds the Inventory categories',
      async () => {
        const result =
          await pool.query(
            `
            SELECT code
            FROM inventory_item_categories
            WHERE code IN (
              'GENERAL',
              'CONSUMABLES',
              'SPARES',
              'TOOLS'
            )
            ORDER BY code
            `,
          );

        expect(
          result.rows.map(
            (row) =>
              row.code,
          ),
        ).toEqual(
          [
            'CONSUMABLES',
            'GENERAL',
            'SPARES',
            'TOOLS',
          ],
        );
      },
    );

    it(
      'calculates available stock',
      async () => {
        const result =
          await pool.query(
            `
            SELECT
              12.500000::NUMERIC
              - 2.250000::NUMERIC
                AS available_quantity
            `,
          );

        expect(
          Number(
            result.rows[0]
              .available_quantity,
          ),
        ).toBe(
          10.25,
        );
      },
    );
  },
);
