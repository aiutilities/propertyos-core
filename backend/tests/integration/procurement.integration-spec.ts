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

    const vendorOneId =
      randomUUID();

    const vendorTwoId =
      randomUUID();

    const vendorThreeId =
      randomUUID();

    let rfqId:
      string;

    let rfqNumber:
      string;

    let rfqItemOneId:
      string;

    let rfqItemTwoId:
      string;

    let quotationOneId:
      string;

    let quotationOneNumber:
      string;

    let quotationTwoId:
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

        const vendorFixtures = [
          {
            id:
              vendorOneId,
            vendorNumber:
              `V-E2E-A-${suffix}`,
            legalName:
              'Procurement E2E Vendor One Private Limited',
            displayName:
              'Procurement Vendor One',
            email:
              `vendor-one-${suffix}@propertyos.test`,
            phone:
              `81${String(
                suffix,
              ).slice(-8)}`,
            status:
              'ACTIVE',
          },
          {
            id:
              vendorTwoId,
            vendorNumber:
              `V-E2E-B-${suffix}`,
            legalName:
              'Procurement E2E Vendor Two Private Limited',
            displayName:
              'Procurement Vendor Two',
            email:
              `vendor-two-${suffix}@propertyos.test`,
            phone:
              `82${String(
                suffix,
              ).slice(-8)}`,
            status:
              'ACTIVE',
          },
          {
            id:
              vendorThreeId,
            vendorNumber:
              `V-E2E-C-${suffix}`,
            legalName:
              'Procurement E2E Suspended Vendor Private Limited',
            displayName:
              'Procurement Suspended Vendor',
            email:
              `vendor-three-${suffix}@propertyos.test`,
            phone:
              `83${String(
                suffix,
              ).slice(-8)}`,
            status:
              'SUSPENDED',
          },
        ];

        for (
          const vendor
          of vendorFixtures
        ) {
          await pool.query(
            `
            INSERT INTO vendors (
              id,
              vendor_number,
              legal_name,
              display_name,
              vendor_type,
              status,
              email,
              phone,
              country,
              metadata,
              created_by_person_id,
              created_at,
              updated_at
            )
            VALUES (
              $1,$2,$3,$4,$5,$6,$7,
              $8,$9,$10,$11,NOW(),NOW()
            )
            `,
            [
              vendor.id,
              vendor.vendorNumber,
              vendor.legalName,
              vendor.displayName,
              'COMPANY',
              vendor.status,
              vendor.email,
              vendor.phone,
              'India',
              JSON.stringify({
                source:
                  'procurement-integration-test',
              }),
              adminPersonId,
            ],
          );
        }

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


    it(
      'rejects creating an RFQ with an inactive vendor',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/procurement/rfqs',
          )
          .set(auth())
          .send({
            purchaseRequestId,

            title:
              'Electrical panel procurement RFQ',

            quotationDeadline:
              '2026-12-15T12:00:00.000Z',

            deliveryRequiredBy:
              '2027-01-15',

            currency:
              'INR',

            vendorIds: [
              vendorOneId,
              vendorThreeId,
            ],

            createdByPersonId:
              adminPersonId,
          })
          .expect(400);
      },
    );

    it(
      'rejects duplicate vendor invitations',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/procurement/rfqs',
          )
          .set(auth())
          .send({
            purchaseRequestId,

            title:
              'Electrical panel procurement RFQ',

            quotationDeadline:
              '2026-12-15T12:00:00.000Z',

            vendorIds: [
              vendorOneId,
              vendorOneId,
            ],

            createdByPersonId:
              adminPersonId,
          })
          .expect(400);
      },
    );

    it(
      'creates an RFQ from the approved purchase request',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/procurement/rfqs',
            )
            .set(auth())
            .send({
              purchaseRequestId,

              title:
                'Electrical panel replacement RFQ',

              description:
                'Request quotations for panel supply and installation',

              quotationDeadline:
                '2026-12-15T12:00:00.000Z',

              deliveryRequiredBy:
                '2027-01-15',

              currency:
                'INR',

              termsAndConditions:
                'Quote must include taxes, delivery and installation.',

              vendorIds: [
                vendorOneId,
                vendorTwoId,
              ],

              createdByPersonId:
                adminPersonId,
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
          response.body.data.vendors,
        ).toHaveLength(2);

        expect(
          response.body.data.history,
        ).toHaveLength(1);

        expect(
          response.body.data
            .purchaseRequestId,
        ).toBe(
          purchaseRequestId,
        );

        rfqId =
          response.body.data.id;

        rfqNumber =
          response.body.data
            .rfqNumber;

        expect(
          rfqNumber,
        ).toMatch(
          /^RFQ-\d{8}-[A-F0-9]{8}$/,
        );
      },
    );

    it(
      'converts the source purchase request to RFQ status',
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
          response.body.data.status,
        ).toBe(
          'CONVERTED_TO_RFQ',
        );

        expect(
          response.body.data.metadata.rfqId,
        ).toBe(
          rfqId,
        );

        expect(
          response.body.data.history.map(
            (
              row: {
                toStatus: string;
              },
            ) =>
              row.toStatus,
          ),
        ).toEqual(
          expect.arrayContaining([
            'APPROVED',
            'CONVERTED_TO_RFQ',
          ]),
        );
      },
    );

    it(
      'rejects a second RFQ for the same purchase request',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/procurement/rfqs',
          )
          .set(auth())
          .send({
            purchaseRequestId,

            title:
              'Duplicate RFQ',

            quotationDeadline:
              '2026-12-20T12:00:00.000Z',

            vendorIds: [
              vendorOneId,
            ],

            createdByPersonId:
              adminPersonId,
          })
          .expect(400);
      },
    );

    it(
      'returns RFQ details',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/procurement/rfqs/${rfqId}`,
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.data.id,
        ).toBe(rfqId);

        expect(
          response.body.data.rfqNumber,
        ).toBe(rfqNumber);

        expect(
          response.body.data.items,
        ).toHaveLength(2);

        rfqItemOneId =
          response.body.data
            .items[0].id;

        rfqItemTwoId =
          response.body.data
            .items[1].id;

        expect(
          rfqItemOneId,
        ).toBeDefined();

        expect(
          rfqItemTwoId,
        ).toBeDefined();

        expect(
          response.body.data.vendors.map(
            (
              row: {
                vendorId: string;
              },
            ) =>
              row.vendorId,
          ),
        ).toEqual(
          expect.arrayContaining([
            vendorOneId,
            vendorTwoId,
          ]),
        );
      },
    );

    it(
      'updates a draft RFQ and vendor invitations',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .patch(
              `/api/v1/procurement/rfqs/${rfqId}`,
            )
            .set(auth())
            .send({
              title:
                'Electrical panel replacement and commissioning RFQ',

              termsAndConditions:
                'Quote must include taxes, delivery, installation and commissioning.',

              quotationDeadline:
                '2026-12-20T12:00:00.000Z',

              vendorIds: [
                vendorOneId,
                vendorTwoId,
              ],

              updatedByPersonId:
                adminPersonId,
            })
            .expect(200);

        expect(
          response.body.data.title,
        ).toBe(
          'Electrical panel replacement and commissioning RFQ',
        );

        expect(
          response.body.data.vendors,
        ).toHaveLength(2);

        expect(
          response.body.data.vendors.map(
            (
              row: {
                vendorId: string;
              },
            ) =>
              row.vendorId,
          ),
        ).toEqual(
          expect.arrayContaining([
            vendorOneId,
            vendorTwoId,
          ]),
        );
      },
    );

    it(
      'lists and filters RFQs',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/procurement/rfqs?propertyId=${propertyId}&vendorId=${vendorOneId}&status=DRAFT&search=${encodeURIComponent(
                rfqNumber,
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
              rfqId,
          ),
        ).toBe(true);
      },
    );

    it(
      'issues the draft RFQ',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/procurement/rfqs/${rfqId}/issue`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                adminPersonId,

              remarks:
                'RFQ released to vendors',
            })
            .expect(201);

        expect(
          response.body.data.status,
        ).toBe('OPEN');

        expect(
          response.body.data.issuedAt,
        ).toBeDefined();

        expect(
          response.body.data
            .issuedByPersonId,
        ).toBe(
          adminPersonId,
        );
      },
    );

    it(
      'rejects editing an issued RFQ',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .patch(
            `/api/v1/procurement/rfqs/${rfqId}`,
          )
          .set(auth())
          .send({
            title:
              'Invalid RFQ update',

            updatedByPersonId:
              adminPersonId,
          })
          .expect(400);
      },
    );

    it(
      'tracks vendor viewed and responded actions',
      async () => {
        const viewed =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/procurement/rfqs/${rfqId}/vendors/${vendorOneId}/viewed`,
            )
            .set(auth())
            .expect(201);

        expect(
          viewed.body.data.status,
        ).toBe('VIEWED');

        expect(
          viewed.body.data.viewedAt,
        ).toBeDefined();

        const responded =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/procurement/rfqs/${rfqId}/vendors/${vendorOneId}/responded`,
            )
            .set(auth())
            .expect(201);

        expect(
          responded.body.data.status,
        ).toBe('RESPONDED');

        expect(
          responded.body.data.respondedAt,
        ).toBeDefined();
      },
    );

    it(
      'returns complete RFQ lifecycle history',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/procurement/rfqs/${rfqId}`,
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.data.history.map(
            (
              row: {
                toStatus: string;
              },
            ) =>
              row.toStatus,
          ),
        ).toEqual([
          'DRAFT',
          'OPEN',
        ]);
      },
    );

    it(
      'persists RFQ audit and EventBus records',
      async () => {
        const expectedEvents = [
          'procurement.rfq.created',
          'procurement.rfq.updated',
          'procurement.rfq.issued',
          'procurement.rfq.vendor.viewed',
          'procurement.rfq.vendor.responded',
        ];

        const auditResult =
          await pool.query(
            `
            SELECT event_type
            FROM audit_logs
            WHERE
              payload ->> 'entityId' = $1
              AND payload ->> 'entityType' =
                'procurement.rfq'
            `,
            [
              rfqId,
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
                'procurement.rfq'
            `,
            [
              rfqId,
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

    it(
      'rejects a quotation from an uninvited vendor',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/procurement/quotations',
          )
          .set(auth())
          .send({
            rfqId,
            vendorId:
              vendorThreeId,

            validUntil:
              '2027-01-31',

            currency:
              'INR',

            submittedByPersonId:
              adminPersonId,

            items: [
              {
                rfqItemId:
                  rfqItemOneId,

                quantity:
                  1,

                unit:
                  'NOS',

                unitPrice:
                  80000,
              },
            ],
          })
          .expect(400);
      },
    );

    it(
      'rejects a quotation item from another RFQ',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/procurement/quotations',
          )
          .set(auth())
          .send({
            rfqId,
            vendorId:
              vendorOneId,

            validUntil:
              '2027-01-31',

            currency:
              'INR',

            submittedByPersonId:
              adminPersonId,

            items: [
              {
                rfqItemId:
                  randomUUID(),

                quantity:
                  1,

                unit:
                  'NOS',

                unitPrice:
                  80000,
              },
            ],
          })
          .expect(400);
      },
    );

    it(
      'creates the first vendor quotation with calculated totals',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/procurement/quotations',
            )
            .set(auth())
            .send({
              rfqId,
              vendorId:
                vendorOneId,

              vendorReference:
                `V1-QUOTE-${suffix}`,

              quotationDate:
                '2026-12-01',

              validUntil:
                '2027-01-31',

              deliveryDays:
                20,

              discountAmount:
                2000,

              freightAmount:
                1500,

              currency:
                'INR',

              paymentTerms:
                '50 percent advance and balance after commissioning',

              deliveryTerms:
                'Delivered at property',

              notes:
                'Includes installation and testing',

              submittedByPersonId:
                adminPersonId,

              items: [
                {
                  rfqItemId:
                    rfqItemOneId,

                  description:
                    'Three-phase main electrical panel',

                  quantity:
                    1,

                  unit:
                    'NOS',

                  unitPrice:
                    80000,

                  discountAmount:
                    5000,

                  taxRate:
                    18,

                  deliveryDays:
                    20,
                },
                {
                  rfqItemId:
                    rfqItemTwoId,

                  description:
                    'Installation and commissioning',

                  quantity:
                    1,

                  unit:
                    'JOB',

                  unitPrice:
                    20000,

                  discountAmount:
                    0,

                  taxRate:
                    18,

                  deliveryDays:
                    5,
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
          response.body.data.subtotal,
        ).toBe(100000);

        expect(
          response.body.data.discountAmount,
        ).toBe(7000);

        expect(
          response.body.data.taxAmount,
        ).toBe(17100);

        expect(
          response.body.data.freightAmount,
        ).toBe(1500);

        expect(
          response.body.data.totalAmount,
        ).toBe(111600);

        quotationOneId =
          response.body.data.id;

        quotationOneNumber =
          response.body.data
            .quotationNumber;

        expect(
          quotationOneNumber,
        ).toMatch(
          /^QT-\d{8}-[A-F0-9]{8}$/,
        );

        expect(
          response.body.data.history,
        ).toHaveLength(1);
      },
    );

    it(
      'rejects a duplicate quotation for the same vendor and RFQ',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/procurement/quotations',
          )
          .set(auth())
          .send({
            rfqId,
            vendorId:
              vendorOneId,

            validUntil:
              '2027-01-31',

            submittedByPersonId:
              adminPersonId,

            items: [
              {
                rfqItemId:
                  rfqItemOneId,

                quantity:
                  1,

                unit:
                  'NOS',

                unitPrice:
                  85000,
              },
            ],
          })
          .expect(400);
      },
    );

    it(
      'updates the first draft quotation',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .patch(
              `/api/v1/procurement/quotations/${quotationOneId}`,
            )
            .set(auth())
            .send({
              vendorReference:
                `V1-QUOTE-REVISED-${suffix}`,

              discountAmount:
                2500,

              freightAmount:
                1000,

              paymentTerms:
                '30 percent advance and balance after commissioning',

              updatedByPersonId:
                adminPersonId,

              items: [
                {
                  rfqItemId:
                    rfqItemOneId,

                  description:
                    'Three-phase main electrical panel',

                  quantity:
                    1,

                  unit:
                    'NOS',

                  unitPrice:
                    80000,

                  discountAmount:
                    5000,

                  taxRate:
                    18,

                  deliveryDays:
                    18,
                },
                {
                  rfqItemId:
                    rfqItemTwoId,

                  description:
                    'Installation and commissioning',

                  quantity:
                    1,

                  unit:
                    'JOB',

                  unitPrice:
                    20000,

                  discountAmount:
                    0,

                  taxRate:
                    18,

                  deliveryDays:
                    5,
                },
              ],
            })
            .expect(200);

        expect(
          response.body.data
            .vendorReference,
        ).toBe(
          `V1-QUOTE-REVISED-${suffix}`,
        );

        expect(
          response.body.data.discountAmount,
        ).toBe(7500);

        expect(
          response.body.data.freightAmount,
        ).toBe(1000);

        expect(
          response.body.data.totalAmount,
        ).toBe(110600);
      },
    );

    it(
      'lists and filters quotations',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/procurement/quotations?rfqId=${rfqId}&vendorId=${vendorOneId}&propertyId=${propertyId}&status=DRAFT&search=${encodeURIComponent(
                quotationOneNumber,
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
              quotationOneId,
          ),
        ).toBe(true);
      },
    );

    it(
      'submits the first quotation and marks the vendor responded',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/procurement/quotations/${quotationOneId}/submit`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                adminPersonId,

              remarks:
                'Vendor one quotation submitted',
            })
            .expect(201);

        expect(
          response.body.data.status,
        ).toBe('SUBMITTED');

        expect(
          response.body.data.submittedAt,
        ).toBeDefined();

        const rfqResponse =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/procurement/rfqs/${rfqId}`,
            )
            .set(auth())
            .expect(200);

        const invitation =
          rfqResponse.body.data
            .vendors.find(
              (
                row: {
                  vendorId: string;
                },
              ) =>
                row.vendorId ===
                vendorOneId,
            );

        expect(
          invitation.status,
        ).toBe('RESPONDED');

        expect(
          invitation.respondedAt,
        ).toBeDefined();
      },
    );

    it(
      'rejects editing a submitted quotation',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .patch(
            `/api/v1/procurement/quotations/${quotationOneId}`,
          )
          .set(auth())
          .send({
            notes:
              'Invalid submitted update',

            updatedByPersonId:
              adminPersonId,
          })
          .expect(400);
      },
    );

    it(
      'creates and submits the second vendor quotation',
      async () => {
        const created =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/procurement/quotations',
            )
            .set(auth())
            .send({
              rfqId,
              vendorId:
                vendorTwoId,

              vendorReference:
                `V2-QUOTE-${suffix}`,

              quotationDate:
                '2026-12-02',

              validUntil:
                '2027-01-31',

              deliveryDays:
                25,

              discountAmount:
                0,

              freightAmount:
                2000,

              currency:
                'INR',

              submittedByPersonId:
                adminPersonId,

              items: [
                {
                  rfqItemId:
                    rfqItemOneId,

                  quantity:
                    1,

                  unit:
                    'NOS',

                  unitPrice:
                    79000,

                  discountAmount:
                    0,

                  taxRate:
                    18,
                },
                {
                  rfqItemId:
                    rfqItemTwoId,

                  quantity:
                    1,

                  unit:
                    'JOB',

                  unitPrice:
                    22000,

                  discountAmount:
                    0,

                  taxRate:
                    18,
                },
              ],
            });

        expect(
          created.status,
        ).toBe(201);

        quotationTwoId =
          created.body.data.id;

        expect(
          created.body.data.totalAmount,
        ).toBe(121180);

        const submitted =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/procurement/quotations/${quotationTwoId}/submit`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                adminPersonId,

              remarks:
                'Vendor two quotation submitted',
            })
            .expect(201);

        expect(
          submitted.body.data.status,
        ).toBe('SUBMITTED');
      },
    );

    it(
      'returns ranked quotation comparison',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/procurement/rfqs/${rfqId}/comparison`,
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.success,
        ).toBe(true);

        expect(
          response.body.data.rfqId,
        ).toBe(rfqId);

        expect(
          response.body.data.rfqNumber,
        ).toBe(rfqNumber);

        expect(
          response.body.data.quotationCount,
        ).toBe(2);

        expect(
          response.body.data
            .comparableQuotationCount,
        ).toBe(2);

        expect(
          response.body.data.currency,
        ).toBe('INR');

        const ranking =
          response.body.data
            .commercialRanking;

        expect(
          ranking,
        ).toHaveLength(2);

        expect(
          ranking[0].quotationId,
        ).toBe(
          quotationOneId,
        );

        expect(
          ranking[0].commercialRank,
        ).toBe(1);

        expect(
          ranking[0]
            .isLowestCommercialOffer,
        ).toBe(true);

        expect(
          ranking[0].totalAmount,
        ).toBe(110600);

        expect(
          ranking[1].quotationId,
        ).toBe(
          quotationTwoId,
        );

        expect(
          ranking[1].commercialRank,
        ).toBe(2);

        expect(
          ranking[1]
            .isLowestCommercialOffer,
        ).toBe(false);

        expect(
          ranking[1].totalAmount,
        ).toBe(121180);
      },
    );

    it(
      'returns line-level L1 and L2 comparison',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/procurement/rfqs/${rfqId}/comparison`,
            )
            .set(auth())
            .expect(200);

        const itemComparisons =
          response.body.data
            .itemComparisons;

        expect(
          itemComparisons,
        ).toHaveLength(2);

        const firstItem =
          itemComparisons.find(
            (
              item: {
                rfqItemId: string;
              },
            ) =>
              item.rfqItemId ===
              rfqItemOneId,
          );

        const secondItem =
          itemComparisons.find(
            (
              item: {
                rfqItemId: string;
              },
            ) =>
              item.rfqItemId ===
              rfqItemTwoId,
          );

        expect(
          firstItem,
        ).toBeDefined();

        expect(
          secondItem,
        ).toBeDefined();

        expect(
          firstItem.entries,
        ).toHaveLength(2);

        expect(
          firstItem.entries[0]
            .quotationId,
        ).toBe(
          quotationOneId,
        );

        expect(
          firstItem.entries[0]
            .lineRank,
        ).toBe(1);

        expect(
          firstItem.entries[0]
            .isLowestLineOffer,
        ).toBe(true);

        expect(
          firstItem.entries[0]
            .lineTotal,
        ).toBe(88500);

        expect(
          firstItem.entries[1]
            .quotationId,
        ).toBe(
          quotationTwoId,
        );

        expect(
          firstItem.entries[1]
            .lineRank,
        ).toBe(2);

        expect(
          firstItem.entries[1]
            .lineTotal,
        ).toBe(93220);

        expect(
          secondItem.entries[0]
            .quotationId,
        ).toBe(
          quotationOneId,
        );

        expect(
          secondItem.entries[0]
            .lineRank,
        ).toBe(1);

        expect(
          secondItem.entries[0]
            .lineTotal,
        ).toBe(23600);

        expect(
          secondItem.entries[1]
            .quotationId,
        ).toBe(
          quotationTwoId,
        );

        expect(
          secondItem.entries[1]
            .lineRank,
        ).toBe(2);

        expect(
          secondItem.entries[1]
            .lineTotal,
        ).toBe(25960);
      },
    );

    it(
      'compares submitted quotations before award decision',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/procurement/rfqs/${rfqId}/comparison`,
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.data
            .commercialRanking.map(
              (
                row: {
                  status: string;
                },
              ) =>
                row.status,
            ),
        ).toEqual([
          'SUBMITTED',
          'SUBMITTED',
        ]);
      },
    );

    it(
      'selects the first vendor quotation',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/procurement/quotations/${quotationOneId}/select`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                adminPersonId,

              remarks:
                'Best commercial and technical offer',
            })
            .expect(201);

        expect(
          response.body.data.status,
        ).toBe('SELECTED');

        expect(
          response.body.data.selectedAt,
        ).toBeDefined();

        expect(
          response.body.data.history.map(
            (
              row: {
                toStatus: string;
              },
            ) =>
              row.toStatus,
          ),
        ).toEqual([
          'DRAFT',
          'SUBMITTED',
          'SELECTED',
        ]);
      },
    );

it(
      'rejects the second vendor quotation',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/procurement/quotations/${quotationTwoId}/reject`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                adminPersonId,

              remarks:
                'Higher evaluated cost',
            })
            .expect(201);

        expect(
          response.body.data.status,
        ).toBe('REJECTED');

        expect(
          response.body.data.rejectedAt,
        ).toBeDefined();

        expect(
          response.body.data.history.map(
            (
              row: {
                toStatus: string;
              },
            ) =>
              row.toStatus,
          ),
        ).toEqual([
          'DRAFT',
          'SUBMITTED',
          'REJECTED',
        ]);
      },
    );

    it(
      'persists quotation audit and EventBus records',
      async () => {
        const expectedEvents = [
          'procurement.quotation.created',
          'procurement.quotation.updated',
          'procurement.quotation.submitted',
          'procurement.quotation.selected',
        ];

        const auditResult =
          await pool.query(
            `
            SELECT event_type
            FROM audit_logs
            WHERE
              payload ->> 'entityId' = $1
              AND payload ->> 'entityType' =
                'procurement.quotation'
            `,
            [
              quotationOneId,
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
                'procurement.quotation'
            `,
            [
              quotationOneId,
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

    it(
      'closes the open RFQ',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/procurement/rfqs/${rfqId}/close`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                adminPersonId,

              remarks:
                'Quotation collection completed',
            })
            .expect(201);

        expect(
          response.body.data.status,
        ).toBe('CLOSED');

        expect(
          response.body.data.closedAt,
        ).toBeDefined();

        expect(
          response.body.data.history.map(
            (
              row: {
                toStatus: string;
              },
            ) =>
              row.toStatus,
          ),
        ).toEqual([
          'DRAFT',
          'OPEN',
          'CLOSED',
        ]);
      },
    );

    it(
      'rejects cancelling a closed RFQ',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/procurement/rfqs/${rfqId}/cancel`,
          )
          .set(auth())
          .send({
            changedByPersonId:
              adminPersonId,
          })
          .expect(400);
      },
    );
  },
);
