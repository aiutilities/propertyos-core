import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Tenant API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `tenant-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const adminPersonId = randomUUID();
  const tenantPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const tenantReadPermissionId = randomUUID();
  const tenantCreatePermissionId = randomUUID();
  const propertyReadPermissionId = randomUUID();
  const propertyCreatePermissionId = randomUUID();

  const tenantReadRolePermissionId = randomUUID();
  const tenantCreateRolePermissionId = randomUUID();
  const propertyReadRolePermissionId = randomUUID();
  const propertyCreateRolePermissionId = randomUUID();

  let propertyId: string;
  let zoneId: string;
  let spaceId: string;
  let tenantId: string;

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
      [adminPersonId, 'Tenant E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `
      INSERT INTO persons (id, display_name, email, phone, status)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        tenantPersonId,
        'Tenant E2E Occupant',
        `occupant-${timestamp}@propertyos.test`,
        '9999999999',
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
      [roleId, `Tenant E2E Role ${timestamp}`, 'Tenant integration test role'],
    );

    const permissionsToEnsure = [
      [tenantReadPermissionId, Permissions.TENANT_READ, 'Read tenants'],
      [tenantCreatePermissionId, Permissions.TENANT_CREATE, 'Create tenants'],
      [propertyReadPermissionId, Permissions.PROPERTY_READ, 'Read properties'],
      [propertyCreatePermissionId, Permissions.PROPERTY_CREATE, 'Create properties'],
    ];

    for (const [id, key, description] of permissionsToEnsure) {
      await pool.query(
        `
        INSERT INTO permissions (id, permission_key, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (permission_key) DO NOTHING
        `,
        [id, key, description],
      );
    }

    await pool.query(
      `
      INSERT INTO person_roles (id, person_id, role_id)
      VALUES ($1, $2, $3)
      `,
      [personRoleId, adminPersonId, roleId],
    );

    const permissionKeys = [
      [tenantReadRolePermissionId, Permissions.TENANT_READ],
      [tenantCreateRolePermissionId, Permissions.TENANT_CREATE],
      [propertyReadRolePermissionId, Permissions.PROPERTY_READ],
      [propertyCreateRolePermissionId, Permissions.PROPERTY_CREATE],
    ];

    for (const [rolePermissionId, permissionKey] of permissionKeys) {
      const permission = await pool.query(
        'SELECT id FROM permissions WHERE permission_key = $1',
        [permissionKey],
      );

      await pool.query(
        `
        INSERT INTO role_permissions (id, role_id, permission_id)
        VALUES ($1, $2, $3)
        `,
        [rolePermissionId, roleId, permission.rows[0].id],
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
        name: 'Tenant E2E Property',
        code: `TENANT-E2E-${timestamp}`,
        propertyType: 'BOUTIQUE_ROOMS',
        city: 'Chengalpattu',
        state: 'Tamil Nadu',
        country: 'India',
      })
      .expect(201);

    propertyId = propertyResponse.body.data.id;

    const zoneResponse = await request(app.getHttpServer())
      .post(`/api/v1/properties/${propertyId}/zones`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Tenant E2E Zone',
        code: `TZ-${timestamp}`,
        zoneType: 'FLOOR',
      })
      .expect(201);

    zoneId = zoneResponse.body.data.id;

    const spaceResponse = await request(app.getHttpServer())
      .post(`/api/v1/properties/${propertyId}/spaces`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        zoneId,
        name: 'Tenant E2E Room',
        code: `TS-${timestamp}`,
        spaceType: 'ROOM',
        floor: '1',
      })
      .expect(201);

    spaceId = spaceResponse.body.data.id;
  });

  afterAll(async () => {
    if (pool) {
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

  it('POST /api/v1/tenants creates a tenant', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        personId: tenantPersonId,
        propertyId,
        tenantNumber: `TEN-${timestamp}`,
        status: 'ACTIVE',
        moveInDate: '2026-07-07T00:00:00.000Z',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.personId).toBe(tenantPersonId);
    expect(response.body.data.propertyId).toBe(propertyId);
    expect(response.body.data.tenantNumber).toBe(`TEN-${timestamp}`);
    expect(response.body.data.status).toBe('ACTIVE');

    tenantId = response.body.data.id;
  });

  it('GET /api/v1/tenants lists created tenant', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/tenants')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.some((tenant: any) => tenant.id === tenantId)).toBe(
      true,
    );
  });

  it('GET /api/v1/tenants/:id returns created tenant', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/tenants/${tenantId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(tenantId);
    expect(response.body.data.personId).toBe(tenantPersonId);
  });

  it('POST /api/v1/tenants/:tenantId/assign-space assigns space', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/tenants/${tenantId}/assign-space`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        spaceId,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.tenantId).toBe(tenantId);
    expect(response.body.data.spaceId).toBe(spaceId);
  });

  it('GET /api/v1/tenants/:tenantId/spaces lists assigned space', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/tenants/${tenantId}/spaces`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(
      response.body.data.some(
        (tenantSpace: any) => tenantSpace.spaceId === spaceId,
      ),
    ).toBe(true);
  });

  it('GET /api/v1/tenants rejects missing bearer token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/tenants')
      .expect(401)
      .expect((response) => {
        expect(response.body.message).toBe('Missing bearer token');
      });
  });
});
