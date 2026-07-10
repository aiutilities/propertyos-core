import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Report API integration', () => {
  let app: any;
  let pool: Pool;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `report-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const adminPersonId = randomUUID();
  const tenantPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  let propertyId: string;
  let tenantId: string;
  let agreementId: string;
  let rentLedgerId: string;
  let firstPaymentId: string;
  let secondPaymentId: string;
  let receiptId: string;

  const unpaidRentLedgerId = randomUUID();
  const paidRentLedgerId = randomUUID();

  const permissionKeys = [
    Permissions.PROPERTY_READ,
    Permissions.PROPERTY_CREATE,
    Permissions.TENANT_READ,
    Permissions.TENANT_CREATE,
    Permissions.AGREEMENT_READ,
    Permissions.AGREEMENT_CREATE,
    Permissions.RENT_READ,
    Permissions.RENT_CREATE,
    Permissions.RECEIPT_READ,
    Permissions.RECEIPT_CREATE,
    Permissions.REPORT_READ,
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
      [
        adminPersonId,
        'Report E2E Admin',
        email,
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
        tenantPersonId,
        'Report E2E Tenant',
        `report-tenant-${timestamp}@propertyos.test`,
        '9999999988',
        'ACTIVE',
      ],
    );

    await pool.query(
      `
      INSERT INTO credentials (
        id,
        person_id,
        credential_type,
        credential_value
      )
      VALUES ($1, $2, $3, $4)
      `,
      [
        credentialId,
        adminPersonId,
        'PASSWORD',
        `sha256:${salt}:${hash}`,
      ],
    );

    await pool.query(
      `
      INSERT INTO roles (id, name, description)
      VALUES ($1, $2, $3)
      `,
      [
        roleId,
        `Report E2E Role ${timestamp}`,
        'Rent collection report integration role',
      ],
    );

    await pool.query(
      `
      INSERT INTO person_roles (id, person_id, role_id)
      VALUES ($1, $2, $3)
      `,
      [personRoleId, adminPersonId, roleId],
    );

    for (const permissionKey of permissionKeys) {
      await pool.query(
        `
        INSERT INTO permissions (
          id,
          permission_key,
          description
        )
        VALUES ($1, $2, $3)
        ON CONFLICT (permission_key) DO NOTHING
        `,
        [
          randomUUID(),
          permissionKey,
          `Integration permission: ${permissionKey}`,
        ],
      );

      const permission = await pool.query(
        `
        SELECT id
        FROM permissions
        WHERE permission_key = $1
        `,
        [permissionKey],
      );

      await pool.query(
        `
        INSERT INTO role_permissions (
          id,
          role_id,
          permission_id
        )
        VALUES ($1, $2, $3)
        `,
        [randomUUID(), roleId, permission.rows[0].id],
      );
    }

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    accessToken = login.body.accessToken;

    const property = await request(app.getHttpServer())
      .post('/api/v1/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: `Report Property ${timestamp}`,
        code: `REPORT-${timestamp}`,
        propertyType: 'BOUTIQUE_ROOMS',
        city: 'Chengalpattu',
        state: 'Tamil Nadu',
        country: 'India',
      })
      .expect(201);

    propertyId = property.body.data.id;

    const tenant = await request(app.getHttpServer())
      .post('/api/v1/tenants')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        personId: tenantPersonId,
        propertyId,
        tenantNumber: `REPORT-TEN-${timestamp}`,
        status: 'ACTIVE',
        moveInDate: '2026-07-01T00:00:00.000Z',
      })
      .expect(201);

    tenantId = tenant.body.data.id;

    const agreement = await request(app.getHttpServer())
      .post('/api/v1/agreements')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenantId,
        agreementNumber: `REPORT-AGR-${timestamp}`,
        startDate: '2026-07-01',
        endDate: '2027-06-30',
        rentAmount: 9000,
        depositAmount: 18000,
        noticePeriodDays: 30,
      })
      .expect(201);

    agreementId = agreement.body.data.id;

    const ledger = await request(app.getHttpServer())
      .post('/api/v1/rent-ledgers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenantId,
        agreementId,
        periodYear: 2026,
        periodMonth: 7,
        dueDate: '2026-07-05',
        rentAmount: 9000,
      })
      .expect(201);

    rentLedgerId = ledger.body.data.id;

    const firstPayment = await request(app.getHttpServer())
      .post(`/api/v1/rent-ledgers/${rentLedgerId}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        paymentDate: '2026-07-05',
        amount: 5000,
        paymentMode: 'UPI',
        referenceNumber: `UPI-${timestamp}`,
        notes: 'First report payment',
      })
      .expect(201);

    firstPaymentId = firstPayment.body.data.payment.id;

    const secondPayment = await request(app.getHttpServer())
      .post(`/api/v1/rent-ledgers/${rentLedgerId}/payments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        paymentDate: '2026-07-08',
        amount: 2000,
        paymentMode: 'CASH',
        referenceNumber: `CASH-${timestamp}`,
        notes: 'Second report payment',
      })
      .expect(201);

    secondPaymentId = secondPayment.body.data.payment.id;

    const receipt = await request(app.getHttpServer())
      .post('/api/v1/receipts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        receiptNumber: `RCT-${timestamp}`,
                rentPaymentId: firstPaymentId,
        rentLedgerId,
        tenantId,
        amount: 5000,
        receiptDate: '2026-07-05',
        paymentMode: 'UPI',
        referenceNumber: `UPI-${timestamp}`,
      })
      .expect(201);

    receiptId = receipt.body.id;

    await pool.query(
      `
      INSERT INTO rent_ledgers (
        id,
        tenant_id,
        agreement_id,
        period_year,
        period_month,
        due_date,
        rent_amount,
        amount_paid,
        balance_amount,
        status,
        created_at,
        updated_at
      )
      VALUES
        (
          $1, $3, $4, 2026, 6, '2026-06-05',
          9000, 0, 9000, 'UNPAID', now(), now()
        ),
        (
          $2, $3, $4, 2026, 5, '2026-05-05',
          9000, 9000, 0, 'PAID', now(), now()
        )
      `,
      [
        unpaidRentLedgerId,
        paidRentLedgerId,
        tenantId,
        agreementId,
      ],
    );
  });

  afterAll(async () => {
    if (pool) {
      if (receiptId) {
        await pool.query('DELETE FROM receipts WHERE id = $1', [
          receiptId,
        ]);
      }

      if (firstPaymentId || secondPaymentId) {
        await pool.query(
          `
          DELETE FROM rent_payments
          WHERE id = ANY($1::uuid[])
          `,
          [[firstPaymentId, secondPaymentId].filter(Boolean)],
        );
      }

      await pool.query(
        `
        DELETE FROM rent_ledgers
        WHERE id = ANY($1::uuid[])
        `,
        [[
          rentLedgerId,
          unpaidRentLedgerId,
          paidRentLedgerId,
        ].filter(Boolean)],
      );

      if (agreementId) {
        await pool.query(
          'DELETE FROM agreement_versions WHERE agreement_id = $1',
          [agreementId],
        );
        await pool.query('DELETE FROM agreements WHERE id = $1', [
          agreementId,
        ]);
      }

      if (tenantId) {
        await pool.query(
          'DELETE FROM tenant_spaces WHERE tenant_id = $1',
          [tenantId],
        );
        await pool.query('DELETE FROM tenants WHERE id = $1', [
          tenantId,
        ]);
      }

      if (propertyId) {
        await pool.query(
          'DELETE FROM spaces WHERE property_id = $1',
          [propertyId],
        );
        await pool.query(
          'DELETE FROM zones WHERE property_id = $1',
          [propertyId],
        );
        await pool.query('DELETE FROM properties WHERE id = $1', [
          propertyId,
        ]);
      }

      await pool.query(
        'DELETE FROM role_permissions WHERE role_id = $1',
        [roleId],
      );
      await pool.query(
        'DELETE FROM person_roles WHERE person_id = $1',
        [adminPersonId],
      );
      await pool.query('DELETE FROM roles WHERE id = $1', [roleId]);
      await pool.query(
        'DELETE FROM credentials WHERE person_id = $1',
        [adminPersonId],
      );
      await pool.query('DELETE FROM persons WHERE id = $1', [
        tenantPersonId,
      ]);
      await pool.query('DELETE FROM persons WHERE id = $1', [
        adminPersonId,
      ]);

      await pool.end();
    }

    if (app) {
      await app.close();
    }
  });

  it('rejects unauthenticated report access', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/reports/rent-collection')
      .expect(401);
  });

  it('returns paginated rent collections and summary totals', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/rent-collection')
      .query({
        tenantId,
        propertyId,
        page: 1,
        limit: 1,
        sortBy: 'paymentDate',
        sortOrder: 'asc',
      })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.limit).toBe(1);
    expect(response.body.data.total).toBe(2);
    expect(response.body.data.totalPages).toBe(2);
    expect(response.body.data.summary.paymentCount).toBe(2);
    expect(response.body.data.summary.totalCollected).toBe(7000);

    const row = response.body.data.items[0];

    expect(row.paymentId).toBe(firstPaymentId);
    expect(row.tenantId).toBe(tenantId);
    expect(row.tenantName).toBe('Report E2E Tenant');
    expect(row.propertyId).toBe(propertyId);
    expect(row.agreementId).toBe(agreementId);
    expect(row.amount).toBe(5000);
    expect(row.receiptId).toBe(receiptId);
    expect(row.receiptNumber).toBeDefined();
  });

  it('filters by date range and payment mode', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/rent-collection')
      .query({
        propertyId,
        fromDate: '2026-07-06',
        toDate: '2026-07-31',
        paymentMode: 'cash',
      })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].paymentId).toBe(
      secondPaymentId,
    );
    expect(response.body.data.items[0].paymentMode).toBe('CASH');
    expect(response.body.data.summary.paymentCount).toBe(1);
    expect(response.body.data.summary.totalCollected).toBe(2000);
  });

  it('searches tenant, property, agreement and receipt data', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/rent-collection')
      .query({
        propertyId,
        search: `UPI-${timestamp}`,
      })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].paymentId).toBe(
      firstPaymentId,
    );
    expect(response.body.data.summary.totalCollected).toBe(5000);
  });

  it('rejects unauthenticated outstanding rent report access', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/reports/outstanding-rent')
      .expect(401);
  });

  it('returns only positive outstanding balances with summary totals', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/outstanding-rent')
      .query({
        propertyId,
        tenantId,
        page: 1,
        limit: 1,
        sortBy: 'balanceAmount',
        sortOrder: 'desc',
      })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.page).toBe(1);
    expect(response.body.data.limit).toBe(1);
    expect(response.body.data.total).toBe(2);
    expect(response.body.data.totalPages).toBe(2);

    expect(response.body.data.summary).toEqual({
      totalRentBilled: 18000,
      totalAmountPaid: 7000,
      totalOutstanding: 11000,
      ledgerCount: 2,
      overdueLedgerCount: 2,
    });

    const row = response.body.data.items[0];

    expect(row.rentLedgerId).toBe(unpaidRentLedgerId);
    expect(row.propertyId).toBe(propertyId);
    expect(row.tenantId).toBe(tenantId);
    expect(row.agreementId).toBe(agreementId);
    expect(row.periodYear).toBe(2026);
    expect(row.periodMonth).toBe(6);
    expect(row.rentAmount).toBe(9000);
    expect(row.amountPaid).toBe(0);
    expect(row.balanceAmount).toBe(9000);
    expect(row.status).toBe('UNPAID');
    expect(row.overdueDays).toBeGreaterThan(0);
  });

  it('filters outstanding rent by status and due-date range', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/outstanding-rent')
      .query({
        propertyId,
        status: 'unpaid',
        dueFrom: '2026-06-01',
        dueTo: '2026-06-30',
      })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].rentLedgerId).toBe(
      unpaidRentLedgerId,
    );
    expect(response.body.data.summary.ledgerCount).toBe(1);
    expect(response.body.data.summary.totalRentBilled).toBe(9000);
    expect(response.body.data.summary.totalAmountPaid).toBe(0);
    expect(response.body.data.summary.totalOutstanding).toBe(9000);
    expect(response.body.data.summary.overdueLedgerCount).toBe(1);
  });

  it('searches outstanding rent across related entities', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/reports/outstanding-rent')
      .query({
        propertyId,
        search: `REPORT-AGR-${timestamp}`,
      })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.items).toHaveLength(2);
    expect(
      response.body.data.items.every(
        (item: any) => item.balanceAmount > 0,
      ),
    ).toBe(true);
    expect(response.body.data.summary.totalOutstanding).toBe(11000);
  });
});
