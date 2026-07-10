import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { EventBusService } from '../../src/core/eventbus/services/eventbus.service';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Notification API integration', () => {
  let app: any;
  let pool: Pool;
  let eventBus: EventBusService;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `notification-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';
  const adminPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();
  const recipient = `notification-recipient-${timestamp}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);
    eventBus = app.get(EventBusService);

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex');

    await pool.query(
      `INSERT INTO persons (id, display_name, email, phone, status)
       VALUES ($1,$2,$3,$4,$5)`,
      [adminPersonId, 'Notification E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `INSERT INTO credentials (id, person_id, credential_type, credential_value)
       VALUES ($1,$2,$3,$4)`,
      [credentialId, adminPersonId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `INSERT INTO roles (id,name,description) VALUES ($1,$2,$3)`,
      [roleId, `Notification Role ${timestamp}`, 'Notification integration'],
    );

    await pool.query(
      `INSERT INTO person_roles (id,person_id,role_id) VALUES ($1,$2,$3)`,
      [personRoleId, adminPersonId, roleId],
    );

    await pool.query(
      `INSERT INTO permissions(id,permission_key,description)
       VALUES($1,$2,$3)
       ON CONFLICT(permission_key) DO NOTHING`,
      [randomUUID(), Permissions.NOTIFICATION_READ, Permissions.NOTIFICATION_READ],
    );

    await pool.query(
      `INSERT INTO role_permissions(id,role_id,permission_id)
       SELECT $1,$2,id FROM permissions WHERE permission_key=$3
       ON CONFLICT DO NOTHING`,
      [randomUUID(), roleId, Permissions.NOTIFICATION_READ],
    );

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    accessToken = login.body.accessToken;
  });

  afterAll(async () => {
    if (pool) {
      await pool.query(
        `DELETE FROM notifications WHERE recipient=$1 OR metadata::text ILIKE $2`,
        [recipient, `%notification-e2e-${timestamp}%`],
      );
      await pool.query('DELETE FROM role_permissions WHERE role_id=$1', [roleId]);
      await pool.query('DELETE FROM person_roles WHERE id=$1', [personRoleId]);
      await pool.query('DELETE FROM roles WHERE id=$1', [roleId]);
      await pool.query('DELETE FROM credentials WHERE person_id=$1', [adminPersonId]);
      await pool.query('DELETE FROM persons WHERE id=$1', [adminPersonId]);
      await pool.end();
    }

    await app.close();
  });

  it('GET /api/v1/notifications rejects missing bearer token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .expect(401);
  });

  it('persists direct notification requests from the event bus', async () => {
    await eventBus.publish('NOTIFICATION_REQUESTED', 'notification.integration.test', {
      channel: 'IN_APP',
      recipient,
      subject: `Notification E2E ${timestamp}`,
      message: `Notification persisted ${timestamp}`,
      metadata: {
        testRun: `notification-e2e-${timestamp}`,
      },
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(
      response.body.data.notifications.some(
        (notification: any) =>
          notification.recipient === recipient &&
          notification.message === `Notification persisted ${timestamp}` &&
          notification.status === 'PENDING',
      ),
    ).toBe(true);
  });

  it('GET /api/v1/notifications/templates lists templates', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/notifications/templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data.templates)).toBe(true);
      });
  });
});
