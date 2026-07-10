import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Forms API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `forms-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const personId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const permissions = [
    Permissions.FORM_READ,
    Permissions.FORM_CREATE,
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
      CREATE TABLE IF NOT EXISTS form_definitions (
        id UUID PRIMARY KEY,
        code VARCHAR(120) UNIQUE,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        fields JSONB NOT NULL DEFAULT '[]'::jsonb,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS form_submissions (
        id UUID PRIMARY KEY,
        form_id UUID NOT NULL REFERENCES form_definitions(id) ON DELETE CASCADE,
        values JSONB NOT NULL DEFAULT '{}'::jsonb,
        submitted_by_person_id UUID,
        subject_type VARCHAR(120),
        subject_id UUID,
        property_id UUID,
        space_id UUID,
        context JSONB NOT NULL DEFAULT '{}'::jsonb,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `
      INSERT INTO persons (id, display_name, email, phone, status)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [personId, 'Forms E2E User', email, null, 'ACTIVE'],
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
      [roleId, `Forms E2E Role ${timestamp}`, 'Forms integration test role'],
    );

    await pool.query(
      `
      INSERT INTO person_roles (id, person_id, role_id)
      VALUES ($1, $2, $3)
      `,
      [personRoleId, personId, roleId],
    );

    for (const permission of permissions) {
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

  it('persists form definitions and submissions with validation', async () => {
    const formId = randomUUID();
    const propertyId = randomUUID();

    const createResponse = await request(app.getHttpServer())
      .post('/api/v1/forms')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        form: {
          id: formId,
          code: `visitor.feedback.${timestamp}`,
          name: 'Visitor Feedback',
          description: 'Collect visitor feedback at checkout',
          fields: [
            {
              id: 'visitor-name',
              name: 'visitorName',
              label: 'Visitor Name',
              type: 'TEXT',
              required: true,
            },
            {
              id: 'rating',
              name: 'rating',
              label: 'Rating',
              type: 'NUMBER',
              required: true,
            },
            {
              id: 'purpose',
              name: 'purpose',
              label: 'Purpose',
              type: 'SELECT',
              required: true,
              options: ['TENANT_VISIT', 'VENDOR', 'DELIVERY'],
            },
          ],
          metadata: {
            plugin: 'visitor',
          },
        },
      })
      .expect(201);

    expect(createResponse.body.id).toBe(formId);
    expect(createResponse.body.status).toBe('ACTIVE');

    await request(app.getHttpServer())
      .get(`/api/v1/forms/${formId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.id).toBe(formId);
        expect(response.body.fields).toHaveLength(3);
      });

    await request(app.getHttpServer())
      .post(`/api/v1/forms/${formId}/submit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        values: {
          visitorName: 'Ravi',
          rating: 5,
          purpose: 'TENANT_VISIT',
        },
        subjectType: 'visitor',
        subjectId: randomUUID(),
        propertyId,
        context: {
          channel: 'security-desk',
        },
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.id).toBeDefined();
        expect(response.body.formId).toBe(formId);
        expect(response.body.values.visitorName).toBe('Ravi');
      });

    await request(app.getHttpServer())
      .post(`/api/v1/forms/${formId}/submit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        values: {
          rating: 'bad',
          purpose: 'UNKNOWN',
        },
      })
      .expect(400);

    await request(app.getHttpServer())
      .get(`/api/v1/forms/${formId}/submissions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].propertyId).toBe(propertyId);
      });

    await request(app.getHttpServer())
      .patch(`/api/v1/forms/${formId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'ARCHIVED' })
      .expect(200)
      .expect((response) => {
        expect(response.body.status).toBe('ARCHIVED');
      });

    await request(app.getHttpServer())
      .post(`/api/v1/forms/${formId}/submit`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        values: {
          visitorName: 'Ravi',
          rating: 5,
          purpose: 'TENANT_VISIT',
        },
      })
      .expect(400);
  });
});
