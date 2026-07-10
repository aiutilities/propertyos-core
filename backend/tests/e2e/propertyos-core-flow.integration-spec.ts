import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('PropertyOS Core Flow E2E', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `core-flow-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const personId = randomUUID();
  const tenantPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const permissions = Object.values(Permissions);

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
      `INSERT INTO persons (id, display_name, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [personId, 'Core Flow E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `INSERT INTO persons (id, display_name, email, phone, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        tenantPersonId,
        `Core Flow Tenant ${timestamp}`,
        `tenant-${timestamp}@propertyos.test`,
        `90000${String(timestamp).slice(-5)}`,
        'ACTIVE',
      ],
    );

    await pool.query(
      `INSERT INTO credentials (id, person_id, credential_type, credential_value)
       VALUES ($1, $2, $3, $4)`,
      [credentialId, personId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `INSERT INTO roles (id, name, description)
       VALUES ($1, $2, $3)`,
      [roleId, `Core Flow E2E Role ${timestamp}`, 'Full core flow role'],
    );

    await pool.query(
      `INSERT INTO person_roles (id, person_id, role_id)
       VALUES ($1, $2, $3)`,
      [personRoleId, personId, roleId],
    );

    for (const permission of permissions) {
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

  it('runs the core property-to-payment-to-document operational flow', async () => {
    const propertyResponse = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Core Flow Property ${timestamp}`,
        code: `CF-${timestamp}`,
        propertyType: 'PG',
        city: 'Chennai',
        state: 'Tamil Nadu',
        country: 'India',
        isActive: true,
      })
      .expect(201);

    const propertyId = propertyResponse.body.data.id;

    const tenantResponse = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        personId: tenantPersonId,
        propertyId,
        tenantNumber: `TEN-CF-${timestamp}`,
        status: 'ACTIVE',
        moveInDate: '2026-07-01T00:00:00.000Z',
      })
      .expect(201);

    const tenantId = tenantResponse.body.data.id;

    const agreementResponse = await request(app.getHttpServer())
      .post('/api/v1/agreements')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenantId,
        agreementNumber: `AGR-CF-${timestamp}`,
        startDate: '2026-07-01',
        endDate: '2027-06-30',
        rentAmount: 10000,
        depositAmount: 20000,
        noticePeriodDays: 30,
      })
      .expect(201);

    const agreementId = agreementResponse.body.data.id;

    const ledgerResponse = await request(app.getHttpServer())
      .post('/api/v1/rent-ledgers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenantId,
        agreementId,
        periodYear: 2026,
        periodMonth: 7,
        dueDate: '2026-07-10',
        rentAmount: 10000,
      })
      .expect(201);

    const ledgerId = ledgerResponse.body.data.id;

    const paymentResponse = await request(app.getHttpServer())
      .post(`/api/v1/rent-ledgers/${ledgerId}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        paymentDate: '2026-07-05T10:00:00.000Z',
        amount: 10000,
        paymentMode: 'UPI',
        referenceNumber: `UPI-${timestamp}`,
      })
      .expect(201);

    const paymentId = paymentResponse.body.data.payment.id;

    const receiptResponse = await request(app.getHttpServer())
      .post('/api/v1/receipts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        receiptNumber: `RCPT-${timestamp}`,
        rentPaymentId: paymentId,
        rentLedgerId: ledgerId,
        tenantId,
        amount: 10000,
        receiptDate: '2026-07-05T10:05:00.000Z',
        paymentMode: 'UPI',
        referenceNumber: `UPI-${timestamp}`,
      })
      .expect(201);

    const invoiceResponse = await request(app.getHttpServer())
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenantId,
        agreementId,
        rentLedgerId: ledgerId,
        billingPeriodStart: '2026-07-01',
        billingPeriodEnd: '2026-07-31',
        invoiceDate: '2026-07-01',
        dueDate: '2026-07-05',
        amount: 10000,
        status: 'ISSUED',
      })
      .expect(201);

    const invoiceId = invoiceResponse.body.data.invoice.id;

    const templateResponse = await request(app.getHttpServer())
      .post('/api/v1/document-templates')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Core Flow Receipt Template ${timestamp}`,
        code: `core-flow-receipt-${timestamp}`,
        templateType: 'TEXT',
        content: 'Receipt {{receiptNumber}} for tenant {{tenantName}}',
        variables: ['receiptNumber', 'tenantName'],
      })
      .expect(201);

    const documentResponse = await request(app.getHttpServer())
      .post('/api/v1/documents/generate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        templateId: templateResponse.body.id,
        title: `Receipt Document ${timestamp}`,
        entityType: 'receipt',
        entityId: receiptResponse.body.id,
        values: {
          receiptNumber: receiptResponse.body.receiptNumber,
          tenantName: tenantResponse.body.displayName,
        },
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/api/v1/documents/${documentResponse.body.id}/versions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toHaveLength(1);
        expect(response.body[0].content).toContain(receiptResponse.body.receiptNumber);
      });

    expect(invoiceResponse.body.data.invoice.id).toBe(invoiceId);
    expect(receiptResponse.body.id).toBeDefined();
  });
});
