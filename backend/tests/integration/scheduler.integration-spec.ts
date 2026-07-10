import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import {
  REPORT_EXPORT_JOB_TYPE,
  SchedulerService,
  SchedulerWorkerService,
} from '../../src/core/scheduler';
import { EventBusService } from '../../src/core/eventbus/services/eventbus.service';
import { PropertyOSEvent } from '../../src/core/eventbus/types/event.types';
import { SchedulerJob } from '../../src/core/scheduler/types/scheduler.types';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Scheduler API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;
  let handledJobs: string[];
  let eventBus: EventBusService;
  let schedulerWorker: SchedulerWorkerService;
  const reportEvents: PropertyOSEvent[] = [];

  const timestamp = Date.now();
  const email = `scheduler-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const personId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const successJobType = `scheduler.success.${timestamp}`;
  const failureJobType = `scheduler.failure.${timestamp}`;

  const requiredPermissions = [
    Permissions.SCHEDULER_READ,
    Permissions.SCHEDULER_MANAGE,
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);
    eventBus = app.get(EventBusService);
    schedulerWorker = app.get(SchedulerWorkerService);

    eventBus.subscribeAll((event) => {
      if (event.type.startsWith('report.export.')) {
        reportEvents.push(event);
      }
    });

    await pool.query(`DROP TABLE IF EXISTS scheduler_jobs`);

    await pool.query(`
      CREATE TABLE scheduler_jobs (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        job_type VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        payload JSONB NOT NULL DEFAULT '{}'::jsonb,
        schedule_type VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
        run_at TIMESTAMPTZ NULL,
        cron_expression VARCHAR(255) NULL,
        last_run_at TIMESTAMPTZ NULL,
        next_run_at TIMESTAMPTZ NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 3,
        error_message TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    handledJobs = [];

    const schedulerService = app.get(SchedulerService);

    schedulerService.registerHandler({
      jobType: successJobType,
      async handle(job: SchedulerJob): Promise<void> {
        handledJobs.push(job.id);
      },
    });

    schedulerService.registerHandler({
      jobType: failureJobType,
      async handle(): Promise<void> {
        throw new Error('Planned scheduler failure');
      },
    });

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `INSERT INTO persons (id, display_name, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [personId, 'Scheduler E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `INSERT INTO credentials (id, person_id, credential_type, credential_value)
       VALUES ($1, $2, $3, $4)`,
      [credentialId, personId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `INSERT INTO roles (id, name, description)
       VALUES ($1, $2, $3)`,
      [roleId, `Scheduler E2E Role ${timestamp}`, 'Scheduler integration test role'],
    );

    await pool.query(
      `INSERT INTO person_roles (id, person_id, role_id)
       VALUES ($1, $2, $3)`,
      [personRoleId, personId, roleId],
    );

    for (const permission of requiredPermissions) {
      const permissionId = randomUUID();
      const rolePermissionId = randomUUID();

      await pool.query(
        `INSERT INTO permissions (id, permission_key, description)
         VALUES ($1, $2, $3)
         ON CONFLICT (permission_key) DO NOTHING`,
        [permissionId, permission, permission],
      );

      await pool.query(
        `INSERT INTO role_permissions (id, role_id, permission_id)
         SELECT $1, $2, id
         FROM permissions
         WHERE permission_key = $3
         ON CONFLICT DO NOTHING`,
        [rolePermissionId, roleId, permission],
      );
    }

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('secures scheduler APIs and executes successful and failed jobs', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/scheduler/jobs')
      .expect(401);

    await request(app.getHttpServer())
      .get('/api/v1/scheduler/handlers')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.handlers).toContain(successJobType);
        expect(response.body.data.handlers).toContain(failureJobType);
        expect(response.body.data.handlers).toContain(
          REPORT_EXPORT_JOB_TYPE,
        );
      });

    const successJobResponse = await request(app.getHttpServer())
      .post('/api/v1/scheduler/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Send visitor reminder',
        jobType: successJobType,
        payload: {
          visitorName: 'Ravi',
        },
        scheduleType: 'MANUAL',
        maxAttempts: 5,
      })
      .expect(201);

    const successJob = successJobResponse.body.data.job;
    expect(successJob.id).toBeDefined();
    expect(successJob.status).toBe('PENDING');
    expect(successJob.attempts).toBe(0);

    await request(app.getHttpServer())
      .get(`/api/v1/scheduler/jobs/${successJob.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.job.id).toBe(successJob.id);
        expect(response.body.data.job.payload.visitorName).toBe('Ravi');
      });

    await request(app.getHttpServer())
      .post(`/api/v1/scheduler/jobs/${successJob.id}/run`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201)
      .expect((response) => {
        expect(response.body.data.job.status).toBe('COMPLETED');
        expect(response.body.data.job.attempts).toBe(1);
        expect(response.body.data.job.lastRunAt).toBeDefined();
      });

    expect(handledJobs).toContain(successJob.id);

    const failureJobResponse = await request(app.getHttpServer())
      .post('/api/v1/scheduler/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Failing scheduler job',
        jobType: failureJobType,
        payload: {
          shouldFail: true,
        },
      })
      .expect(201);

    const failureJob = failureJobResponse.body.data.job;

    await request(app.getHttpServer())
      .post(`/api/v1/scheduler/jobs/${failureJob.id}/run`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201)
      .expect((response) => {
        expect(response.body.data.job.status).toBe('FAILED');
        expect(response.body.data.job.attempts).toBe(1);
        expect(response.body.data.job.errorMessage).toBe('Planned scheduler failure');
      });

    await request(app.getHttpServer())
      .get('/api/v1/scheduler/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const jobs = response.body.data.jobs;
        expect(jobs.some((job: any) => job.id === successJob.id)).toBe(true);
        expect(jobs.some((job: any) => job.id === failureJob.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .post('/api/v1/scheduler/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Missing handler job',
        jobType: `scheduler.missing.${timestamp}`,
      })
      .expect(201)
      .then(async (response) => {
        await request(app.getHttpServer())
          .post(`/api/v1/scheduler/jobs/${response.body.data.job.id}/run`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(201)
          .expect((runResponse) => {
            expect(runResponse.body.data.job.status).toBe('FAILED');
            expect(runResponse.body.data.job.errorMessage).toContain('No handler registered');
          });
      });
  });

  it('executes a REPORT_EXPORT job and publishes generated metadata', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/scheduler/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Scheduled rent collection export',
        jobType: REPORT_EXPORT_JOB_TYPE,
        payload: {
          reportType: 'RENT_COLLECTION',
          format: 'CSV',
          filters: {
            sortBy: 'paymentDate',
            sortOrder: 'desc',
          },
          recipients: ['owner@propertyos.test'],
          channel: 'EMAIL',
        },
        scheduleType: 'MANUAL',
      })
      .expect(201);

    const job = createResponse.body.data.job;

    await request(app.getHttpServer())
      .post(`/api/v1/scheduler/jobs/${job.id}/run`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201)
      .expect((response) => {
        expect(response.body.data.job.status).toBe(
          'COMPLETED',
        );
        expect(response.body.data.job.attempts).toBe(1);
      });

    const generatedEvent = reportEvents.find(
      (event) =>
        event.type === 'report.export.generated' &&
        event.payload.jobId === job.id,
    );

    expect(generatedEvent).toBeDefined();
    expect(generatedEvent?.source).toBe(
      'scheduler.report-export',
    );
    expect(generatedEvent?.correlationId).toBe(job.id);
    expect(generatedEvent?.payload.reportType).toBe(
      'RENT_COLLECTION',
    );
    expect(generatedEvent?.payload.format).toBe('CSV');
    expect(generatedEvent?.payload.filename).toContain(
      'rent-collection-',
    );
    expect(generatedEvent?.payload.contentType).toContain(
      'text/csv',
    );
    expect(
      Number(generatedEvent?.payload.sizeBytes),
    ).toBeGreaterThan(0);
    expect(generatedEvent?.payload.recipients).toEqual([
      'owner@propertyos.test',
    ]);
  });

  it('atomically claims and automatically executes a due one-time job', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/scheduler/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Automatically executed scheduler job',
        jobType: successJobType,
        payload: {
          executionMode: 'worker',
        },
        scheduleType: 'ONE_TIME',
        runAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      })
      .expect(201);

    const job = createResponse.body.data.job;

    expect(job.status).toBe('PENDING');
    expect(job.scheduleType).toBe('ONE_TIME');
    expect(job.runAt).toBeDefined();
    expect(job.nextRunAt).toBeDefined();

    const storedBeforeTick = await pool.query(
      `SELECT
         status,
         schedule_type,
         run_at,
         next_run_at,
         attempts,
         max_attempts,
         run_at,
         next_run_at,
         COALESCE(next_run_at, run_at) <= NOW() AS is_due
       FROM scheduler_jobs
       WHERE id = $1`,
      [job.id],
    );

    expect(storedBeforeTick.rows[0]).toMatchObject({
      status: 'PENDING',
      schedule_type: 'ONE_TIME',
      attempts: 0,
      max_attempts: 3,
      is_due: true,
    });

    const [firstTick, secondTick] = await Promise.all([
      schedulerWorker.tick(),
      schedulerWorker.tick(),
    ]);

    expect(
      firstTick.claimed + secondTick.claimed,
    ).toBe(1);

    const completed = await request(app.getHttpServer())
      .get(`/api/v1/scheduler/jobs/${job.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(completed.body.data.job.status).toBe(
      'COMPLETED',
    );
    expect(completed.body.data.job.attempts).toBe(1);

    expect(
      handledJobs.filter((id) => id === job.id),
    ).toHaveLength(1);
  });

  it('fails an invalid REPORT_EXPORT payload and publishes failure metadata', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/scheduler/jobs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Invalid report export',
        jobType: REPORT_EXPORT_JOB_TYPE,
        payload: {
          reportType: 'UNKNOWN_REPORT',
          format: 'CSV',
          recipients: [],
          channel: 'EMAIL',
        },
      })
      .expect(201);

    const job = createResponse.body.data.job;

    await request(app.getHttpServer())
      .post(`/api/v1/scheduler/jobs/${job.id}/run`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201)
      .expect((response) => {
        expect(response.body.data.job.status).toBe('FAILED');
        expect(response.body.data.job.errorMessage).toContain(
          'requires reportType',
        );
      });
  });
});
