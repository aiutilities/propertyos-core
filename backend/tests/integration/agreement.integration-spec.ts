import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Agreement API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `agreement-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const adminPersonId = randomUUID();
  const tenantPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  let propertyId: string;
  let tenantId: string;
  let agreementId: string;
  let currentVersionId: string;

  const permissionKeys = [
    Permissions.PROPERTY_READ,
    Permissions.PROPERTY_CREATE,
    Permissions.TENANT_READ,
    Permissions.TENANT_CREATE,
    'agreement.read',
    'agreement.create',
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
      VALUES ($1, $2, $3, $4, $5)
      `,
      [adminPersonId, 'Agreement E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `
      INSERT INTO persons (id, display_name, email, phone, status)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        tenantPersonId,
        'Agreement E2E Tenant',
        `agreement-tenant-${timestamp}@propertyos.test`,
        '9999999998',
        'ACTIVE',
      ],
    );

    await pool.query(
      `
      INSERT INTO credentials (id, person_id, credential_type, credential_value)
      VALUES ($1, $2, $3, $4)
      `,
      [credentialId, adminPersonId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `
      INSERT INTO roles (id, name, description)
      VALUES ($1, $2, $3)
      `,
      [roleId, `Agreement E2E Role ${timestamp}`, 'Agreement integration test role'],
    );

    await pool.query(
      `
      INSERT INTO person_roles (id, person_id, role_id)
      VALUES ($1, $2, $3)
      `,
      [personRoleId, adminPersonId, roleId],
    );

    for (const permissionKey of permissionKeys) {
      await pool.query(
        `
        INSERT INTO permissions (id, permission_key, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (permission_key) DO NOTHING
        `,
        [randomUUID(), permissionKey, `E2E permission: ${permissionKey}`],
      );

      const permission = await pool.query(
        'SELECT id FROM permissions WHERE permission_key = $1',
        [permissionKey],
      );

      await pool.query(
        `
        INSERT INTO role_permissions (id, role_id, permission_id)
        VALUES ($1, $2, $3)
        `,
        [randomUUID(), roleId, permission.rows[0].id],
      );
    }

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    accessToken = loginResponse.body.accessToken;

    const propertyResponse = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Agreement E2E Property',
        code: `AGR-E2E-${timestamp}`,
        propertyType: 'BOUTIQUE_ROOMS',
        city: 'Chengalpattu',
        state: 'Tamil Nadu',
        country: 'India',
      })
      .expect(201);

    propertyId = propertyResponse.body.data.id;

    const tenantResponse = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        personId: tenantPersonId,
        propertyId,
        tenantNumber: `AGR-TEN-${timestamp}`,
        status: 'ACTIVE',
        moveInDate: '2026-07-07T00:00:00.000Z',
      })
      .expect(201);

    tenantId = tenantResponse.body.data.id;
  });

  afterAll(async () => {
    if (pool) {
      if (agreementId) {
        await pool.query('DELETE FROM agreement_versions WHERE agreement_id = $1', [
          agreementId,
        ]);
        await pool.query('DELETE FROM agreements WHERE id = $1', [agreementId]);
      }

      if (tenantId) {
        await pool.query('DELETE FROM tenant_spaces WHERE tenant_id = $1', [
          tenantId,
        ]);
        await pool.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
      }

      if (propertyId) {
        await pool.query('DELETE FROM spaces WHERE property_id = $1', [
          propertyId,
        ]);
        await pool.query('DELETE FROM zones WHERE property_id = $1', [
          propertyId,
        ]);
        await pool.query('DELETE FROM properties WHERE id = $1', [propertyId]);
      }

      await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [
        roleId,
      ]);
      await pool.query('DELETE FROM person_roles WHERE person_id = $1', [
        adminPersonId,
      ]);
      await pool.query('DELETE FROM roles WHERE id = $1', [roleId]);
      await pool.query('DELETE FROM credentials WHERE person_id = $1', [
        adminPersonId,
      ]);
      await pool.query('DELETE FROM persons WHERE id = $1', [tenantPersonId]);
      await pool.query('DELETE FROM persons WHERE id = $1', [adminPersonId]);

      await pool.end();
    }

    await app.close();
  });

  it('POST /api/v1/agreements creates an active agreement with first version', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/agreements')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenantId,
        agreementNumber: `AGR-${timestamp}`,
        startDate: '2026-07-07',
        endDate: '2027-07-06',
        rentAmount: 9000,
        depositAmount: 18000,
        noticePeriodDays: 30,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.tenantId).toBe(tenantId);
    expect(response.body.data.agreementNumber).toBe(`AGR-${timestamp}`);
    expect(response.body.data.status).toBe('ACTIVE');
    expect(response.body.data.currentVersionId).toBeDefined();

    agreementId = response.body.data.id;
    currentVersionId = response.body.data.currentVersionId;
  });

  it('GET /api/v1/agreements lists created agreement', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/agreements')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(
      response.body.data.some((agreement: any) => agreement.id === agreementId),
    ).toBe(true);
  });

  it('GET /api/v1/agreements/:id returns created agreement', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/agreements/${agreementId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(agreementId);
    expect(response.body.data.tenantId).toBe(tenantId);
    expect(response.body.data.agreementNumber).toBe(`AGR-${timestamp}`);
  });

  it('GET /api/v1/agreements/:id/versions lists agreement version', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/agreements/${agreementId}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(currentVersionId);
    expect(response.body.data[0].versionNumber).toBe(1);
    expect(response.body.data[0].rentAmount).toBe(9000);
    expect(response.body.data[0].depositAmount).toBe(18000);
    expect(response.body.data[0].noticePeriodDays).toBe(30);
  });

  it('GET /api/v1/agreements rejects missing bearer token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/agreements')
      .expect(401)
      .expect((response) => {
        expect(response.body.message).toBe('Missing bearer token');
      });
  });
});
