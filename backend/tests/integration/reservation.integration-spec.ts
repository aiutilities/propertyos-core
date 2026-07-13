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
  AppModule,
} from '../../src/app.module';
import {
  POSTGRES_POOL,
} from '../../src/database/postgres';
import {
  Pool,
} from 'pg';

describe(
  'Reservation API integration',
  () => {
    let app: INestApplication;
    let pool: Pool;
    let token: string;

    let resourceId: string;
    let reservationId: string;
    let reservationNumber: string;

    const suffix = Date.now();
    const password =
      'CorrectHorseBatteryStaple123!';
    const email =
      `reservation-e2e-${suffix}@propertyos.test`;

    const adminPersonId = randomUUID();
    const requesterPersonId = randomUUID();
    const approverPersonId = randomUUID();
    const credentialId = randomUUID();
    const roleId = randomUUID();
    const personRoleId = randomUUID();
    const propertyId = randomUUID();

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
          'Reservation E2E Admin',
          email,
          '9000000401',
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
          'Reservation Requester',
          `reservation-requester-${suffix}@propertyos.test`,
          '9000000402',
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
          approverPersonId,
          'Reservation Approver',
          `reservation-approver-${suffix}@propertyos.test`,
          '9000000403',
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
          `Reservation E2E Role ${suffix}`,
          'Reservation integration test role',
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
        'reservation.read',
        'reservation.create',
        'reservation.update',
        'reservation.cancel',
        'reservation.approve',
        'reservation.manage',
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
            `Reservation test permission: ${permission}`,
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
          'Reservation E2E Property',
          `RSV-E2E-${suffix}`,
          'GATED_COMMUNITY',
          'Reservation integration test property',
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

    function futureRange(
      hoursFromNow: number,
      durationHours = 2,
    ) {
      const startAt = new Date(
        Date.now() +
          hoursFromNow *
            60 *
            60 *
            1000,
      );

      // Keep reservations within operating hours (10:00–22:00)
      if (startAt.getHours() < 10) {
        startAt.setHours(10, 0, 0, 0);
      }

      if (startAt.getHours() > 20) {
        startAt.setDate(
          startAt.getDate() + 1,
        );
        startAt.setHours(10, 0, 0, 0);
      }

      startAt.setMinutes(0, 0, 0);

      const endAt = new Date(startAt);
      endAt.setHours(
        startAt.getHours() + durationHours,
      );

      return {
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      };
    }

    it(
      'rejects unauthenticated reservation listing',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .get('/api/v1/reservations')
          .expect(401);
      },
    );

    it(
      'creates an approval-based reservation resource',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/reservations/resources',
          )
          .set(auth())
          .send({
            propertyId,
            code:
              `CLUBHOUSE-${suffix}`,
            name: 'Clubhouse',
            description:
              'Community clubhouse',
            resourceType:
              'FACILITY',
            capacity: 30,
            requiresApproval: true,
            minimumDurationMinutes: 60,
            maximumDurationMinutes: 240,
            bookingIntervalMinutes: 60,
            advanceBookingDays: 60,
            minimumNoticeMinutes: 0,
            openingTime: '06:00',
            closingTime: '23:00',
          })
          .expect(201);

        expect(
          response.body.success,
        ).toBe(true);

        expect(
          response.body.data.name,
        ).toBe('Clubhouse');

        expect(
          response.body.data
            .requiresApproval,
        ).toBe(true);

        resourceId =
          response.body.data.id;
      },
    );

    it(
      'rejects duplicate normalized resource codes',
      async () => {
        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/reservations/resources',
          )
          .set(auth())
          .send({
            propertyId,
            code:
              `club house ${suffix}`,
            name:
              'Duplicate Clubhouse',
            resourceType:
              'FACILITY',
            capacity: 10,
            requiresApproval: false,
            minimumDurationMinutes: 60,
            bookingIntervalMinutes: 60,
            advanceBookingDays: 30,
            minimumNoticeMinutes: 0,
          })
          .expect(409);
      },
    );

    it(
      'lists and searches reservation resources',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .get(
            '/api/v1/reservations/resources',
          )
          .query({
            propertyId,
            resourceType:
              'FACILITY',
            isActive: true,
            search: 'Clubhouse',
          })
          .set(auth())
          .expect(200);

        expect(
          response.body.data,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: resourceId,
              name: 'Clubhouse',
            }),
          ]),
        );
      },
    );

    it(
      'returns the reservation resource details',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .get(
            `/api/v1/reservations/resources/${resourceId}`,
          )
          .set(auth())
          .expect(200);

        expect(
          response.body.data.id,
        ).toBe(resourceId);

        expect(
          response.body.data.capacity,
        ).toBe(30);
      },
    );

    it(
      'updates reservation resource configuration',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .patch(
            `/api/v1/reservations/resources/${resourceId}`,
          )
          .set(auth())
          .send({
            capacity: 40,
            requiresApproval: true,
          })
          .expect(200);

        expect(
          response.body.data.capacity,
        ).toBe(40);
      },
    );

    it(
      'reports an available time slot',
      async () => {
        const range =
          futureRange(48);

        const response = await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/reservations/availability',
          )
          .set(auth())
          .send({
            resourceId,
            ...range,
          })
          .expect(201);

        expect(
          response.body.data.available,
        ).toBe(true);
      },
    );

    it(
      'creates a pending reservation and scheduler jobs',
      async () => {
        const range =
          futureRange(72);

        const response = await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/reservations',
          )
          .set(auth())
          .send({
            resourceId,
            propertyId,
            requesterPersonId,
            title:
              'Community Meeting',
            description:
              'Monthly community meeting',
            attendeeCount: 20,
            ...range,
          })
          .expect(201);

        expect(
          response.body.data.status,
        ).toBe('PENDING');

        expect(
          response.body.data
            .approvalRequired,
        ).toBe(true);

        reservationId =
          response.body.data.id;
        reservationNumber =
          response.body.data
            .reservationNumber;

        const jobs =
          await pool.query(
            `
            SELECT job_type
            FROM scheduler_jobs
            WHERE payload->>'reservationId'
              = $1
            ORDER BY job_type
            `,
            [reservationId],
          );

        expect(
          jobs.rows.map(
            (row) => row.job_type,
          ),
        ).toEqual(
          expect.arrayContaining([
            'reservation.reminder',
            'reservation.end',
          ]),
        );
      },
    );

    it(
      'creates reservation history and workflow instance',
      async () => {
        const details =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/reservations/${reservationId}`,
            )
            .set(auth())
            .expect(200);

        expect(
          details.body.data.history,
        ).toEqual([
          expect.objectContaining({
            toStatus: 'PENDING',
          }),
        ]);

        const workflow =
          await pool.query(
            `
            SELECT wi.current_state
            FROM workflow_instances wi
            WHERE wi.entity_type =
              'reservation'
              AND wi.entity_id = $1
            `,
            [reservationId],
          );

        expect(
          workflow.rows,
        ).toHaveLength(1);

        expect(
          workflow.rows[0]
            .current_state,
        ).toBe('PENDING');
      },
    );

    it(
      'detects a conflicting reservation',
      async () => {
        const current =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/reservations/${reservationId}`,
            )
            .set(auth())
            .expect(200);

        const response = await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/reservations/availability',
          )
          .set(auth())
          .send({
            resourceId,
            startAt:
              current.body.data
                .startAt,
            endAt:
              current.body.data.endAt,
          })
          .expect(201);

        expect(
          response.body.data.available,
        ).toBe(false);

        expect(
          response.body.data
            .conflictingReservations,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: reservationId,
            }),
          ]),
        );
      },
    );

    it(
      'rejects creation for a conflicting time slot',
      async () => {
        const current =
          await request(
            app.getHttpServer(),
          )
            .get(
              `/api/v1/reservations/${reservationId}`,
            )
            .set(auth())
            .expect(200);

        await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/reservations',
          )
          .set(auth())
          .send({
            resourceId,
            propertyId,
            requesterPersonId,
            title:
              'Conflicting Meeting',
            attendeeCount: 5,
            startAt:
              current.body.data
                .startAt,
            endAt:
              current.body.data.endAt,
          })
          .expect(409);
      },
    );

    it(
      'approves the pending reservation',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/reservations/${reservationId}/approve`,
          )
          .set(auth())
          .send({
            approvedByPersonId:
              approverPersonId,
            remarks:
              'Approved for community use',
          })
          .expect(201);

        expect(
          response.body.data.status,
        ).toBe('APPROVED');

        const workflow =
          await pool.query(
            `
            SELECT current_state
            FROM workflow_instances
            WHERE entity_type =
              'reservation'
              AND entity_id = $1
            `,
            [reservationId],
          );

        expect(
          workflow.rows[0]
            .current_state,
        ).toBe('APPROVED');
      },
    );

    it(
      'lists the reservation by property and status',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .get('/api/v1/reservations')
          .query({
            propertyId,
            status: 'APPROVED',
            search:
              reservationNumber,
          })
          .set(auth())
          .expect(200);

        expect(
          response.body.data,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: reservationId,
              status: 'APPROVED',
            }),
          ]),
        );
      },
    );

    it(
      'returns reservation metrics',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .get(
            '/api/v1/reservations/metrics',
          )
          .query({ propertyId })
          .set(auth())
          .expect(200);

        expect(
          response.body.data.total,
        ).toBeGreaterThanOrEqual(1);

        expect(
          response.body.data.approved,
        ).toBeGreaterThanOrEqual(1);

        expect(
          response.body.data.upcoming,
        ).toBeGreaterThanOrEqual(1);
      },
    );

    it(
      'returns reservation records from global search',
      async () => {
        const response = await request(
          app.getHttpServer(),
        )
          .post('/api/v1/search')
          .set(auth())
          .send({
            query: reservationNumber,
            entityTypes: [
              'reservation',
            ],
            limit: 10,
          })
          .expect(201);

        expect(
          response.body,
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              entityType:
                'reservation',
              entityId:
                reservationId,
            }),
          ]),
        );
      },
    );

    it(
      'persists reservation audit and event records',
      async () => {
        const audit =
          await pool.query(
            `
            SELECT
              event_type,
              source,
              payload
            FROM audit_logs
            WHERE payload->>'reservationId'
              = $1
            ORDER BY created_at ASC
            `,
            [reservationId],
          );

        expect(
          audit.rows.map(
            (row) => row.event_type,
          ),
        ).toEqual(
          expect.arrayContaining([
            'reservation.created',
            'reservation.approved',
          ]),
        );

        expect(
          audit.rows.every(
            (row) =>
              row.source ===
              'core.reservation',
          ),
        ).toBe(true);

        const events =
          await pool.query(
            `
            SELECT event_type
            FROM eventbus_events
            WHERE payload->>'reservationId'
              = $1
            `,
            [reservationId],
          );

        expect(
          events.rows.map(
            (row) => row.event_type,
          ),
        ).toEqual(
          expect.arrayContaining([
            'reservation.created',
            'reservation.submitted',
            'reservation.approved',
          ]),
        );
      },
    );

    it(
      'creates a resource block and reports it as unavailable',
      async () => {
        const range =
          futureRange(120);

        await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/reservations/resources/${resourceId}/blocks`,
          )
          .set(auth())
          .send({
            ...range,
            reason:
              'Scheduled maintenance',
            createdByPersonId:
              approverPersonId,
          })
          .expect(201);

        const response = await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/reservations/availability',
          )
          .set(auth())
          .send({
            resourceId,
            ...range,
          })
          .expect(201);

        expect(
          response.body.data.available,
        ).toBe(false);

        expect(
          response.body.data
            .conflictingBlocks,
        ).toHaveLength(1);
      },
    );

    it(
      'rejects a separate pending reservation',
      async () => {
        const range =
          futureRange(144);

        const created = await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/reservations',
          )
          .set(auth())
          .send({
            resourceId,
            propertyId,
            requesterPersonId,
            title:
              'Rejected Reservation',
            attendeeCount: 5,
            ...range,
          })
          .expect(201);

        const response = await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/reservations/${created.body.data.id}/reject`,
          )
          .set(auth())
          .send({
            rejectedByPersonId:
              approverPersonId,
            reason:
              'Resource unavailable operationally',
          })
          .expect(201);

        expect(
          response.body.data.status,
        ).toBe('REJECTED');

        expect(
          response.body.data
            .rejectionReason,
        ).toBe(
          'Resource unavailable operationally',
        );
      },
    );

    it(
      'cancels a separate approved reservation',
      async () => {
        const range =
          futureRange(168);

        const created = await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/reservations',
          )
          .set(auth())
          .send({
            resourceId,
            propertyId,
            requesterPersonId,
            title:
              'Cancellation Test',
            attendeeCount: 5,
            ...range,
          })
          .expect(201);

        await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/reservations/${created.body.data.id}/approve`,
          )
          .set(auth())
          .send({
            approvedByPersonId:
              approverPersonId,
          })
          .expect(201);

        const response = await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/reservations/${created.body.data.id}/cancel`,
          )
          .set(auth())
          .send({
            cancelledByPersonId:
              requesterPersonId,
            reason:
              'Plans changed',
          })
          .expect(201);

        expect(
          response.body.data.status,
        ).toBe('CANCELLED');
      },
    );

    it(
      'checks in and completes an approved reservation',
      async () => {
        const range =
          futureRange(192);

        const created = await request(
          app.getHttpServer(),
        )
          .post(
            '/api/v1/reservations',
          )
          .set(auth())
          .send({
            resourceId,
            propertyId,
            requesterPersonId,
            title:
              'Lifecycle Test',
            attendeeCount: 5,
            ...range,
          })
          .expect(201);

        const id =
          created.body.data.id;

        await request(
          app.getHttpServer(),
        )
          .post(
            `/api/v1/reservations/${id}/approve`,
          )
          .set(auth())
          .send({
            approvedByPersonId:
              approverPersonId,
          })
          .expect(201);

        const checkedIn =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/reservations/${id}/check-in`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                approverPersonId,
            })
            .expect(201);

        expect(
          checkedIn.body.data.status,
        ).toBe('CHECKED_IN');

        const completed =
          await request(
            app.getHttpServer(),
          )
            .post(
              `/api/v1/reservations/${id}/complete`,
            )
            .set(auth())
            .send({
              changedByPersonId:
                approverPersonId,
            })
            .expect(201);

        expect(
          completed.body.data.status,
        ).toBe('COMPLETED');
      },
    );
  },
);
