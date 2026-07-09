import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Identity API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `identity-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const adminPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const requiredPermissions = [
    Permissions.PERSON_READ,
    Permissions.PERSON_CREATE,
    Permissions.ORGANIZATION_READ,
    Permissions.ORGANIZATION_CREATE,
    Permissions.ROLE_READ,
    Permissions.ROLE_CREATE,
    Permissions.PERMISSION_READ,
    Permissions.PERMISSION_CREATE,
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
      [adminPersonId, 'Identity E2E Admin', email, null, 'ACTIVE'],
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
      [roleId, `Identity E2E Role ${timestamp}`, 'Identity integration test role'],
    );

    await pool.query(
      `
      INSERT INTO person_roles (id, person_id, role_id)
      VALUES ($1, $2, $3)
      `,
      [personRoleId, adminPersonId, roleId],
    );

    for (const permission of requiredPermissions) {
      const permissionId = randomUUID();
      const rolePermissionId = randomUUID();

      await pool.query(
        `
        INSERT INTO permissions (id, permission_key, description)
        VALUES ($1, $2, $3)
        ON CONFLICT (permission_key) DO NOTHING
        `,
        [permissionId, permission, permission],
      );

      await pool.query(
        `
        INSERT INTO role_permissions (id, role_id, permission_id)
        SELECT $1, $2, id
        FROM permissions
        WHERE permission_key = $3
        ON CONFLICT DO NOTHING
        `,
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

  it('manages people, organizations, roles, permissions and identity credentials', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/persons')
      .expect(401);

    const personResponse = await request(app.getHttpServer())
      .post('/api/v1/persons')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        displayName: 'Identity E2E Person',
        email: `identity-person-${timestamp}@propertyos.test`,
        phone: '+919999999999',
      })
      .expect(201);

    expect(personResponse.body.id).toBeDefined();
    expect(personResponse.body.displayName).toBe('Identity E2E Person');

    await request(app.getHttpServer())
      .get('/api/v1/persons')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.some((person: any) => person.id === personResponse.body.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/api/v1/persons/${personResponse.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.id).toBe(personResponse.body.id);
      });

    const organizationResponse = await request(app.getHttpServer())
      .post('/api/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Advaith Nest Vendor Org',
        type: 'VENDOR',
      })
      .expect(201);

    expect(organizationResponse.body.id).toBeDefined();
    expect(organizationResponse.body.type).toBe('VENDOR');

    await request(app.getHttpServer())
      .get('/api/v1/organizations')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.some((organization: any) => organization.id === organizationResponse.body.id)).toBe(true);
      });

    const createdRoleResponse = await request(app.getHttpServer())
      .post('/api/v1/roles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Security Guard ${timestamp}`,
        description: 'Can validate visitors',
      })
      .expect(201);

    expect(createdRoleResponse.body.id).toBeDefined();

    const createdPermissionResponse = await request(app.getHttpServer())
      .post('/api/v1/permissions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        key: `visitor.validate.${timestamp}`,
        description: 'Validate visitor entries',
      })
      .expect(201);

    expect(createdPermissionResponse.body.key).toBe(`visitor.validate.${timestamp}`);

    await request(app.getHttpServer())
      .post(`/api/v1/roles/${createdRoleResponse.body.id}/permissions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        permissionId: createdPermissionResponse.body.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/roles/${createdRoleResponse.body.id}/permissions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.some((permission: any) => permission.id === createdPermissionResponse.body.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/persons/${personResponse.body.id}/roles`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        roleId: createdRoleResponse.body.id,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/persons/${personResponse.body.id}/roles`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.some((role: any) => role.id === createdRoleResponse.body.id)).toBe(true);
      });

    const passwordCredentialResponse = await request(app.getHttpServer())
      .post('/api/v1/credentials')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        personId: personResponse.body.id,
        type: 'PASSWORD',
        value: 'TemporaryPassword123!',
      })
      .expect(201);

    expect(passwordCredentialResponse.body.personId).toBe(personResponse.body.id);
    expect(passwordCredentialResponse.body.value).toContain('sha256:');

    await request(app.getHttpServer())
      .get('/api/v1/credentials')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.some((credential: any) => credential.id === passwordCredentialResponse.body.id)).toBe(true);
      });
  });
});
