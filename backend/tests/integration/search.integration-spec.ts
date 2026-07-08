import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Search API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;
  let propertyId: string;

  const timestamp = Date.now();
  const email = `search-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const personId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();
  const readRolePermissionId = randomUUID();
  const createRolePermissionId = randomUUID();

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
      [personId, 'Search E2E User', email, null, 'ACTIVE'],
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
      [roleId, `Search E2E Role ${timestamp}`, 'Search integration test role'],
    );

    await pool.query(
      `
      INSERT INTO person_roles (id, person_id, role_id)
      VALUES ($1, $2, $3)
      `,
      [personRoleId, personId, roleId],
    );

    for (const permissionKey of [
      Permissions.PROPERTY_READ,
      Permissions.PROPERTY_CREATE,
    ]) {
      await pool.query(
        `
        INSERT INTO permissions (id, permission_key, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (permission_key) DO NOTHING
        `,
        [randomUUID(), permissionKey, `E2E permission: ${permissionKey}`],
      );
    }

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

    const propertyResponse = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Searchable Property ${timestamp}`,
        code: `SEARCH-E2E-${timestamp}`,
        propertyType: 'BOUTIQUE_ROOMS',
        city: 'Chengalpattu',
        state: 'Tamil Nadu',
        country: 'India',
      })
      .expect(201);

    propertyId = propertyResponse.body.data.id;
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

  it('GET /api/v1/search/providers lists property provider', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/search/providers')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(
      response.body.data.some(
        (provider: any) =>
          provider.name === 'core-property-search' &&
          provider.entityType === 'PROPERTY',
      ),
    ).toBe(true);
  });

  it('POST /api/v1/search returns property search result', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/search')
      .send({
        query: `SEARCH-E2E-${timestamp}`,
        entityTypes: ['PROPERTY'],
        limit: 10,
      })
      .expect(201);

    expect(Array.isArray(response.body)).toBe(true);
    expect(
      response.body.some(
        (result: any) =>
          result.entityType === 'PROPERTY' &&
          result.entityId === propertyId &&
          result.title === `Searchable Property ${timestamp}`,
      ),
    ).toBe(true);
  });
});
