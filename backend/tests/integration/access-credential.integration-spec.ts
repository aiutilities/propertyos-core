import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Access Credential API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `access-credential-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';
  const accessTokenValue = `qr-token-${timestamp}`;

  const personId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const subjectId = randomUUID();
  const propertyId = randomUUID();
  const spaceId = randomUUID();

  const requiredPermissions = [
    Permissions.ACCESS_CREDENTIAL_READ,
    Permissions.ACCESS_CREDENTIAL_MANAGE,
    Permissions.PERSON_READ,
    Permissions.PERSON_CREATE,
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS access_credentials (
        id UUID PRIMARY KEY,
        credential_type VARCHAR(50) NOT NULL,
        subject_type VARCHAR(100) NOT NULL,
        subject_id UUID NOT NULL,
        issued_to_person_id UUID NULL,
        issued_by_person_id UUID NULL,
        property_id UUID NULL,
        space_id UUID NULL,
        token_hash VARCHAR(128) NOT NULL UNIQUE,
        display_value TEXT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        valid_from TIMESTAMP NULL,
        valid_until TIMESTAMP NULL,
        max_uses INTEGER NULL,
        use_count INTEGER NOT NULL DEFAULT 0,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS access_credential_usage (
        id UUID PRIMARY KEY,
        credential_id UUID NOT NULL REFERENCES access_credentials(id) ON DELETE CASCADE,
        used_at TIMESTAMP NOT NULL DEFAULT NOW(),
        used_by_person_id UUID NULL,
        property_id UUID NULL,
        space_id UUID NULL,
        context JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `);

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `INSERT INTO persons (id, display_name, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [personId, 'Access Credential E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `INSERT INTO credentials (id, person_id, credential_type, credential_value)
       VALUES ($1, $2, $3, $4)`,
      [credentialId, personId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `INSERT INTO roles (id, name, description)
       VALUES ($1, $2, $3)`,
      [roleId, `Access Credential E2E Role ${timestamp}`, 'Access credential integration test role'],
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

  it('issues, validates, tracks usage and revokes access credentials without colliding with identity credentials', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/access-credentials')
      .expect(401);

    const issueResponse = await request(app.getHttpServer())
      .post('/api/v1/access-credentials')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        credentialType: 'QR_CODE',
        subjectType: 'visitor',
        subjectId,
        propertyId,
        spaceId,
        token: accessTokenValue,
        maxUses: 2,
        metadata: {
          visitPurpose: 'tenant visit',
        },
      })
      .expect(201);

    expect(issueResponse.body.id).toBeDefined();
    expect(issueResponse.body.credentialType).toBe('QR_CODE');
    expect(issueResponse.body.subjectId).toBe(subjectId);
    expect(issueResponse.body.tokenHash).not.toBe(accessTokenValue);
    expect(issueResponse.body.status).toBe('ACTIVE');
    expect(issueResponse.body.useCount).toBe(0);

    const accessCredentialId = issueResponse.body.id;

    await request(app.getHttpServer())
      .get(`/api/v1/access-credentials/${accessCredentialId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.id).toBe(accessCredentialId);
        expect(response.body.metadata.visitPurpose).toBe('tenant visit');
      });

    await request(app.getHttpServer())
      .post('/api/v1/access-credentials/validate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        token: accessTokenValue,
        credentialType: 'QR_CODE',
        subjectType: 'visitor',
        propertyId,
        spaceId,
        context: {
          gate: 'main',
        },
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.valid).toBe(true);
        expect(response.body.credential.id).toBe(accessCredentialId);
        expect(response.body.credential.useCount).toBe(1);
      });

    await request(app.getHttpServer())
      .get(`/api/v1/access-credentials/${accessCredentialId}/usage`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].credentialId).toBe(accessCredentialId);
        expect(response.body[0].context.gate).toBe('main');
      });

    await request(app.getHttpServer())
      .post('/api/v1/access-credentials/validate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        token: accessTokenValue,
        credentialType: 'RFID',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.valid).toBe(false);
        expect(response.body.reason).toBe('CREDENTIAL_TYPE_MISMATCH');
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/access-credentials/${accessCredentialId}/revoke`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        reason: 'Visitor checked out',
        revokedByPersonId: personId,
      })
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('REVOKED');
      });

    await request(app.getHttpServer())
      .post('/api/v1/access-credentials/validate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        token: accessTokenValue,
        credentialType: 'QR_CODE',
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.valid).toBe(false);
        expect(response.body.reason).toBe('CREDENTIAL_NOT_ACTIVE');
      });

    await request(app.getHttpServer())
      .get('/api/v1/credentials')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.every((credential: any) => credential.personId)).toBe(true);
      });
  });
});
