import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Storage API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;
  let storageRoot: string;

  const timestamp = Date.now();
  const email = `storage-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const personId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();
  const entityId = randomUUID();

  const requiredPermissions = [
    Permissions.STORAGE_READ,
    Permissions.STORAGE_CREATE,
  ];

  beforeAll(async () => {
    storageRoot = await mkdtemp(join(tmpdir(), 'propertyos-storage-e2e-'));
    process.env.STORAGE_LOCAL_ROOT = storageRoot;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS storage_objects (
        id UUID PRIMARY KEY,
        provider VARCHAR(50) NOT NULL,
        bucket VARCHAR(255),
        object_key TEXT NOT NULL,
        original_name VARCHAR(255),
        mime_type VARCHAR(255),
        size_bytes BIGINT NOT NULL DEFAULT 0,
        checksum VARCHAR(255),
        entity_type VARCHAR(100),
        entity_id UUID,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `INSERT INTO persons (id, display_name, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [personId, 'Storage E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `INSERT INTO credentials (id, person_id, credential_type, credential_value)
       VALUES ($1, $2, $3, $4)`,
      [credentialId, personId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `INSERT INTO roles (id, name, description)
       VALUES ($1, $2, $3)`,
      [roleId, `Storage E2E Role ${timestamp}`, 'Storage integration test role'],
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
    await rm(storageRoot, { recursive: true, force: true });
    delete process.env.STORAGE_LOCAL_ROOT;
  });

  it('stores, lists, retrieves and deletes local storage objects securely', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/storage/objects')
      .expect(401);

    const content = 'Storage integration hello';
    const encodedContent = Buffer.from(content).toString('base64');
    const checksum = createHash('sha256').update(Buffer.from(content)).digest('hex');

    const storeResponse = await request(app.getHttpServer())
      .post('/api/v1/storage/objects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        objectKey: `e2e/${timestamp}/hello.txt`,
        content: encodedContent,
        originalName: 'hello.txt',
        mimeType: 'text/plain',
        entityType: 'storage.e2e',
        entityId,
        metadata: {
          source: 'integration',
        },
      })
      .expect(201);

    const object = storeResponse.body.data.object;

    expect(object.id).toBeDefined();
    expect(object.provider).toBe('local');
    expect(object.objectKey).toBe(`e2e/${timestamp}/hello.txt`);
    expect(object.sizeBytes).toBe(Buffer.byteLength(content));
    expect(object.checksum).toBe(checksum);
    expect(object.entityId).toBe(entityId);
    expect(object.metadata.source).toBe('integration');

    await request(app.getHttpServer())
      .get('/api/v1/storage/objects')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.objects.some((item: any) => item.id === object.id)).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/api/v1/storage/objects/${object.id}/content`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        const returnedContent = response.text ?? Buffer.from(response.body).toString();
        expect(returnedContent).toBe(content);
      });

    await request(app.getHttpServer())
      .post('/api/v1/storage/objects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        objectKey: '../escape.txt',
        content: encodedContent,
      })
      .expect(500);

    await request(app.getHttpServer())
      .delete(`/api/v1/storage/objects/${object.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body.data.deleted).toBe(true);
      });

    await request(app.getHttpServer())
      .get(`/api/v1/storage/objects/${object.id}/content`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(404);
  });
});
