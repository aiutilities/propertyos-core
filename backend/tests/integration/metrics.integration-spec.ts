import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { MetricsService } from '../../src/core/metrics';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Metrics API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;
  let metricsService: MetricsService;

  const timestamp = Date.now();
  const email = `metrics-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const personId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);
    metricsService = app.get(MetricsService);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS metric_samples (
        id UUID PRIMARY KEY,
        metric_name VARCHAR(255) NOT NULL,
        metric_type VARCHAR(50) NOT NULL,
        help TEXT NOT NULL,
        labels JSONB NOT NULL DEFAULT '{}'::jsonb,
        value DOUBLE PRECISION NOT NULL,
        sampled_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `INSERT INTO persons (id, display_name, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [personId, 'Metrics E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `INSERT INTO credentials (id, person_id, credential_type, credential_value)
       VALUES ($1, $2, $3, $4)`,
      [credentialId, personId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `INSERT INTO roles (id, name, description)
       VALUES ($1, $2, $3)`,
      [roleId, `Metrics E2E Role ${timestamp}`, 'Metrics integration test role'],
    );

    await pool.query(
      `INSERT INTO person_roles (id, person_id, role_id)
       VALUES ($1, $2, $3)`,
      [personRoleId, personId, roleId],
    );

    const permissionId = randomUUID();
    const rolePermissionId = randomUUID();

    await pool.query(
      `INSERT INTO permissions (id, permission_key, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (permission_key) DO NOTHING`,
      [permissionId, Permissions.METRICS_READ, Permissions.METRICS_READ],
    );

    await pool.query(
      `INSERT INTO role_permissions (id, role_id, permission_id)
       SELECT $1, $2, id
       FROM permissions
       WHERE permission_key = $3
       ON CONFLICT DO NOTHING`,
      [rolePermissionId, roleId, Permissions.METRICS_READ],
    );

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('secures metrics APIs and returns runtime, Prometheus and persistent samples', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/metrics/prometheus')
      .expect(401);

    metricsService.incrementCounter({
      name: `propertyos_metric_e2e_total_${timestamp}`,
      help: 'Metrics E2E counter.',
      labels: {
        module: 'metrics',
      },
      value: 3,
    });

    metricsService.setGauge({
      name: `propertyos_metric_e2e_gauge_${timestamp}`,
      help: 'Metrics E2E gauge.',
      labels: {
        module: 'metrics',
      },
      value: 42,
    });

    await new Promise((resolve) => setTimeout(resolve, 25));

    await request(app.getHttpServer())
      .get('/api/v1/metrics')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('ok');
        expect(response.body.runtime.pid).toBeDefined();
        expect(response.body.samples.length).toBeGreaterThanOrEqual(2);
      });

    await request(app.getHttpServer())
      .get('/api/v1/metrics/runtime')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.runtime.nodeVersion).toBeDefined();
        expect(response.body.runtime.memory.heapUsed).toBeGreaterThan(0);
      });

    await request(app.getHttpServer())
      .get(`/api/v1/metrics/samples?name=propertyos_metric_e2e_total_${timestamp}&limit=5`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.samples).toHaveLength(1);
        expect(response.body.samples[0].name).toBe(`propertyos_metric_e2e_total_${timestamp}`);
        expect(response.body.samples[0].value).toBe(3);
      });

    await request(app.getHttpServer())
      .get('/api/v1/metrics/prometheus')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.headers['content-type']).toContain('text/plain');
        expect(response.text).toContain('# HELP process_uptime_seconds');
        expect(response.text).toContain(`propertyos_metric_e2e_total_${timestamp}{module="metrics"} 3`);
      });
  });
});
