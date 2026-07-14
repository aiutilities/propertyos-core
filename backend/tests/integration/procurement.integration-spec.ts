import {
  INestApplication,
} from '@nestjs/common';

import {
  createHash,
  randomUUID,
} from 'crypto';

import {
  Test,
  TestingModule,
} from '@nestjs/testing';

import request from 'supertest';

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
  'Procurement API integration',
  () => {
    let app: INestApplication;
    let pool: Pool;
    let token: string;

    const suffix =
      Date.now();

    const password =
      'CorrectHorseBatteryStaple123!';

    const email =
      `procurement-e2e-${suffix}@propertyos.test`;

    const adminPersonId =
      randomUUID();

    const credentialId =
      randomUUID();

    const roleId =
      randomUUID();

    const personRoleId =
      randomUUID();

    const propertyId =
      randomUUID();

    const zoneId =
      randomUUID();

    const spaceId =
      randomUUID();

    const categoryId =
      '18000000-0000-4000-8000-000000000005';

    let purchaseRequestId:
      string;

    let purchaseRequestNumber:
      string;

    beforeAll(
      async () => {
        const moduleRef:
          TestingModule =
          await Test.createTestingModule({
            imports: [
              AppModule,
            ],
          }).compile();

        app =
          moduleRef.createNestApplication();

        app.setGlobalPrefix(
          'api/v1',
        );

        await app.init();

        pool =
          app.get<Pool>(
            POSTGRES_POOL,
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
            adminPersonId,
            'Procurement E2E Admin',
            email,
            `91${String(
              suffix,
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
            adminPersonId,
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
            `Procurement E2E Role ${suffix}`,
            'Procurement integration test role',
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
            adminPersonId,
            roleId,
          ],
        );

        const permissions = [
          'procurement.read',
          'procurement.create',
          'procurement.update',
          'procurement.manage',
          'procurement.approve',
          'procurement.rfq',
          'procurement.quotation',
          'procurement.purchase-order',
          'procurement.goods-receipt',
          'procurement.invoice-match',
          'procurement.payment-request',
          'procurement.configure',
        ];

        for (
          const permission
          of permissions
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
            )
            DO NOTHING
            `,
            [
              randomUUID(),
              permission,
              `Procurement test permission: ${permission}`,
            ],
          );

          const permissionResult =
            await pool.query(
              `
              SELECT id
              FROM permissions
              WHERE permission_key = $1
              `,
              [
                permission,
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
            ON CONFLICT
            DO NOTHING
            `,
            [
              randomUUID(),
              roleId,
              permissionResult
                .rows[0]
                .id,
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
            'Procurement E2E Property',
            `PROC-E2E-${suffix}`,
            'GATED_COMMUNITY',
            'Procurement integration test property',
            'Madurai',
            'Tamil Nadu',
            'India',
            true,
          ],
        );

        await pool.query(
          `
          INSERT INTO zones (
            id,
            property_id,
            name,
            code,
            zone_type,
            description,
            is_active
          )
          VALUES (
            $1,$2,$3,$4,$5,$6,$7
          )
          `,
          [
            zoneId,
            propertyId,
            'Tower A',
            `PROC-ZONE-${suffix}`,
            'BUILDING',
            'Procurement integration zone',
            true,
          ],
        );

        await pool.query(
          `
          INSERT INTO spaces (
            id,
            property_id,
            zone_id,
            name,
            code,
            space_type,
            floor,
            description,
            is_active
          )
          VALUES (
            $1,$2,$3,$4,$5,
            $6,$7,$8,$9
          )
          `,
          [
            spaceId,
            propertyId,
            zoneId,
            'Maintenance Store',
            `PROC-SPACE-${suffix}`,
            'STORE',
            'GROUND',
            'Procurement integration space',
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

        token =
          login.body.accessToken;
      },
    );

    afterAll(
      async () => {
        await app.close();
      },
    );

    function auth() {
      return {
        Authorization:
          `Bearer ${token}`,
      };
    }

    it(
      'rejects unauthenticated purchase request listing',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .get(
            '/api/v1/procurement/requests',
          )
          .expect(401);
      },
    );

    it(
      'lists seeded procurement categories',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/procurement/categories',
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.success,
        ).toBe(true);

        expect(
          response.body.data.length,
        ).toBeGreaterThanOrEqual(
          12,
        );

        expect(
          response.body.data.some(
            (
              category: {
                id: string;
                code: string;
              },
            ) =>
              category.id ===
                categoryId &&
              category.code ===
                'ELECTRICAL',
          ),
        ).toBe(true);
      },
    );

    it(
      'creates a draft purchase request with items',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/procurement/requests',
            )
            .set(auth())
            .send({
              propertyId,
              zoneId,
              spaceId,
              categoryId,

              requestedByPersonId:
                adminPersonId,

              title:
                'Replace common-area electrical panel',

              description:
                'Procure materials required for panel replacement',

              businessJustification:
                'Existing panel is unsafe and obsolete',

              priority:
                'HIGH',

              requiredByDate:
                '2026-08-31',

              currency:
                'INR',

              metadata: {
                source:
                  'integration-test',
              },

              items: [
                {
                  itemType:
                    'GOODS',

                  itemCode:
                    'ELEC-PANEL-01',

                  description:
                    'Three-phase electrical distribution panel',

                  quantity:
                    1,

                  unit:
                    'NOS',

                  estimatedUnitPrice:
                    75000,

                  specifications:
                    'Outdoor-rated panel with breakers',
                },
                {
                  itemType:
                    'SERVICE',

                  description:
                    'Installation and commissioning',

                  quantity:
                    1,

                  unit:
                    'JOB',

                  estimatedUnitPrice:
                    15000,
                },
              ],
            })
            .expect(201);

        expect(
          response.body.success,
        ).toBe(true);

        expect(
          response.body.data.status,
        ).toBe('DRAFT');

        expect(
          response.body.data.items,
        ).toHaveLength(2);

        expect(
          response.body.data.estimatedAmount,
        ).toBe(90000);

        expect(
          response.body.data.history,
        ).toHaveLength(1);

        purchaseRequestId =
          response.body.data.id;

        purchaseRequestNumber =
          response.body.data
            .requestNumber;

        expect(
          purchaseRequestNumber,
        ).toMatch(
          /^PR-\d{8}-[A-F0-9]{8}$/,
        );
      },
    );

    it(
      'returns purchase request details',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/procurement/requests/${purchaseRequestId}`,
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.data.id,
        ).toBe(
          purchaseRequestId,
        );

        expect(
          response.body.data.requestNumber,
        ).toBe(
          purchaseRequestNumber,
        );

        expect(
          response.body.data.category.code,
        ).toBe('ELECTRICAL');

        expect(
          response.body.data.items,
        ).toHaveLength(2);
      },
    );

    it(
      'updates a draft purchase request',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .patch(
              `/api/v1/procurement/requests/${purchaseRequestId}`,
            )
            .set(auth())
            .send({
              updatedByPersonId:
                adminPersonId,

              title:
                'Replace common-area main electrical panel',

              priority:
                'URGENT',

              items: [
                {
                  itemType:
                    'GOODS',

                  itemCode:
                    'ELEC-PANEL-01',

                  description:
                    'Three-phase main electrical distribution panel',

                  quantity:
                    1,

                  unit:
                    'NOS',

                  estimatedUnitPrice:
                    80000,
                },
                {
                  itemType:
                    'SERVICE',

                  description:
                    'Installation, testing and commissioning',

                  quantity:
                    1,

                  unit:
                    'JOB',

                  estimatedUnitPrice:
                    20000,
                },
              ],
            })
            .expect(200);

        expect(
          response.body.data.title,
        ).toBe(
          'Replace common-area main electrical panel',
        );

        expect(
          response.body.data.priority,
        ).toBe('URGENT');

        expect(
          response.body.data.estimatedAmount,
        ).toBe(100000);
      },
    );

    it(
      'lists and filters the purchase request',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/procurement/requests?propertyId=${propertyId}&status=DRAFT&search=${encodeURIComponent(
                purchaseRequestNumber,
              )}`,
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.data.some(
            (
              row: {
                id: string;
              },
            ) =>
              row.id ===
              purchaseRequestId,
          ),
        ).toBe(true);
      },
    );

    it(
      'submits the purchase request',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/procurement/requests/${purchaseRequestId}/submit`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                adminPersonId,

              remarks:
                'Submitted for approval',
            })
            .expect(201);

        expect(
          response.body.data.status,
        ).toBe('SUBMITTED');

        expect(
          response.body.data.submittedAt,
        ).toBeDefined();
      },
    );

    it(
      'rejects editing a submitted purchase request',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .patch(
            `/api/v1/procurement/requests/${purchaseRequestId}`,
          )
          .set(auth())
          .send({
            updatedByPersonId:
              adminPersonId,

            title:
              'Invalid submitted update',
          })
          .expect(400);
      },
    );

    it(
      'approves the submitted purchase request',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/procurement/requests/${purchaseRequestId}/approve`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                adminPersonId,

              remarks:
                'Approved for procurement',
            })
            .expect(201);

        expect(
          response.body.data.status,
        ).toBe('APPROVED');

        expect(
          response.body.data.approvedByPersonId,
        ).toBe(
          adminPersonId,
        );

        expect(
          response.body.data.history.map(
            (
              entry: {
                toStatus: string;
              },
            ) =>
              entry.toStatus,
          ),
        ).toEqual(
          expect.arrayContaining([
            'DRAFT',
            'SUBMITTED',
            'APPROVED',
          ]),
        );
      },
    );

    it(
      'returns procurement metrics',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/procurement/metrics',
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.data
            .purchaseRequests.total,
        ).toBeGreaterThanOrEqual(
          1,
        );

        expect(
          response.body.data
            .purchaseRequests.approved,
        ).toBeGreaterThanOrEqual(
          1,
        );
      },
    );

    it(
      'persists purchase request audit and event records',
      async () => {
        const expectedEvents = [
          'procurement.purchase_request.created',
          'procurement.purchase_request.updated',
          'procurement.purchase_request.submitted',
          'procurement.purchase_request.approved',
        ];

        const auditResult =
          await pool.query(
            `
            SELECT event_type
            FROM audit_logs
            WHERE
              payload ->> 'entityId' = $1
              AND payload ->> 'entityType' =
                'procurement.purchase_request'
            `,
            [
              purchaseRequestId,
            ],
          );

        expect(
          auditResult.rows.map(
            (
              row: {
                event_type: string;
              },
            ) =>
              row.event_type,
          ),
        ).toEqual(
          expect.arrayContaining(
            expectedEvents,
          ),
        );

        const eventResult =
          await pool.query(
            `
            SELECT event_type
            FROM eventbus_events
            WHERE
              payload ->> 'entityId' = $1
              AND payload ->> 'entityType' =
                'procurement.purchase_request'
            `,
            [
              purchaseRequestId,
            ],
          );

        expect(
          eventResult.rows.map(
            (
              row: {
                event_type: string;
              },
            ) =>
              row.event_type,
          ),
        ).toEqual(
          expect.arrayContaining(
            expectedEvents,
          ),
        );
      },
    );
  },
);
