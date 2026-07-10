import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Property API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `property-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const personId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const propertyReadPermissionId = randomUUID();
  const propertyCreatePermissionId = randomUUID();
  const personRoleId = randomUUID();
  const readRolePermissionId = randomUUID();
  const createRolePermissionId = randomUUID();

  let propertyId: string;

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
      [personId, 'Property E2E User', email, null, 'ACTIVE'],
    );

    await pool.query(
      `
      INSERT INTO credentials (id, person_id, credential_type, credential_value)
      VALUES ($1, $2, $3, $4)
      `,
      [credentialId, personId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `
      INSERT INTO roles (id, name, description)
      VALUES ($1, $2, $3)
      `,
      [roleId, `Property E2E Role ${timestamp}`, 'Property integration test role'],
    );

    await pool.query(
      `
      INSERT INTO permissions (id, permission_key, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (permission_key) DO NOTHING
      `,
      [propertyReadPermissionId, Permissions.PROPERTY_READ, 'Read properties'],
    );

    await pool.query(
      `
      INSERT INTO permissions (id, permission_key, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (permission_key) DO NOTHING
      `,
      [propertyCreatePermissionId, Permissions.PROPERTY_CREATE, 'Create properties'],
    );

    const readPermission = await pool.query(
      'SELECT id FROM permissions WHERE permission_key = $1',
      [Permissions.PROPERTY_READ],
    );

    const createPermission = await pool.query(
      'SELECT id FROM permissions WHERE permission_key = $1',
      [Permissions.PROPERTY_CREATE],
    );

    await pool.query(
      `
      INSERT INTO person_roles (id, person_id, role_id)
      VALUES ($1, $2, $3)
      `,
      [personRoleId, personId, roleId],
    );

    await pool.query(
      `
      INSERT INTO role_permissions (id, role_id, permission_id)
      VALUES ($1, $2, $3)
      `,
      [readRolePermissionId, roleId, readPermission.rows[0].id],
    );

    await pool.query(
      `
      INSERT INTO role_permissions (id, role_id, permission_id)
      VALUES ($1, $2, $3)
      `,
      [createRolePermissionId, roleId, createPermission.rows[0].id],
    );

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    accessToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    if (pool) {
      if (propertyId) {
        await pool.query('DELETE FROM spaces WHERE property_id = $1', [propertyId]);
        await pool.query('DELETE FROM zones WHERE property_id = $1', [propertyId]);
        await pool.query('DELETE FROM properties WHERE id = $1', [propertyId]);
      }

      await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
      await pool.query('DELETE FROM person_roles WHERE person_id = $1', [personId]);
      await pool.query('DELETE FROM roles WHERE id = $1', [roleId]);
      await pool.query('DELETE FROM credentials WHERE person_id = $1', [personId]);
      await pool.query('DELETE FROM persons WHERE id = $1', [personId]);

      await pool.end();
    }

    await app.close();
  });

  it('POST /api/v1/properties creates a property', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Advaith Nest E2E',
        code: `AN-E2E-${timestamp}`,
        propertyType: 'BOUTIQUE_ROOMS',
        description: 'Property integration test',
        addressLine1: 'GST Road',
        city: 'Chengalpattu',
        state: 'Tamil Nadu',
        country: 'India',
        postalCode: '603204',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.name).toBe('Advaith Nest E2E');
    expect(response.body.data.code).toBe(`AN-E2E-${timestamp}`);
    expect(response.body.data.isActive).toBe(true);

    propertyId = response.body.data.id;
  });

  it('GET /api/v1/properties lists created property', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.items)).toBe(true);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.limit).toBe(25);
    expect(response.body.data.total).toBeGreaterThanOrEqual(1);
    expect(response.body.data.totalPages).toBeGreaterThanOrEqual(1);
    expect(
      response.body.data.items.some(
        (property: any) => property.id === propertyId,
      ),
    ).toBe(true);
  });

  it('GET /api/v1/properties/:id returns created property', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/properties/${propertyId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(propertyId);
    expect(response.body.data.name).toBe('Advaith Nest E2E');
  });

  it('GET /api/v1/properties rejects missing bearer token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/properties')
      .expect(401)
      .expect((response) => {
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED');
        expect(response.body.error.message).toBe('Missing bearer token');
        expect(response.body.requestId).toBeDefined();
      });
  });
});
