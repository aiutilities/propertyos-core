import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Configuration API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `configuration-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const personId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const requiredPermissions = [
    Permissions.CONFIGURATION_READ,
    Permissions.CONFIGURATION_MANAGE,
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
      `INSERT INTO persons (id, display_name, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [personId, 'Configuration E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `INSERT INTO credentials (id, person_id, credential_type, credential_value)
       VALUES ($1, $2, $3, $4)`,
      [credentialId, personId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `INSERT INTO roles (id, name, description)
       VALUES ($1, $2, $3)`,
      [roleId, `Configuration E2E Role ${timestamp}`, 'Configuration integration test role'],
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

  it('upserts, lists, reads, updates and deletes scoped settings', async () => {
    const settingKey = `visitor.whatsapp.enabled.${timestamp}`;

    await request(app.getHttpServer())
      .get('/api/v1/configuration/settings')
      .expect(200);

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/configuration/settings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scopeType: 'PLATFORM',
        key: settingKey,
        value: {
          enabled: true,
          provider: 'mock-whatsapp',
        },
        valueType: 'JSON',
        description: 'Visitor WhatsApp notification toggle',
        isSecret: false,
      })
      .expect(201);

    const setting = createResponse.body.data.setting;
    expect(setting.id).toBeDefined();
    expect(setting.key).toBe(settingKey);
    expect(setting.value.enabled).toBe(true);

    await request(app.getHttpServer())
      .get('/api/v1/configuration/settings?scopeType=PLATFORM')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.settings.some((item: any) => item.key === settingKey)).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/api/v1/configuration/settings/PLATFORM/${settingKey}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.setting.id).toBe(setting.id);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/configuration/settings/${setting.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        value: {
          enabled: false,
          provider: 'mock-whatsapp',
        },
        description: 'Updated toggle',
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.data.setting.value.enabled).toBe(false);
        expect(response.body.data.setting.description).toBe('Updated toggle');
      });

    await request(app.getHttpServer())
      .delete(`/api/v1/configuration/settings/${setting.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.deleted).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/api/v1/configuration/settings/PLATFORM/${settingKey}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
