import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Document API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `document-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const personId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const requiredPermissions = [
    Permissions.DOCUMENT_READ,
    Permissions.DOCUMENT_CREATE,
  ];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);

    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS core_document_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(200) NOT NULL,
        code VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        template_type VARCHAR(50) NOT NULL DEFAULT 'HTML',
        content TEXT NOT NULL,
        variables JSONB NOT NULL DEFAULT '[]',
        status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS core_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_id UUID REFERENCES core_document_templates(id),
        entity_type VARCHAR(100),
        entity_id UUID,
        title VARCHAR(250) NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'GENERATED',
        metadata JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS core_document_versions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES core_documents(id) ON DELETE CASCADE,
        version_number INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_by UUID,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(document_id, version_number)
      )
    `);

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `INSERT INTO persons (id, display_name, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [personId, 'Document E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `INSERT INTO credentials (id, person_id, credential_type, credential_value)
       VALUES ($1, $2, $3, $4)`,
      [credentialId, personId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `INSERT INTO roles (id, name, description)
       VALUES ($1, $2, $3)`,
      [roleId, `Document E2E Role ${timestamp}`, 'Document integration test role'],
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

  it('persists templates, generated documents and versions', async () => {
    const templateCode = `visitor.invite.${timestamp}`;
    const entityId = randomUUID();

    const templateResponse = await request(app.getHttpServer())
      .post('/api/v1/document-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Visitor Invite',
        code: templateCode,
        description: 'Visitor invite template',
        templateType: 'TEXT',
        content: 'Hello {{visitorName}}, visit {{propertyName}} for {{purpose}}.',
        variables: ['visitorName', 'propertyName', 'purpose'],
      })
      .expect(201);

    expect(templateResponse.body.id).toBeDefined();
    expect(templateResponse.body.code).toBe(templateCode);

    await request(app.getHttpServer())
      .get('/api/v1/document-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.some((template: any) => template.id === templateResponse.body.id)).toBe(true);
      });

    const documentResponse = await request(app.getHttpServer())
      .post('/api/v1/documents/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        templateId: templateResponse.body.id,
        title: 'Invite for Ravi',
        entityType: 'visitor',
        entityId,
        values: {
          visitorName: 'Ravi',
          propertyName: "Advaith's Nest",
          purpose: 'tenant visit',
        },
        metadata: {
          channel: 'whatsapp',
        },
      })
      .expect(201);

    expect(documentResponse.body.id).toBeDefined();
    expect(documentResponse.body.templateId).toBe(templateResponse.body.id);
    expect(documentResponse.body.entityId).toBe(entityId);

    await request(app.getHttpServer())
      .get(`/api/v1/documents/${documentResponse.body.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.id).toBe(documentResponse.body.id);
        expect(response.body.metadata.channel).toBe('whatsapp');
      });

    await request(app.getHttpServer())
      .get(`/api/v1/documents/${documentResponse.body.id}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].versionNumber).toBe(1);
        expect(response.body[0].content).toContain('Hello Ravi');
      });

    await request(app.getHttpServer())
      .post(`/api/v1/documents/${documentResponse.body.id}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: 'Manual revised invite content',
        createdBy: personId,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body.versionNumber).toBe(2);
      });

    await request(app.getHttpServer())
      .get(`/api/v1/documents/${documentResponse.body.id}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(2);
        expect(response.body[1].content).toBe('Manual revised invite content');
      });
  });
});
