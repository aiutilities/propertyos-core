import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Audit API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `audit-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const adminPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const auditEventIdOne = randomUUID();
  const auditEventIdTwo = randomUUID();
  const entityId = randomUUID();

  const permissionKeys = [
    Permissions.AUDIT_READ,
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `
      INSERT INTO persons (id, display_name, email, phone, status)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [adminPersonId, 'Audit E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `
      INSERT INTO credentials
      (id, person_id, credential_type, credential_value)
      VALUES ($1,$2,$3,$4)
      `,
      [credentialId, adminPersonId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `
      INSERT INTO roles (id,name,description)
      VALUES ($1,$2,$3)
      `,
      [roleId, `Audit Role ${timestamp}`, 'Audit integration'],
    );

    await pool.query(
      `
      INSERT INTO person_roles
      (id,person_id,role_id)
      VALUES ($1,$2,$3)
      `,
      [personRoleId, adminPersonId, roleId],
    );

    for (const permissionKey of permissionKeys) {
      await pool.query(
        `
        INSERT INTO permissions(id,permission_key,description)
        VALUES($1,$2,$3)
        ON CONFLICT(permission_key) DO NOTHING
        `,
        [randomUUID(), permissionKey, permissionKey],
      );

      const permission = await pool.query(
        'SELECT id FROM permissions WHERE permission_key=$1',
        [permissionKey],
      );

      await pool.query(
        `
        INSERT INTO role_permissions(id,role_id,permission_id)
        VALUES($1,$2,$3)
        `,
        [randomUUID(), roleId, permission.rows[0].id],
      );
    }

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    accessToken = login.body.accessToken;

    await pool.query(
      `
      INSERT INTO audit_logs (
        id,
        event_type,
        source,
        payload,
        created_at
      )
      VALUES ($1,$2,$3,$4,NOW() - INTERVAL '1 second')
      `,
      [
        auditEventIdOne,
        `audit.e2e.created.${timestamp}`,
        'audit.integration.test',
        JSON.stringify({
          entityType: 'audit.entity',
          entityId,
          action: 'created',
        }),
      ],
    );

    await pool.query(
      `
      INSERT INTO audit_logs (
        id,
        event_type,
        source,
        payload,
        created_at
      )
      VALUES ($1,$2,$3,$4,NOW())
      `,
      [
        auditEventIdTwo,
        `audit.e2e.updated.${timestamp}`,
        'audit.integration.test',
        JSON.stringify({
          entityType: 'audit.entity',
          entityId,
          action: 'updated',
        }),
      ],
    );
  });

  afterAll(async () => {
    if (pool) {
      await pool.query(
        'DELETE FROM audit_logs WHERE id = ANY($1)',
        [[auditEventIdOne, auditEventIdTwo]],
      );

      await pool.query(
        'DELETE FROM role_permissions WHERE role_id=$1',
        [roleId],
      );

      await pool.query(
        'DELETE FROM person_roles WHERE person_id=$1',
        [adminPersonId],
      );

      await pool.query(
        'DELETE FROM roles WHERE id=$1',
        [roleId],
      );

      await pool.query(
        'DELETE FROM credentials WHERE person_id=$1',
        [adminPersonId],
      );

      await pool.query(
        'DELETE FROM persons WHERE id=$1',
        [adminPersonId],
      );

      await pool.end();
    }

    await app.close();
  });

  it('GET /api/v1/audit rejects missing bearer token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/audit')
      .expect(401)
      .expect((response) => {
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
        expect(response.body.error.message).toBe('Missing bearer token');
        expect(response.body.requestId).toBeDefined();
      });
  });

  it('GET /api/v1/audit lists audit logs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({
        source: 'audit.integration.test',
        limit: 10,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.logs)).toBe(true);
    expect(
      response.body.data.logs.some(
        (log: any) => log.id === auditEventIdOne,
      ),
    ).toBe(true);
    expect(
      response.body.data.logs.some(
        (log: any) => log.id === auditEventIdTwo,
      ),
    ).toBe(true);
  });

  it('GET /api/v1/audit filters by event type', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({
        eventType: `audit.e2e.created.${timestamp}`,
        limit: 10,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.logs).toHaveLength(1);
    expect(response.body.data.logs[0].id).toBe(auditEventIdOne);
  });

  it('GET /api/v1/audit filters by source', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({
        source: 'audit.integration.test',
        limit: 10,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(
      response.body.data.logs.some(
        (log: any) => log.id === auditEventIdOne,
      ),
    ).toBe(true);
    expect(
      response.body.data.logs.some(
        (log: any) => log.id === auditEventIdTwo,
      ),
    ).toBe(true);
  });

  it('GET /api/v1/audit/entity filters by entity', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/audit/entity')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({
        entityType: 'audit.entity',
        entityId,
        limit: 10,
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(
      response.body.data.logs.every(
        (log: any) =>
          JSON.stringify(log.payload).includes('audit.entity') &&
          JSON.stringify(log.payload).includes(entityId),
      ),
    ).toBe(true);
  });

  it('GET /api/v1/audit supports pagination', async () => {
    const firstPage = await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({
        source: 'audit.integration.test',
        limit: 1,
        offset: 0,
      })
      .expect(200);

    const secondPage = await request(app.getHttpServer())
      .get('/api/v1/audit')
      .set('Authorization', `Bearer ${accessToken}`)
      .query({
        source: 'audit.integration.test',
        limit: 1,
        offset: 1,
      })
      .expect(200);

    expect(firstPage.body.data.logs).toHaveLength(1);
    expect(secondPage.body.data.logs).toHaveLength(1);
    expect(firstPage.body.data.logs[0].id).not.toBe(
      secondPage.body.data.logs[0].id,
    );
  });
});
