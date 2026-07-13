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
  'Communications API integration',
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
        'communications.read',
        'communications.create',
        'communications.manage',
        'communications.publish',
        'communications.archive',
        'communications.read_receipts',
        'communications.configure',
        'search.read',
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
            `Communications test permission: ${permission}`,
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
          'Communications E2E Property',
          `COM-E2E-${suffix}`,
          'GATED_COMMUNITY',
          'Communications integration test property',
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
      'rejects unauthenticated communication listing',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .get(
            '/api/v1/communications',
          )
          .expect(401);
      },
    );

    it(
      'lists seeded communication categories',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/communications/categories',
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.success,
        ).toBe(true);

        expect(
          response.body.data,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: categoryId,
              code: 'GENERAL',
            }),
          ]),
        );
      },
    );

    it(
      'creates a draft communication with targets',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              '/api/v1/communications',
            )
            .set(auth())
            .send({
              propertyId,
              categoryId,
              type:
                'ANNOUNCEMENT',
              title:
                'Water supply interruption',
              content:
                'Water supply will be interrupted for maintenance.',
              summary:
                'Water shutdown notice',
              priority:
                'HIGH',
              isPinned:
                true,
              requiresAcknowledgement:
                true,
              expiresAt:
                new Date(
                  Date.now() +
                    24 *
                      60 *
                      60 *
                      1000,
                ).toISOString(),
              createdByPersonId:
                adminPersonId,
              targets: [
                {
                  audienceType:
                    'ALL_PROPERTY',
                },
                {
                  audienceType:
                    'ZONE',
                  zoneId,
                },
                {
                  audienceType:
                    'PERSON',
                  personId:
                    residentPersonId,
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
          response.body.data.isPinned,
        ).toBe(true);

        communicationId =
          response.body.data.id;

        communicationNumber =
          response.body.data
            .communicationNumber;
      },
    );

    it(
      'returns draft details and targets',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/communications/${communicationId}`,
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.data.targets,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              audienceType:
                'ALL_PROPERTY',
            }),
            expect.objectContaining({
              audienceType:
                'ZONE',
              zoneId,
            }),
            expect.objectContaining({
              audienceType:
                'PERSON',
              personId:
                residentPersonId,
            }),
          ]),
        );

        expect(
          response.body.data.history.map(
            (
              entry: {
                toStatus: string;
              },
            ) => entry.toStatus,
          ),
        ).toEqual([
          'DRAFT',
        ]);
      },
    );

    it(
      'updates a draft communication',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .patch(
              `/api/v1/communications/${communicationId}`,
            )
            .set(auth())
            .send({
              title:
                'Updated water supply interruption',
              priority:
                'URGENT',
              updatedByPersonId:
                adminPersonId,
            })
            .expect(200);

        expect(
          response.body.data.title,
        ).toBe(
          'Updated water supply interruption',
        );

        expect(
          response.body.data.priority,
        ).toBe('URGENT');
      },
    );

    it(
      'rejects reading a draft communication',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/communications/${communicationId}/read`,
          )
          .set(auth())
          .send({
            personId:
              residentPersonId,
          })
          .expect(400);
      },
    );

    it(
      'schedules the draft communication',
      async () => {
        const publishAt =
          new Date(
            Date.now() +
              60 * 60 * 1000,
          ).toISOString();

        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/communications/${communicationId}/schedule`,
            )
            .set(auth())
            .send({
              publishAt,
              changedByPersonId:
                adminPersonId,
              remarks:
                'Scheduled for publication',
            })
            .expect(201);

        expect(
          response.body.data.status,
        ).toBe('SCHEDULED');

        expect(
          response.body.data.publishAt,
        ).toBeDefined();
      },
    );

    it(
      'rejects editing a scheduled communication',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .patch(
            `/api/v1/communications/${communicationId}`,
          )
          .set(auth())
          .send({
            title:
              'Should not update',
            updatedByPersonId:
              adminPersonId,
          })
          .expect(400);
      },
    );

    it(
      'publishes the scheduled communication',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/communications/${communicationId}/publish`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                adminPersonId,
              remarks:
                'Published immediately',
            })
            .expect(201);

        expect(
          response.body.data.status,
        ).toBe('PUBLISHED');

        expect(
          response.body.data.publishedAt,
        ).toBeDefined();
      },
    );

    it(
      'marks the communication as read idempotently',
      async () => {
        const first =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/communications/${communicationId}/read`,
            )
            .set(auth())
            .send({
              personId:
                residentPersonId,
            })
            .expect(201);

        const second =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/communications/${communicationId}/read`,
            )
            .set(auth())
            .send({
              personId:
                residentPersonId,
            })
            .expect(201);

        expect(
          second.body.data.id,
        ).toBe(
          first.body.data.id,
        );
      },
    );

    it(
      'acknowledges the communication',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/communications/${communicationId}/acknowledge`,
            )
            .set(auth())
            .send({
              personId:
                residentPersonId,
            })
            .expect(201);

        expect(
          response.body.data.acknowledgedAt,
        ).toBeDefined();
      },
    );

    it(
      'returns reads and engagement metrics',
      async () => {
        const reads =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/communications/${communicationId}/reads`,
            )
            .set(auth())
            .expect(200);

        expect(
          reads.body.data,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              personId:
                residentPersonId,
            }),
          ]),
        );

        const engagement =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/communications/${communicationId}/engagement`,
            )
            .set(auth())
            .expect(200);

        expect(
          engagement.body.data,
        ).toEqual(
          expect.objectContaining({
            communicationId,
            totalReads: 1,
            totalAcknowledgements:
              1,
            acknowledgementRequired:
              true,
          }),
        );
      },
    );

    it(
      'lists and filters the communication',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/communications',
            )
            .query({
              propertyId,
              status:
                'PUBLISHED',
              search:
                communicationNumber,
            })
            .set(auth())
            .expect(200);

        expect(
          response.body.data,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id:
                communicationId,
              communicationNumber,
              status:
                'PUBLISHED',
            }),
          ]),
        );
      },
    );

    it(
      'returns the communication from global search',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .post('/api/v1/search')
            .set(auth())
            .send({
              query:
                communicationNumber,
              entityTypes: [
                'communications',
              ],
            })
            .expect(201);

        expect(
          response.body,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              entityType:
                'communications',
              entityId:
                communicationId,
              title:
                'Updated water supply interruption',
              metadata:
                expect.objectContaining({
                  communicationNumber,
                  propertyId,
                  status:
                    'PUBLISHED',
                  priority:
                    'URGENT',
                }),
            }),
          ]),
        );
      },
    );

    it(
      'returns communication metrics',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              '/api/v1/communications/metrics',
            )
            .query({
              propertyId,
            })
            .set(auth())
            .expect(200);

        expect(
          response.body.data.total,
        ).toBeGreaterThanOrEqual(
          1,
        );

        expect(
          response.body.data.published,
        ).toBeGreaterThanOrEqual(
          1,
        );

        expect(
          response.body.data.urgent,
        ).toBeGreaterThanOrEqual(
          1,
        );
      },
    );

    it(
      'expires and archives the communication',
      async () => {
        const expired =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/communications/${communicationId}/expire`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                adminPersonId,
              remarks:
                'Notice period ended',
            })
            .expect(201);

        expect(
          expired.body.data.status,
        ).toBe('EXPIRED');

        const archived =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/communications/${communicationId}/archive`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                adminPersonId,
              remarks:
                'Archived after expiry',
            })
            .expect(201);

        expect(
          archived.body.data.status,
        ).toBe('ARCHIVED');
      },
    );

    it(
      'returns complete lifecycle history',
      async () => {
        const response =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/communications/${communicationId}/history`,
            )
            .set(auth())
            .expect(200);

        expect(
          response.body.data.map(
            (
              entry: {
                toStatus: string;
              },
            ) => entry.toStatus,
          ),
        ).toEqual([
          'DRAFT',
          'SCHEDULED',
          'PUBLISHED',
          'EXPIRED',
          'ARCHIVED',
        ]);
      },
    );

    it(
      'persists communication audit and event records',
      async () => {
        const audit =
          await pool.query(
            `
            SELECT
              event_type,
              source
            FROM audit_logs
            WHERE payload->>'communicationId' = $1
            ORDER BY created_at ASC
            `,
            [
              communicationId,
            ],
          );

        expect(
          audit.rows.map(
            (row) =>
              row.event_type,
          ),
        ).toEqual(
          expect.arrayContaining([
            'communications.communication.created',
            'communications.communication.updated',
            'communications.communication.scheduled',
            'communications.communication.published',
            'communications.communication.read',
            'communications.communication.acknowledged',
            'communications.communication.expired',
            'communications.communication.archived',
          ]),
        );

        expect(
          audit.rows.every(
            (row) =>
              row.source ===
              'core.communications',
          ),
        ).toBe(true);

        const events =
          await pool.query(
            `
            SELECT event_type
            FROM eventbus_events
            WHERE payload->>'id' = $1
            ORDER BY created_at ASC
            `,
            [
              communicationId,
            ],
          );

        expect(
          events.rows.map(
            (row) =>
              row.event_type,
          ),
        ).toEqual(
          expect.arrayContaining([
            'communications.communication.created',
            'communications.communication.updated',
            'communications.communication.scheduled',
            'communications.communication.published',
            'communications.communication.read',
            'communications.communication.expired',
            'communications.communication.archived',
          ]),
        );
      },
    );
  },
);
