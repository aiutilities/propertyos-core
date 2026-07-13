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
import { Pool } from 'pg';

import {
  AppModule,
} from '../../src/app.module';
import {
  POSTGRES_POOL,
} from '../../src/database/postgres';

describe(
  'Helpdesk API integration',
  () => {
    let app: INestApplication;
    let pool: Pool;
    let token: string;

    let ticketId: string;
    let ticketNumber: string;

    const suffix = Date.now();
    const password =
      'CorrectHorseBatteryStaple123!';
    const email =
      `helpdesk-e2e-${suffix}@propertyos.test`;

    const adminPersonId = randomUUID();
    const requesterPersonId = randomUUID();
    const assigneePersonId = randomUUID();
    const credentialId = randomUUID();
    const roleId = randomUUID();
    const personRoleId = randomUUID();
    const propertyId = randomUUID();

    const categoryId =
      '16000000-0000-4000-8000-000000000006';

    beforeAll(async () => {
      const moduleRef: TestingModule =
        await Test.createTestingModule({
          imports: [AppModule],
        }).compile();

      app =
        moduleRef.createNestApplication();

      app.setGlobalPrefix('api/v1');

      await app.init();

      pool = app.get<Pool>(
        POSTGRES_POOL,
      );

      const salt =
        randomUUID().replace(/-/g, '');

      const hash = createHash('sha256')
        .update(`${salt}:${password}`)
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
          'Helpdesk E2E Admin',
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
          requesterPersonId,
          'Helpdesk Requester',
          `helpdesk-requester-${suffix}@propertyos.test`,
          `92${String(suffix).slice(-8)}`,
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
          assigneePersonId,
          'Helpdesk Assignee',
          `helpdesk-assignee-${suffix}@propertyos.test`,
          `93${String(suffix).slice(-8)}`,
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
          `Helpdesk E2E Role ${suffix}`,
          'Helpdesk integration test role',
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

      const requiredPermissions = [
        'helpdesk.read',
        'helpdesk.create',
        'helpdesk.manage',
        'helpdesk.comment',
        'helpdesk.assign',
        'helpdesk.resolve',
        'helpdesk.configure',
        'search.read',
      ];

      for (
        const permission
        of requiredPermissions
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
            `Helpdesk test permission: ${permission}`,
          ],
        );

        const permissionResult =
          await pool.query(
            `
            SELECT id
            FROM permissions
            WHERE permission_key = $1
            `,
            [permission],
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
            permissionResult.rows[0].id,
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
          'Helpdesk E2E Property',
          `HD-E2E-${suffix}`,
          'GATED_COMMUNITY',
          'Helpdesk integration test property',
          'Madurai',
          'Tamil Nadu',
          'India',
          true,
        ],
      );

      const login = await request(
        app.getHttpServer(),
      )
        .post('/api/v1/auth/login')
        .send({
          email,
          password,
        })
        .expect(201);

      token = login.body.accessToken;
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
      'rejects unauthenticated helpdesk listing',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .get('/api/v1/helpdesk')
          .expect(401);
      },
    );

    it(
      'lists seeded helpdesk categories',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .get('/api/v1/helpdesk/categories')
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
              code: 'SERVICE_REQUEST',
            }),
          ]),
        );
      },
    );

    it(
      'creates an open helpdesk ticket with SLA dates',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post('/api/v1/helpdesk')
          .set(auth())
          .send({
            title:
              'Internet connection unavailable',
            description:
              'The common-area internet connection is unavailable.',
            categoryId,
            propertyId,
            requesterPersonId,
            priority: 'HIGH',
            channel: 'WEB',
          })
          .expect(201);

        expect(
          response.body.success,
        ).toBe(true);

        expect(
          response.body.data.status,
        ).toBe('OPEN');

        expect(
          response.body.data.priority,
        ).toBe('HIGH');

        expect(
          response.body.data.responseDueAt,
        ).toBeDefined();

        expect(
          response.body.data.resolutionDueAt,
        ).toBeDefined();

        ticketId =
          response.body.data.id;

        ticketNumber =
          response.body.data.ticketNumber;
      },
    );

    it(
      'creates SLA warning and breach scheduler jobs',
      async () => {
        const jobs =
          await pool.query(
            `
            SELECT job_type
            FROM scheduler_jobs
            WHERE payload->>'ticketId' = $1
            ORDER BY job_type
            `,
            [ticketId],
          );

        expect(
          jobs.rows.map(
            (row) => row.job_type,
          ),
        ).toEqual(
          expect.arrayContaining([
            'helpdesk.sla.warning',
            'helpdesk.sla.breach',
          ]),
        );
      },
    );

    it(
      'lists and searches the created ticket',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .get('/api/v1/helpdesk')
          .query({
            propertyId,
            status: 'OPEN',
            search: ticketNumber,
          })
          .set(auth())
          .expect(200);

        expect(
          response.body.data,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: ticketId,
              ticketNumber,
              status: 'OPEN',
            }),
          ]),
        );
      },
    );

    it(
      'returns the ticket from global search',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post('/api/v1/search')
          .set(auth())
          .send({
            query: ticketNumber,
            entityTypes: [
              'helpdesk',
            ],
          })
          .expect(201);

        expect(
          response.body,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              entityType: 'helpdesk',
              entityId: ticketId,
              title:
                'Internet connection unavailable',
              metadata:
                expect.objectContaining({
                  ticketNumber,
                  propertyId,
                  status: 'OPEN',
                  priority: 'HIGH',
                }),
            }),
          ]),
        );
      },
    );

    it(
      'returns helpdesk metrics',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .get('/api/v1/helpdesk/metrics')
          .query({
            propertyId,
          })
          .set(auth())
          .expect(200);

        expect(
          response.body.data.total,
        ).toBeGreaterThanOrEqual(1);

        expect(
          response.body.data.open,
        ).toBeGreaterThanOrEqual(1);
      },
    );

    it(
      'rejects starting an unassigned ticket',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/helpdesk/${ticketId}/start-progress`,
          )
          .set(auth())
          .send({
            changedByPersonId:
              adminPersonId,
          })
          .expect(400);
      },
    );

    it(
      'assigns the ticket',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/helpdesk/${ticketId}/assign`,
          )
          .set(auth())
          .send({
            assigneePersonId,
            changedByPersonId:
              adminPersonId,
            remarks:
              'Assigned to support technician',
          })
          .expect(201);

        expect(
          response.body.data.status,
        ).toBe('ASSIGNED');

        expect(
          response.body.data.assigneePersonId,
        ).toBe(assigneePersonId);

        expect(
          response.body.data.firstRespondedAt,
        ).toBeDefined();
      },
    );

    it(
      'starts work on the assigned ticket',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/helpdesk/${ticketId}/start-progress`,
          )
          .set(auth())
          .send({
            changedByPersonId:
              assigneePersonId,
            remarks:
              'Diagnosis started',
          })
          .expect(201);

        expect(
          response.body.data.status,
        ).toBe('IN_PROGRESS');
      },
    );

    it(
      'adds a public comment',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/helpdesk/${ticketId}/comments`,
          )
          .set(auth())
          .send({
            authorPersonId:
              assigneePersonId,
            body:
              'The network equipment is being checked.',
            visibility: 'PUBLIC',
          })
          .expect(201);

        expect(
          response.body.data.body,
        ).toBe(
          'The network equipment is being checked.',
        );

        expect(
          response.body.data.visibility,
        ).toBe('PUBLIC');
      },
    );

    it(
      'adds a technician worklog',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/helpdesk/${ticketId}/worklogs`,
          )
          .set(auth())
          .send({
            personId:
              assigneePersonId,
            minutesSpent: 35,
            description:
              'Inspected router and restored the uplink.',
          })
          .expect(201);

        expect(
          response.body.data.minutesSpent,
        ).toBe(35);
      },
    );

    it(
      'rejects feedback before resolution',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/helpdesk/${ticketId}/feedback`,
          )
          .set(auth())
          .send({
            submittedByPersonId:
              requesterPersonId,
            rating: 5,
          })
          .expect(400);
      },
    );

    it(
      'resolves the ticket',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/helpdesk/${ticketId}/resolve`,
          )
          .set(auth())
          .send({
            changedByPersonId:
              assigneePersonId,
            resolutionSummary:
              'Router uplink was reset and connectivity was restored.',
            remarks:
              'Service restored',
          })
          .expect(201);

        expect(
          response.body.data.status,
        ).toBe('RESOLVED');

        expect(
          response.body.data.resolvedAt,
        ).toBeDefined();

        expect(
          response.body.data.resolutionSummary,
        ).toContain(
          'connectivity was restored',
        );
      },
    );

    it(
      'accepts customer feedback once',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/helpdesk/${ticketId}/feedback`,
          )
          .set(auth())
          .send({
            submittedByPersonId:
              requesterPersonId,
            rating: 5,
            comments:
              'Resolved quickly.',
          })
          .expect(201);

        expect(
          response.body.data.rating,
        ).toBe(5);

        await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/helpdesk/${ticketId}/feedback`,
          )
          .set(auth())
          .send({
            submittedByPersonId:
              requesterPersonId,
            rating: 4,
          })
          .expect(400);
      },
    );

    it(
      'closes the resolved ticket',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/helpdesk/${ticketId}/close`,
          )
          .set(auth())
          .send({
            changedByPersonId:
              adminPersonId,
            remarks:
              'Requester confirmed resolution',
          })
          .expect(201);

        expect(
          response.body.data.status,
        ).toBe('CLOSED');

        expect(
          response.body.data.closedAt,
        ).toBeDefined();
      },
    );

    it(
      'returns complete ticket collaboration details and history',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .get(
            `/api/v1/helpdesk/${ticketId}`,
          )
          .set(auth())
          .expect(200);

        expect(
          response.body.data.comments,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              visibility: 'PUBLIC',
            }),
          ]),
        );

        expect(
          response.body.data.worklogs,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              minutesSpent: 35,
            }),
          ]),
        );

        expect(
          response.body.data.feedback,
        ).toEqual(
          expect.objectContaining({
            rating: 5,
          }),
        );

        expect(
          response.body.data.history.map(
            (entry: {
              toStatus: string;
            }) => entry.toStatus,
          ),
        ).toEqual([
          'OPEN',
          'ASSIGNED',
          'IN_PROGRESS',
          'RESOLVED',
          'CLOSED',
        ]);
      },
    );

    it(
      'persists helpdesk audit and event records',
      async () => {
        const audit =
          await pool.query(
            `
            SELECT
              event_type,
              source,
              payload
            FROM audit_logs
            WHERE payload->>'ticketId' = $1
            ORDER BY created_at ASC
            `,
            [ticketId],
          );

        expect(
          audit.rows.map(
            (row) => row.event_type,
          ),
        ).toEqual(
          expect.arrayContaining([
            'helpdesk.ticket.created',
            'helpdesk.ticket.assigned',
            'helpdesk.ticket.in_progress',
            'helpdesk.ticket.comment_added',
            'helpdesk.ticket.worklog_added',
            'helpdesk.ticket.resolved',
            'helpdesk.ticket.feedback_submitted',
            'helpdesk.ticket.closed',
          ]),
        );

        expect(
          audit.rows.every(
            (row) =>
              row.source ===
              'core.helpdesk',
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
            [ticketId],
          );

        expect(
          events.rows.map(
            (row) => row.event_type,
          ),
        ).toEqual(
          expect.arrayContaining([
            'helpdesk.ticket.created',
            'helpdesk.ticket.assigned',
            'helpdesk.ticket.in_progress',
            'helpdesk.ticket.comment_added',
            'helpdesk.ticket.worklog_added',
            'helpdesk.ticket.resolved',
            'helpdesk.ticket.feedback_submitted',
            'helpdesk.ticket.closed',
          ]),
        );
      },
    );
  },
);
