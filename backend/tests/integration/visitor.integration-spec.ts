import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Visitor Plugin API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `visitor-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const adminPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();
  const visitorReadPermissionId = randomUUID();
  const visitorCreatePermissionId = randomUUID();
  const visitorReadRolePermissionId = randomUUID();
  const visitorCreateRolePermissionId = randomUUID();

  const propertyId = randomUUID();
  const hostPersonId = randomUUID();
  const securityPersonId = randomUUID();

  let visitId: string;
  let visitorId: string;
  let qrToken: string;

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
      [adminPersonId, 'Visitor E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `
      INSERT INTO persons (id, display_name, email, phone, status)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        hostPersonId,
        'Visitor E2E Host',
        `visitor-host-${timestamp}@propertyos.test`,
        null,
        'ACTIVE',
      ],
    );

    await pool.query(
      `
      INSERT INTO persons (id, display_name, email, phone, status)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        securityPersonId,
        'Visitor E2E Security',
        `visitor-security-${timestamp}@propertyos.test`,
        null,
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
      [roleId, `Visitor E2E Role ${timestamp}`, 'Visitor integration test role'],
    );

    await pool.query(
      `
      INSERT INTO permissions (id, permission_key, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (permission_key) DO NOTHING
      `,
      [visitorReadPermissionId, Permissions.VISITOR_READ, 'Read visitors'],
    );

    await pool.query(
      `
      INSERT INTO permissions (id, permission_key, description)
      VALUES ($1, $2, $3)
      ON CONFLICT (permission_key) DO NOTHING
      `,
      [visitorCreatePermissionId, Permissions.VISITOR_CREATE, 'Create visitors'],
    );

    const readPermission = await pool.query(
      'SELECT id FROM permissions WHERE permission_key = $1',
      [Permissions.VISITOR_READ],
    );

    const createPermission = await pool.query(
      'SELECT id FROM permissions WHERE permission_key = $1',
      [Permissions.VISITOR_CREATE],
    );

    await pool.query(
      `
      INSERT INTO person_roles (id, person_id, role_id)
      VALUES ($1, $2, $3)
      `,
      [personRoleId, adminPersonId, roleId],
    );

    await pool.query(
      `
      INSERT INTO role_permissions (id, role_id, permission_id)
      VALUES ($1, $2, $3)
      `,
      [visitorReadRolePermissionId, roleId, readPermission.rows[0].id],
    );

    await pool.query(
      `
      INSERT INTO role_permissions (id, role_id, permission_id)
      VALUES ($1, $2, $3)
      `,
      [visitorCreateRolePermissionId, roleId, createPermission.rows[0].id],
    );

    await pool.query(
      `
      INSERT INTO properties (
        id, name, code, property_type, description, address_line1,
        city, state, country, postal_code, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `,
      [
        propertyId,
        'Advaith Nest Visitor E2E',
        `AN-VIS-${timestamp}`,
        'BOUTIQUE_ROOMS',
        'Visitor integration test property',
        'GST Road',
        'Chengalpattu',
        'Tamil Nadu',
        'India',
        '603204',
        true,
      ],
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
      if (visitId) {
        await pool.query('DELETE FROM visitor_status_history WHERE visit_id = $1', [
          visitId,
        ]);
        await pool.query('DELETE FROM visitor_qr_passes WHERE visit_id = $1', [
          visitId,
        ]);
        await pool.query('DELETE FROM visits WHERE id = $1', [visitId]);
      }

      if (visitorId) {
        await pool.query('DELETE FROM visitors WHERE id = $1', [visitorId]);
      }

      await pool.query("DELETE FROM scheduler_jobs WHERE job_type LIKE 'visitor.%'");

      await pool.query('DELETE FROM properties WHERE id = $1', [propertyId]);
      await pool.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
      await pool.query('DELETE FROM person_roles WHERE person_id = $1', [
        adminPersonId,
      ]);
      await pool.query('DELETE FROM roles WHERE id = $1', [roleId]);
      await pool.query('DELETE FROM credentials WHERE person_id = $1', [
        adminPersonId,
      ]);
      await pool.query('DELETE FROM persons WHERE id = $1', [securityPersonId]);
      await pool.query('DELETE FROM persons WHERE id = $1', [hostPersonId]);
      await pool.query('DELETE FROM persons WHERE id = $1', [adminPersonId]);

      await pool.end();
    }

    await app.close();
  });

  it('POST /api/v1/plugins/visitor/invite creates a visitor invite', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/plugins/visitor/invite')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        visitorName: 'Visitor E2E Guest',
        mobile: `90000${String(timestamp).slice(-5)}`,
        email: `guest-${timestamp}@propertyos.test`,
        visitDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        visitPurpose: 'Prospective tenant visit',
        hostPersonId,
        propertyId,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.propertyId).toBe(propertyId);
    expect(response.body.data.hostPersonId).toBe(hostPersonId);
    expect(response.body.data.status).toBe('invited');

    visitId = response.body.data.id;
    visitorId = response.body.data.visitorId;
  });

  it('POST /api/v1/plugins/visitor/:visitId/approve approves the visit', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugins/visitor/${visitId}/approve`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        remarks: 'Approved by host',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(visitId);
    expect(response.body.data.status).toBe('approved');
    expect(response.body.data.approvedAt).toBeDefined();
  });

  it('POST /api/v1/plugins/visitor/:visitId/generate-qr generates QR pass', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugins/visitor/${visitId}/generate-qr`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.visitId).toBe(visitId);
    expect(response.body.data.qrToken).toBeDefined();
    expect(response.body.data.status).toBe('active');

    qrToken = response.body.data.qrToken;
  });

  it('POST /api/v1/plugins/visitor/validate-qr validates active QR pass', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/plugins/visitor/validate-qr')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        qrToken,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.valid).toBe(true);
    expect(response.body.data.visitId).toBe(visitId);
  });

  it('POST /api/v1/plugins/visitor/:visitId/arrive marks visitor arrived', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugins/visitor/${visitId}/arrive`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(visitId);
    expect(response.body.data.status).toBe('arrived');
    expect(response.body.data.arrivedAt).toBeDefined();
  });

  it('POST /api/v1/plugins/visitor/:visitId/check-in checks visitor in', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugins/visitor/${visitId}/check-in`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        gate: 'Main Gate',
        securityPersonId,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(visitId);
    expect(response.body.data.status).toBe('checked_in');
    expect(response.body.data.checkedInAt).toBeDefined();
  });

  it('POST /api/v1/plugins/visitor/:visitId/check-out checks visitor out', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/plugins/visitor/${visitId}/check-out`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        gate: 'Main Gate',
        securityPersonId,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(visitId);
    expect(response.body.data.status).toBe('checked_out');
    expect(response.body.data.checkedOutAt).toBeDefined();
  });

  it('GET /api/v1/plugins/visitor/:visitId returns visit detail', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/plugins/visitor/${visitId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(visitId);
    expect(response.body.data.status).toBe('checked_out');
  });

  it('GET /api/v1/plugins/visitor/:visitId/history returns full lifecycle history', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/plugins/visitor/${visitId}/history`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.visitId).toBe(visitId);
    expect(Array.isArray(response.body.data.items)).toBe(true);

    const statuses = response.body.data.items.map((entry: any) => entry.newStatus);

    expect(statuses).toEqual([
      'invited',
      'approved',
      'arrived',
      'checked_in',
      'checked_out',
    ]);
  });

});
