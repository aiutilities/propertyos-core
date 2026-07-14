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
  'Vendor API integration',
  () => {
    let app: INestApplication;
    let pool: Pool;
    let token: string;

    let communicationId: string;
    let communicationNumber: string;

    const suffix = Date.now();

    const password =
      'CorrectHorseBatteryStaple123!';

    const email =
      `communications-e2e-${suffix}@propertyos.test`;

    const adminPersonId =
      randomUUID();

    const residentPersonId =
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

    const categoryId =
      '17000000-0000-4000-8000-000000000001';

    let actorPersonId: string;

    let vendorCategoryId: string;
    let vendorId: string;
    let vendorNumber: string;

    let contractId: string;
    let contractNumber: string;

    let coreDocumentId: string;
    let complianceDocumentId: string;

    let workOrderId: string;
    let workOrderNumber: string;

    beforeAll(async () => {
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
          .replace(/-/g, '');

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
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
          adminPersonId,
          'Communications E2E Admin',
          email,
          `91${String(suffix).slice(-8)}`,
          'ACTIVE',
        ],
      );

      await pool.query(
        `
        INSERT INTO persons (
          id,
          display_name,
          email,
          phone,
          status
        )
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
          residentPersonId,
          'Communications Resident',
          `communications-resident-${suffix}@propertyos.test`,
          `92${String(suffix).slice(-8)}`,
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
        VALUES ($1,$2,$3,$4)
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
        VALUES ($1,$2,$3)
        `,
        [
          roleId,
          `Communications E2E Role ${suffix}`,
          'Communications integration test role',
        ],
      );

      await pool.query(
        `
        INSERT INTO person_roles (
          id,
          person_id,
          role_id
        )
        VALUES ($1,$2,$3)
        `,
        [
          personRoleId,
          adminPersonId,
          roleId,
        ],
      );

      const permissions = [
        'vendor.read',
        'vendor.create',
        'vendor.update',
        'vendor.manage',
        'vendor.contracts',
        'vendor.work_orders',
        'vendor.compliance',
        'vendor.ratings',
        'vendor.configure',
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
          VALUES ($1,$2,$3)
          ON CONFLICT (
            permission_key
          ) DO NOTHING
          `,
          [
            randomUUID(),
            permission,
            `Vendor test permission: ${permission}`,
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
          VALUES ($1,$2,$3)
          ON CONFLICT DO NOTHING
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
          $1,$2,$3,$4,$5,$6,$7,$8,$9
        )
        `,
        [
          propertyId,
          'Vendor E2E Property',
          `COM-E2E-${suffix}`,
          'GATED_COMMUNITY',
          'Vendor integration test property',
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
          `TOWER-A-${suffix}`,
          'BUILDING',
          'Communications test zone',
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

      const actorResult =
        await pool.query(
          `
          SELECT id
          FROM persons
          WHERE email = $1
          LIMIT 1
          `,
          [email],
        );

      if (!actorResult.rows[0]) {
        throw new Error(
          'Vendor integration actor person was not found',
        );
      }

      actorPersonId =
        actorResult.rows[0].id;
    });

    afterAll(async () => {
      await app.close();
    });

    function auth() {
      return {
        Authorization:
          `Bearer ${token}`,
      };
    }

    it(
      'rejects unauthenticated vendor listing',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .get('/api/v1/vendors')
          .expect(401);
      },
    );

    it(
      'lists seeded vendor categories',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/vendors/categories',
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.success,
        ).toBe(true);

        expect(
          response.body.data.length,
        ).toBeGreaterThanOrEqual(12);

        const category =
          response.body.data.find(
            (
              item: {
                id: string;
                code: string;
              },
            ) =>
              item.code ===
              'ELECTRICAL',
          );

        expect(category).toBeDefined();

        vendorCategoryId =
          category.id;
      },
    );

    it(
      'creates a draft vendor with related records',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post('/api/v1/vendors')
            .set(auth())
            .send({
              legalName:
                'PropertyOS Vendor Integration Private Limited',

              displayName:
                'PropertyOS Vendor Integration',

              vendorType:
                'COMPANY',

              email:
                'vendor.integration@propertyos.test',

              phone:
                '9000002701',

              city:
                'Chennai',

              state:
                'Tamil Nadu',

              country:
                'India',

              createdByPersonId:
                actorPersonId,

              contacts: [
                {
                  contactType:
                    'PRIMARY',

                  name:
                    'Vendor Operations Contact',

                  designation:
                    'Operations Manager',

                  email:
                    'vendor.ops@propertyos.test',

                  phone:
                    '9000002702',

                  isPrimary:
                    true,
                },
              ],

              propertyCoverage: [
                {
                  propertyId,
                },
              ],

              serviceCategories: [
                {
                  categoryId:
                    vendorCategoryId,

                  notes:
                    'Electrical maintenance',
                },
              ],
            })
            .expect(201);

        expect(
          response.body.data.status,
        ).toBe('DRAFT');

        expect(
          response.body.data.vendorNumber,
        ).toMatch(/^VEN-/);

        vendorId =
          response.body.data.id;

        vendorNumber =
          response.body.data.vendorNumber;
      },
    );

    it(
      'returns and updates vendor details',
      async () => {
        const details =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/vendors/${vendorId}`,
            )
            .set(auth())
            .expect(200);

        expect(
          details.body.data.contacts,
        ).toHaveLength(1);

        expect(
          details.body.data.propertyCoverage,
        ).toHaveLength(1);

        expect(
          details.body.data.serviceCategories,
        ).toHaveLength(1);

        const updated =
          await request(
            app.getHttpServer(),
          )
            .patch(
              `/api/v1/vendors/${vendorId}`,
            )
            .set(auth())
            .send({
              displayName:
                'PropertyOS Verified Vendor',

              updatedByPersonId:
                actorPersonId,
            })
            .expect(200);

        expect(
          updated.body.data.displayName,
        ).toBe(
          'PropertyOS Verified Vendor',
        );

        const searched =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/vendors?search=${encodeURIComponent(
                vendorNumber,
              )}`,
            )
            .set(auth())
            .expect(200);

        expect(
          searched.body.data.some(
            (
              item: {
                id: string;
              },
            ) =>
              item.id === vendorId,
          ),
        ).toBe(true);
      },
    );

    it(
      'processes vendor lifecycle transitions',
      async () => {
        const transition = (
          action: string,
        ) =>
          request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/vendors/${vendorId}/${action}`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                actorPersonId,

              remarks:
                `Vendor ${action}`,
            });

        let response =
          await transition(
            'activate',
          ).expect(201);

        expect(
          response.body.data.status,
        ).toBe('ACTIVE');

        response =
          await transition(
            'suspend',
          ).expect(201);

        expect(
          response.body.data.status,
        ).toBe('SUSPENDED');

        response =
          await transition(
            'reactivate',
          ).expect(201);

        expect(
          response.body.data.status,
        ).toBe('ACTIVE');

        response =
          await transition(
            'block',
          ).expect(201);

        expect(
          response.body.data.status,
        ).toBe('BLOCKED');

        response =
          await transition(
            'reactivate',
          ).expect(201);

        expect(
          response.body.data.status,
        ).toBe('ACTIVE');
      },
    );

    it(
      'creates and activates a vendor contract',
      async () => {
        const startDate =
          new Date();

        const endDate =
          new Date(startDate);

        endDate.setFullYear(
          endDate.getFullYear() + 1,
        );

        const created =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/vendors/contracts',
            )
            .set(auth())
            .send({
              vendorId,
              propertyId,

              contractType:
                'AMC',

              title:
                'Annual Electrical Maintenance Contract',

              startDate:
                startDate
                  .toISOString()
                  .slice(0, 10),

              endDate:
                endDate
                  .toISOString()
                  .slice(0, 10),

              contractValue:
                120000,

              responseSlaMinutes:
                120,

              resolutionSlaMinutes:
                1440,

              createdByPersonId:
                actorPersonId,
            })
            .expect(201);

        contractId =
          created.body.data.id;

        contractNumber =
          created.body.data.contractNumber;

        expect(
          created.body.data.status,
        ).toBe('DRAFT');

        const activated =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/vendors/contracts/${contractId}/activate`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                actorPersonId,

              remarks:
                'Contract approved',
            })
            .expect(201);

        expect(
          activated.body.data.status,
        ).toBe('ACTIVE');

        const listed =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/vendors/contracts?vendorId=${vendorId}&search=${encodeURIComponent(
                contractNumber,
              )}`,
            )
            .set(auth())
            .expect(200);

        expect(
          listed.body.data.some(
            (
              item: {
                id: string;
              },
            ) =>
              item.id === contractId,
          ),
        ).toBe(true);
      },
    );

    it(
      'creates and verifies vendor compliance',
      async () => {
        coreDocumentId =
          randomUUID();

        await pool.query(
          `
          INSERT INTO core_documents (
            id,
            title,
            status,
            metadata,
            created_at,
            updated_at
          )
          VALUES (
            $1,
            $2,
            'GENERATED',
            $3,
            NOW(),
            NOW()
          )
          `,
          [
            coreDocumentId,
            'Vendor Insurance Certificate',
            JSON.stringify({
              source:
                'vendor-integration-test',
            }),
          ],
        );

        const issuedAt =
          new Date();

        const expiresAt =
          new Date(issuedAt);

        expiresAt.setFullYear(
          expiresAt.getFullYear() + 1,
        );

        const created =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/vendors/compliance',
            )
            .set(auth())
            .send({
              vendorId,

              complianceType:
                'INSURANCE',

              documentId:
                coreDocumentId,

              referenceNumber:
                'INS-VENDOR-2701',

              issuedAt:
                issuedAt
                  .toISOString()
                  .slice(0, 10),

              expiresAt:
                expiresAt
                  .toISOString()
                  .slice(0, 10),

              createdByPersonId:
                actorPersonId,
            })
            .expect(201);

        complianceDocumentId =
          created.body.data.id;

        expect(
          created.body.data.status,
        ).toBe('PENDING');

        const verified =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/vendors/compliance/${complianceDocumentId}/verify`,
            )
            .set(auth())
            .send({
              verifiedByPersonId:
                actorPersonId,

              remarks:
                'Compliance verified',
            })
            .expect(201);

        expect(
          verified.body.data.status,
        ).toBe('VERIFIED');
      },
    );

    it(
      'creates and completes a vendor work order',
      async () => {
        const created =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/vendors/work-orders',
            )
            .set(auth())
            .send({
              vendorId,
              propertyId,
              contractId,

              title:
                'Electrical Panel Maintenance',

              description:
                'Preventive electrical maintenance',

              priority:
                'HIGH',

              estimatedCost:
                7500,

              assignedByPersonId:
                actorPersonId,
            })
            .expect(201);

        workOrderId =
          created.body.data.id;

        workOrderNumber =
          created.body.data.workOrderNumber;

        expect(
          created.body.data.status,
        ).toBe('DRAFT');

        const transition = (
          action: string,
        ) =>
          request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/vendors/work-orders/${workOrderId}/${action}`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                actorPersonId,

              remarks:
                `Work order ${action}`,
            });

        await transition(
          'issue',
        ).expect(201);

        await transition(
          'accept',
        ).expect(201);

        await transition(
          'start',
        ).expect(201);

        await transition(
          'hold',
        ).expect(201);

        await transition(
          'resume',
        ).expect(201);

        const completed =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/vendors/work-orders/${workOrderId}/complete`,
            )
            .set(auth())
            .send({
              completedByPersonId:
                actorPersonId,

              completionNotes:
                'Electrical maintenance completed',

              actualCost:
                7000,

              remarks:
                'Completed successfully',
            })
            .expect(201);

        expect(
          completed.body.data.status,
        ).toBe('COMPLETED');
      },
    );

    it(
      'returns complete work-order history',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/vendors/work-orders/${workOrderId}`,
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.data.workOrderNumber,
        ).toBe(workOrderNumber);

        expect(
          response.body.data.history.length,
        ).toBeGreaterThanOrEqual(7);

        expect(
          response.body.data.history.map(
            (
              item: {
                toStatus: string;
              },
            ) =>
              item.toStatus,
          ),
        ).toEqual(
          expect.arrayContaining([
            'DRAFT',
            'ISSUED',
            'ACCEPTED',
            'IN_PROGRESS',
            'ON_HOLD',
            'COMPLETED',
          ]),
        );
      },
    );

    it(
      'rates a completed vendor work order',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/vendors/ratings',
            )
            .set(auth())
            .send({
              vendorId,
              workOrderId,
              propertyId,

              ratedByPersonId:
                actorPersonId,

              rating:
                5,

              qualityRating:
                5,

              timelinessRating:
                4,

              professionalismRating:
                5,

              comments:
                'Excellent service',
            })
            .expect(201);

        expect(
          response.body.data.rating,
        ).toBe(5);
      },
    );

    it(
      'rejects duplicate work-order rating',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/vendors/ratings',
          )
          .set(auth())
          .send({
            vendorId,
            workOrderId,
            propertyId,

            ratedByPersonId:
              actorPersonId,

            rating:
              4,
          })
          .expect(400);
      },
    );

    it(
      'returns vendor rating and operational metrics',
      async () => {
        const ratingSummary =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/vendors/${vendorId}/rating-summary`,
            )
            .set(auth())
            .expect(200);

        expect(
          ratingSummary.body.data.count,
        ).toBe(1);

        expect(
          ratingSummary.body.data.averageRating,
        ).toBe(5);

        const metrics =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/vendors/metrics',
            )
            .set(auth())
            .expect(200);

        expect(
          metrics.body.data.total,
        ).toBeGreaterThanOrEqual(1);

        expect(
          metrics.body.data.active,
        ).toBeGreaterThanOrEqual(1);
      },
    );

    it(
      'persists vendor audit and event records',
      async () => {
        const auditResult =
          await pool.query(
            `
            SELECT event_type
            FROM audit_logs
            WHERE payload ->> 'vendorId' = $1
            `,
            [vendorId],
          );

        const auditEvents =
          auditResult.rows.map(
            (
              row: {
                event_type: string;
              },
            ) =>
              row.event_type,
          );

        expect(
          auditEvents,
        ).toEqual(
          expect.arrayContaining([
            'vendor.created',
            'vendor.activated',
            'vendor.contract.created',
            'vendor.contract.activated',
            'vendor.compliance.added',
            'vendor.compliance.verified',
            'vendor.work_order.created',
            'vendor.work_order.completed',
            'vendor.rated',
          ]),
        );

        const eventResult =
          await pool.query(
            `
            SELECT event_type AS event_name
            FROM eventbus_events
            WHERE
              payload ->> 'vendorId' = $1
              OR (
                payload ->> 'entityId' = $1
                AND payload ->> 'entityType' = 'vendor'
              )
            `,
            [vendorId],
          );

        const eventNames =
          eventResult.rows.map(
            (
              row: {
                event_name: string;
              },
            ) =>
              row.event_name,
          );

        expect(
          eventNames,
        ).toEqual(
          expect.arrayContaining([
            'vendor.created',
            'vendor.activated',
            'vendor.contract.created',
            'vendor.contract.activated',
            'vendor.compliance.added',
            'vendor.compliance.verified',
            'vendor.work_order.created',
            'vendor.work_order.completed',
            'vendor.rated',
          ]),
        );
      },
    );

});
