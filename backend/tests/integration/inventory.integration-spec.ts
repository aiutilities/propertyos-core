import {
  Test,
} from '@nestjs/testing';

import {
  createHash,
  randomUUID,
} from 'crypto';

import {
  Pool,
} from 'pg';

import request from 'supertest';

import {
  AppModule,
} from '../../src/app.module';

import {
  AuditService,
} from '../../src/core/audit/audit.service';

import {
  Permissions,
} from '../../src/core/auth/constants/permissions';

import {
  EventBusService,
} from '../../src/core/eventbus/services/eventbus.service';

import {
  INVENTORY_EVENTS,
  INVENTORY_PERMISSIONS,
} from '../../src/core/inventory/inventory.constants';

import {
  POSTGRES_POOL,
} from '../../src/database/postgres';

describe(
  'Inventory master-data API integration',
  () => {
    let app: any;
    let pool: Pool;
    let eventBus:
      EventBusService;
    let auditService:
      AuditService;
    let accessToken = '';

    const timestamp =
      Date.now();

    const password =
      'CorrectHorseBatteryStaple123!';

    const email =
      `inventory-e2e-${timestamp}@propertyos.test`;

    const personId =
      randomUUID();

    const credentialId =
      randomUUID();

    const roleId =
      randomUUID();

    const personRoleId =
      randomUUID();

    const propertyId =
      randomUUID();

    let unitId = '';
    let categoryId = '';
    let brandId = '';
    let itemId = '';
    let storeId = '';
    let binId = '';

    const unitCode =
      `PK${String(
        timestamp,
      ).slice(-6)}`;

    const categoryCode =
      `ELEC${String(
        timestamp,
      ).slice(-6)}`;

    const brandCode =
      `BR${String(
        timestamp,
      ).slice(-6)}`;

    const itemSku =
      `INV-${timestamp}`;

    const storeCode =
      `MAIN-${String(
        timestamp,
      ).slice(-6)}`;

    const binCode =
      `A-${String(
        timestamp,
      ).slice(-6)}`;

    const permissionKeys = [
      INVENTORY_PERMISSIONS.READ,
      INVENTORY_PERMISSIONS.CREATE,
      INVENTORY_PERMISSIONS.UPDATE,
      INVENTORY_PERMISSIONS.MANAGE,
      INVENTORY_PERMISSIONS.ITEMS,
      INVENTORY_PERMISSIONS.STORES,
      INVENTORY_PERMISSIONS.STOCK,
      INVENTORY_PERMISSIONS.TRANSFER,
      INVENTORY_PERMISSIONS.ADJUST,
      INVENTORY_PERMISSIONS.COUNT,
      INVENTORY_PERMISSIONS.CONFIGURE,
      Permissions.SEARCH_READ,
    ];

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

        app.setGlobalPrefix(
          'api/v1',
        );

        await app.init();

        pool =
          app.get(
            POSTGRES_POOL,
          );

        eventBus =
          app.get(
            EventBusService,
          );

        auditService =
          app.get(
            AuditService,
          );

        const salt =
          randomUUID()
            .replace(
              /-/g,
              '',
            );

        const hash =
          createHash('sha256')
            .update(
              `${salt}:${password}`,
            )
            .digest('hex');

        await pool.query(
          `
          INSERT INTO persons (
            id,
            display_name,
            email,
            phone,
            status
          )
          VALUES (
            $1,$2,$3,$4,$5
          )
          `,
          [
            personId,
            'Inventory E2E Administrator',
            email,
            `91${String(
              timestamp,
            ).slice(-8)}`,
            'ACTIVE',
          ],
        );

        await pool.query(
          `
          INSERT INTO credentials (
            id,
            person_id,
            credential_type,
            credential_value
          )
          VALUES (
            $1,$2,$3,$4
          )
          `,
          [
            credentialId,
            personId,
            'PASSWORD',
            `sha256:${salt}:${hash}`,
          ],
        );

        await pool.query(
          `
          INSERT INTO roles (
            id,
            name,
            description
          )
          VALUES (
            $1,$2,$3
          )
          `,
          [
            roleId,
            `Inventory E2E Role ${timestamp}`,
            'Inventory integration test role',
          ],
        );

        await pool.query(
          `
          INSERT INTO person_roles (
            id,
            person_id,
            role_id
          )
          VALUES (
            $1,$2,$3
          )
          `,
          [
            personRoleId,
            personId,
            roleId,
          ],
        );

        for (
          const permissionKey
          of permissionKeys
        ) {
          await pool.query(
            `
            INSERT INTO permissions (
              id,
              permission_key,
              description
            )
            VALUES (
              $1,$2,$3
            )
            ON CONFLICT (
              permission_key
            ) DO NOTHING
            `,
            [
              randomUUID(),
              permissionKey,
              `Inventory integration permission: ${permissionKey}`,
            ],
          );

          const permission =
            await pool.query(
              `
              SELECT id
              FROM permissions
              WHERE permission_key = $1
              `,
              [
                permissionKey,
              ],
            );

          await pool.query(
            `
            INSERT INTO role_permissions (
              id,
              role_id,
              permission_id
            )
            VALUES (
              $1,$2,$3
            )
            `,
            [
              randomUUID(),
              roleId,
              permission.rows[0].id,
            ],
          );
        }

        await pool.query(
          `
          INSERT INTO properties (
            id,
            name,
            code,
            property_type,
            description,
            city,
            state,
            country,
            is_active
          )
          VALUES (
            $1,$2,$3,$4,$5,
            $6,$7,$8,$9
          )
          `,
          [
            propertyId,
            'Inventory E2E Property',
            `INV-E2E-${timestamp}`,
            'BOUTIQUE_ROOMS',
            'Inventory integration test property',
            'Chengalpattu',
            'Tamil Nadu',
            'India',
            true,
          ],
        );

        const login =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/auth/login',
            )
            .send({
              email,
              password,
            })
            .expect(201);

        accessToken =
          login.body.accessToken;
      },
    );

    afterAll(
      async () => {
        if (pool) {
          const entityIds = [
            unitId,
            categoryId,
            brandId,
            itemId,
            storeId,
            binId,
          ].filter(Boolean);

          for (
            const entityId
            of entityIds
          ) {
            await pool.query(
              `
              DELETE FROM audit_logs
              WHERE source =
                'core.inventory'
                AND payload::text
                  ILIKE $1
              `,
              [
                `%${entityId}%`,
              ],
            );
          }

          if (itemId) {
            await pool.query(
              `
              DELETE FROM inventory_stock_balances
              WHERE item_id = $1
              `,
              [
                itemId,
              ],
            );
          }

          if (storeId) {
            await pool.query(
              `
              DELETE FROM inventory_stock_balances
              WHERE store_id = $1
              `,
              [
                storeId,
              ],
            );
          }

          if (binId) {
            await pool.query(
              `
              DELETE FROM inventory_bin_locations
              WHERE id = $1
              `,
              [
                binId,
              ],
            );
          }

          if (itemId) {
            await pool.query(
              `
              DELETE FROM inventory_items
              WHERE id = $1
              `,
              [
                itemId,
              ],
            );
          }

          if (storeId) {
            await pool.query(
              `
              DELETE FROM inventory_stores
              WHERE id = $1
              `,
              [
                storeId,
              ],
            );
          }

          if (brandId) {
            await pool.query(
              `
              DELETE FROM inventory_brands
              WHERE id = $1
              `,
              [
                brandId,
              ],
            );
          }

          if (categoryId) {
            await pool.query(
              `
              DELETE FROM inventory_item_categories
              WHERE id = $1
              `,
              [
                categoryId,
              ],
            );
          }

          if (unitId) {
            await pool.query(
              `
              DELETE FROM inventory_units_of_measure
              WHERE id = $1
              `,
              [
                unitId,
              ],
            );
          }

          await pool.query(
            `
            DELETE FROM properties
            WHERE id = $1
            `,
            [
              propertyId,
            ],
          );

          await pool.query(
            `
            DELETE FROM role_permissions
            WHERE role_id = $1
            `,
            [
              roleId,
            ],
          );

          await pool.query(
            `
            DELETE FROM person_roles
            WHERE person_id = $1
            `,
            [
              personId,
            ],
          );

          await pool.query(
            `
            DELETE FROM roles
            WHERE id = $1
            `,
            [
              roleId,
            ],
          );

          await pool.query(
            `
            DELETE FROM credentials
            WHERE person_id = $1
            `,
            [
              personId,
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
      'rejects unauthenticated Inventory access',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .get(
            '/api/v1/inventory/items',
          )
          .expect(401);
      },
    );

    it(
      'lists seeded Units of Measure',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/inventory/units',
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .expect(200);

        expect(
          response.body.success,
        ).toBe(true);

        expect(
          response.body.data.some(
            (unit: any) =>
              unit.code === 'EA',
          ),
        ).toBe(true);
      },
    );

    it(
      'lists seeded Inventory categories',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/inventory/categories',
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .expect(200);

        expect(
          response.body.data.some(
            (category: any) =>
              category.code ===
              'GENERAL',
          ),
        ).toBe(true);
      },
    );

    it(
      'creates a Unit of Measure',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/inventory/units',
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              code:
                unitCode,
              name:
                'Inventory Test Pack',
              symbol:
                'pack',
              decimalPlaces:
                0,
              createdByPersonId:
                personId,
            })
            .expect(201);

        unitId =
          response.body.data.id;

        expect(
          response.body.data.code,
        ).toBe(
          unitCode,
        );
      },
    );

    it(
      'rejects a duplicate Unit of Measure code',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/inventory/units',
          )
          .set(
            'Authorization',
            `Bearer ${accessToken}`,
          )
          .send({
            code:
              unitCode,
            name:
              'Duplicate Pack',
            symbol:
              'dup',
            decimalPlaces:
              0,
            createdByPersonId:
              personId,
          })
          .expect(409);
      },
    );

    it(
      'updates the Unit of Measure',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .patch(
              `/api/v1/inventory/units/${unitId}`,
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              name:
                'Inventory Test Package',
              symbol:
                'pkg',
              decimalPlaces:
                0,
              updatedByPersonId:
                personId,
              remarks:
                'Standardized package name',
            })
            .expect(200);

        expect(
          response.body.data.name,
        ).toBe(
          'Inventory Test Package',
        );
      },
    );

    it(
      'creates an Inventory category',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/inventory/categories',
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              code:
                categoryCode,
              name:
                'Electrical Test Supplies',
              description:
                'Integration test category',
              createdByPersonId:
                personId,
            })
            .expect(201);

        categoryId =
          response.body.data.id;

        expect(
          response.body.data.code,
        ).toBe(
          categoryCode,
        );
      },
    );

    it(
      'creates an Inventory brand',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/inventory/brands',
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              code:
                brandCode,
              name:
                'PropertyOS Test Brand',
              description:
                'Integration test brand',
              createdByPersonId:
                personId,
            })
            .expect(201);

        brandId =
          response.body.data.id;

        expect(
          response.body.data.code,
        ).toBe(
          brandCode,
        );
      },
    );

    it(
      'rejects an item using an invalid category',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/inventory/items',
          )
          .set(
            'Authorization',
            `Bearer ${accessToken}`,
          )
          .send({
            sku:
              `INVALID-${timestamp}`,
            name:
              'Invalid Inventory Item',
            categoryId:
              randomUUID(),
            unitOfMeasureId:
              unitId,
            itemType:
              'CONSUMABLE',
            createdByPersonId:
              personId,
          })
          .expect(400);
      },
    );

    it(
      'creates an Inventory item',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/inventory/items',
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              sku:
                itemSku,
              name:
                'LED Test Lamp',
              description:
                'Inventory integration test item',
              categoryId,
              unitOfMeasureId:
                unitId,
              brandId,
              itemType:
                'CONSUMABLE',
              barcode:
                `890${timestamp}`,
              manufacturerPartNumber:
                `LED-${timestamp}`,
              minimumStockLevel:
                5,
              reorderLevel:
                10,
              reorderQuantity:
                25,
              standardCost:
                125.5,
              currency:
                'INR',
              isSerialized:
                false,
              isBatchTracked:
                false,
              createdByPersonId:
                personId,
            })
            .expect(201);

        itemId =
          response.body.data.id;

        expect(
          response.body.data.sku,
        ).toBe(
          itemSku,
        );

        expect(
          response.body.data.reorderLevel,
        ).toBe(
          10,
        );
      },
    );

    it(
      'rejects a duplicate Inventory SKU',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/inventory/items',
          )
          .set(
            'Authorization',
            `Bearer ${accessToken}`,
          )
          .send({
            sku:
              itemSku,
            name:
              'Duplicate LED Lamp',
            categoryId,
            unitOfMeasureId:
              unitId,
            itemType:
              'CONSUMABLE',
            createdByPersonId:
              personId,
          })
          .expect(409);
      },
    );

    it(
      'returns and filters the Inventory item',
      async () => {
        const details =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/inventory/items/${itemId}`,
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .expect(200);

        expect(
          details.body.data.id,
        ).toBe(
          itemId,
        );

        const list =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/inventory/items',
            )
            .query({
              categoryId,
              brandId,
              itemType:
                'CONSUMABLE',
              isActive:
                'true',
              search:
                itemSku,
            })
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .expect(200);

        expect(
          list.body.data.map(
            (item: any) =>
              item.id,
          ),
        ).toContain(
          itemId,
        );
      },
    );

    it(
      'updates the Inventory item',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .patch(
              `/api/v1/inventory/items/${itemId}`,
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              name:
                'LED Test Lamp 12W',
              reorderLevel:
                12,
              standardCost:
                135,
              updatedByPersonId:
                personId,
              remarks:
                'Updated wattage and cost',
            })
            .expect(200);

        expect(
          response.body.data.name,
        ).toBe(
          'LED Test Lamp 12W',
        );

        expect(
          response.body.data.reorderLevel,
        ).toBe(
          12,
        );
      },
    );

    it(
      'deactivates and reactivates the Inventory item',
      async () => {
        const deactivated =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/inventory/items/${itemId}/deactivate`,
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              changedByPersonId:
                personId,
              remarks:
                'Temporary deactivation',
            })
            .expect(201);

        expect(
          deactivated.body.data.isActive,
        ).toBe(false);

        await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/inventory/items/${itemId}/deactivate`,
          )
          .set(
            'Authorization',
            `Bearer ${accessToken}`,
          )
          .send({
            changedByPersonId:
              personId,
          })
          .expect(400);

        const activated =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/inventory/items/${itemId}/activate`,
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              changedByPersonId:
                personId,
              remarks:
                'Returned to service',
            })
            .expect(201);

        expect(
          activated.body.data.isActive,
        ).toBe(true);
      },
    );

    it(
      'creates an Inventory store',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/inventory/stores',
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              storeCode,
              name:
                'Main Inventory Store',
              description:
                'Primary integration-test store',
              propertyId,
              managerPersonId:
                personId,
              createdByPersonId:
                personId,
            })
            .expect(201);

        storeId =
          response.body.data.id;

        expect(
          response.body.data.storeCode,
        ).toBe(
          storeCode,
        );
      },
    );

    it(
      'rejects a duplicate store code for the property',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/inventory/stores',
          )
          .set(
            'Authorization',
            `Bearer ${accessToken}`,
          )
          .send({
            storeCode,
            name:
              'Duplicate Store',
            propertyId,
            createdByPersonId:
              personId,
          })
          .expect(409);
      },
    );

    it(
      'lists and filters Inventory stores',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/inventory/stores',
            )
            .query({
              propertyId,
              isActive:
                'true',
              search:
                storeCode,
            })
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .expect(200);

        expect(
          response.body.data.map(
            (store: any) =>
              store.id,
          ),
        ).toContain(
          storeId,
        );
      },
    );

    it(
      'creates and updates a bin location',
      async () => {
        const created =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/inventory/bins',
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              storeId,
              binCode,
              name:
                'Rack A Test Bin',
              description:
                'Receiving bin',
              barcode:
                `BIN-${timestamp}`,
              isReceivingBin:
                true,
              createdByPersonId:
                personId,
            })
            .expect(201);

        binId =
          created.body.data.id;

        expect(
          created.body.data.isReceivingBin,
        ).toBe(true);

        const updated =
          await request(
            app.getHttpServer(),
          )
            .patch(
              `/api/v1/inventory/bins/${binId}`,
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              name:
                'Rack A Primary Bin',
              isDispatchBin:
                true,
              updatedByPersonId:
                personId,
              remarks:
                'Enabled dispatch',
            })
            .expect(200);

        expect(
          updated.body.data.isDispatchBin,
        ).toBe(true);

        const list =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/inventory/bins',
            )
            .query({
              storeId,
            })
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .expect(200);

        expect(
          list.body.data.map(
            (bin: any) =>
              bin.id,
          ),
        ).toContain(
          binId,
        );
      },
    );

    it(
      'returns an empty stock balance list before movements',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/inventory/stock-balances',
            )
            .query({
              itemId,
              storeId,
            })
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .expect(200);

        expect(
          response.body.success,
        ).toBe(true);

        expect(
          response.body.data,
        ).toEqual([]);
      },
    );

    it(
      'registers the Inventory search provider',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/search/providers',
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .expect(200);

        expect(
          response.body.data.some(
            (provider: any) =>
              provider.name ===
              'inventory-item-search-provider',
          ),
        ).toBe(true);
      },
    );

    it(
      'returns the Inventory item through global search',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/search',
            )
            .set(
              'Authorization',
              `Bearer ${accessToken}`,
            )
            .send({
              query:
                itemSku,
              limit:
                20,
            })
            .expect(201);

        expect(
          response.body.some(
            (result: any) =>
              result.entityType ===
                'inventory.item' &&
              result.entityId ===
                itemId,
          ),
        ).toBe(true);
      },
    );

    it(
      'persists Inventory audit and Event Bus records',
      async () => {
        const audits =
          await auditService
            .listByEntity(
              'inventory.item',
              itemId,
              100,
            );

        const directAudits =
          audits.filter(
            (entry) =>
              entry.source ===
                'core.inventory' &&
              entry.payload.entityId ===
                itemId,
          );

        expect(
          directAudits.map(
            (entry) =>
              entry.eventType,
          ),
        ).toEqual(
          expect.arrayContaining([
            INVENTORY_EVENTS.ITEM_CREATED,
            INVENTORY_EVENTS.ITEM_UPDATED,
            INVENTORY_EVENTS.ITEM_DEACTIVATED,
            INVENTORY_EVENTS.ITEM_ACTIVATED,
          ]),
        );

        const events =
          await eventBus
            .listEvents({
              source:
                'core.inventory',
              limit:
                200,
            });

        expect(
          events.some(
            (event) =>
              event.payload.itemId ===
                itemId &&
              event.type ===
                INVENTORY_EVENTS.ITEM_CREATED,
          ),
        ).toBe(true);

        expect(
          events.some(
            (event) =>
              event.payload.storeId ===
                storeId,
          ),
        ).toBe(true);

        expect(
          events.some(
            (event) =>
              event.payload.binLocationId ===
                binId,
          ),
        ).toBe(true);
      },
    );
  },
);
