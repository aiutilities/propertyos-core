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
  let tenantId: string;
  let agreementId: string;
  let rentLedgerId: string;
  let workflowDefinitionId: string;

  const timestamp = Date.now();

  const email = `search-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';
  const workflowCode = `search.workflow.${timestamp}`;

  const adminPersonId = randomUUID();
  const tenantPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const permissionKeys = [
    Permissions.PROPERTY_READ,
    Permissions.PROPERTY_CREATE,
    Permissions.TENANT_READ,
    Permissions.TENANT_CREATE,
    'agreement.read',
    'agreement.create',
    'rent.read',
    'rent.create',
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
      VALUES ($1,$2,$3,$4,$5)
      `,
      [adminPersonId, 'Search E2E Admin', email, null, 'ACTIVE'],
    );

    await pool.query(
      `
      INSERT INTO persons (id, display_name, email, phone, status)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        tenantPersonId,
        'Search E2E Tenant',
        `search-tenant-${timestamp}@propertyos.test`,
        '9999999996',
        'ACTIVE',
      ],
    );

    await pool.query(
      `
      INSERT INTO credentials
      (id, person_id, credential_type, credential_value)
      VALUES ($1,$2,$3,$4)
      `,
      [credentialId, adminPersonId, 'PASSWORD', `sha256:${salt}:${hash}`],
    );

    await pool.query(
      `
      INSERT INTO roles (id,name,description)
      VALUES ($1,$2,$3)
      `,
      [roleId, `Search Role ${timestamp}`, 'Search integration'],
    );

    await pool.query(
      `
      INSERT INTO person_roles
      (id,person_id,role_id)
      VALUES ($1,$2,$3)
      `,
      [personRoleId, adminPersonId, roleId],
    );

    for (const permissionKey of permissionKeys) {
      await pool.query(
        `
        INSERT INTO permissions(id,permission_key,description)
        VALUES($1,$2,$3)
        ON CONFLICT(permission_key) DO NOTHING
        `,
        [randomUUID(), permissionKey, permissionKey],
      );

      const permission = await pool.query(
        'SELECT id FROM permissions WHERE permission_key=$1',
        [permissionKey],
      );

      await pool.query(
        `
        INSERT INTO role_permissions(id,role_id,permission_id)
        VALUES($1,$2,$3)
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
        name: `Searchable Property ${timestamp}`,
        code: `SEARCH-E2E-${timestamp}`,
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
        tenantNumber: `SEARCH-TEN-${timestamp}`,
        status: 'ACTIVE',
        moveInDate: '2026-07-07T00:00:00.000Z',
      })
      .expect(201);

    tenantId = tenant.body.data.id;

    const agreement = await request(app.getHttpServer())
      .post('/api/v1/agreements')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenantId,
        agreementNumber: `SEARCH-AGR-${timestamp}`,
        startDate: '2026-07-07',
        endDate: '2027-07-06',
        rentAmount: 9000,
        depositAmount: 18000,
        noticePeriodDays: 30,
      })
      .expect(201);

    agreementId = agreement.body.data.id;

    const rent = await request(app.getHttpServer())
      .post('/api/v1/rent-ledgers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        tenantId,
        agreementId,
        periodYear: 2026,
        periodMonth: 7,
        dueDate: '2026-07-31',
        rentAmount: 9000,
      })
      .expect(201);

    rentLedgerId = rent.body.data.id;

    const workflow = await request(app.getHttpServer())
      .post('/api/v1/workflows/definitions')
      .send({
        code: workflowCode,
        name: `Search Workflow ${timestamp}`,
        description: 'Search integration workflow definition',
        entityType: 'search.entity',
        initialState: 'DRAFT',
        states: [
          {
            code: 'DRAFT',
            name: 'Draft',
            isInitial: true,
            sortOrder: 1,
          },
          {
            code: 'COMPLETED',
            name: 'Completed',
            isFinal: true,
            sortOrder: 2,
          },
        ],
        transitions: [
          {
            fromState: 'DRAFT',
            toState: 'COMPLETED',
            actionCode: 'COMPLETE',
            actionName: 'Complete',
          },
        ],
        metadata: {
          source: 'search-integration-test',
        },
      })
      .expect(201);

    workflowDefinitionId = workflow.body.data.definition.id;
  });

  afterAll(async () => {
    if (rentLedgerId) {
      await pool.query(
        'DELETE FROM rent_payments WHERE rent_ledger_id=$1',
        [rentLedgerId],
      );

      await pool.query(
        'DELETE FROM rent_ledgers WHERE id=$1',
        [rentLedgerId],
      );
    }

    if (agreementId) {
      await pool.query(
        'DELETE FROM agreement_versions WHERE agreement_id=$1',
        [agreementId],
      );
      await pool.query(
        'DELETE FROM agreements WHERE id=$1',
        [agreementId],
      );
    }

    if (tenantId) {
      await pool.query(
        'DELETE FROM tenant_spaces WHERE tenant_id=$1',
        [tenantId],
      );
      await pool.query(
        'DELETE FROM tenants WHERE id=$1',
        [tenantId],
      );
    }

    if (propertyId) {
      await pool.query(
        'DELETE FROM spaces WHERE property_id=$1',
        [propertyId],
      );
      await pool.query(
        'DELETE FROM zones WHERE property_id=$1',
        [propertyId],
      );
      await pool.query(
        'DELETE FROM properties WHERE id=$1',
        [propertyId],
      );
    }

    if (workflowDefinitionId) {
      await pool.query(
        'DELETE FROM workflow_instances WHERE workflow_definition_id=$1',
        [workflowDefinitionId],
      );
      await pool.query(
        'DELETE FROM workflow_history WHERE workflow_instance_id IN (SELECT id FROM workflow_instances WHERE workflow_definition_id=$1)',
        [workflowDefinitionId],
      );
      await pool.query(
        'DELETE FROM workflow_transitions WHERE workflow_definition_id=$1',
        [workflowDefinitionId],
      );
      await pool.query(
        'DELETE FROM workflow_states WHERE workflow_definition_id=$1',
        [workflowDefinitionId],
      );
      await pool.query(
        'DELETE FROM workflow_definitions WHERE id=$1',
        [workflowDefinitionId],
      );
    }

    await pool.query(
      'DELETE FROM role_permissions WHERE role_id=$1',
      [roleId],
    );

    await pool.query(
      'DELETE FROM person_roles WHERE person_id=$1',
      [adminPersonId],
    );

    await pool.query(
      'DELETE FROM roles WHERE id=$1',
      [roleId],
    );

    await pool.query(
      'DELETE FROM credentials WHERE person_id=$1',
      [adminPersonId],
    );

    await pool.query(
      'DELETE FROM persons WHERE id=$1',
      [tenantPersonId],
    );

    await pool.query(
      'DELETE FROM persons WHERE id=$1',
      [adminPersonId],
    );

    await pool.end();
    await app.close();
  });

  it('GET /api/v1/search/providers lists registered providers', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/search/providers')
      .expect(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.some((p:any)=>p.name==='core-property-search')).toBe(true);
    expect(response.body.data.some((p:any)=>p.name==='core-tenant-search')).toBe(true);
    expect(response.body.data.some((p:any)=>p.name==='core-agreement-search')).toBe(true);
    expect(response.body.data.some((p:any)=>p.name==='core-rent-search')).toBe(true);
    expect(response.body.data.some((p:any)=>p.name==='core-workflow-search')).toBe(true);
  });

  it('POST /api/v1/search searches properties', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/search')
      .send({
        query:`SEARCH-E2E-${timestamp}`,
        entityTypes:['PROPERTY'],
        limit:10,
      })
      .expect(201);

    expect(
      response.body.some(
        (r:any)=>
          r.entityType==='PROPERTY' &&
          r.entityId===propertyId,
      ),
    ).toBe(true);
  });

  it('POST /api/v1/search searches tenants', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/search')
      .send({
        query:`SEARCH-TEN-${timestamp}`,
        entityTypes:['TENANT'],
        limit:10,
      })
      .expect(201);

    expect(
      response.body.some(
        (r:any)=>
          r.entityType==='TENANT' &&
          r.entityId===tenantId,
      ),
    ).toBe(true);
  });

  it('POST /api/v1/search searches agreements', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/search')
      .send({
        query:`SEARCH-AGR-${timestamp}`,
        entityTypes:['AGREEMENT'],
        limit:10,
      })
      .expect(201);

    expect(
      response.body.some(
        (r:any)=>
          r.entityType==='AGREEMENT' &&
          r.entityId===agreementId,
      ),
    ).toBe(true);
  });

  it('POST /api/v1/search searches rent ledgers', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/search')
      .send({
        query:'UNPAID',
        entityTypes:['RENT_LEDGER'],
        limit:10,
      })
      .expect(201);

    expect(
      response.body.some(
        (r:any)=>
          r.entityType==='RENT_LEDGER' &&
          r.entityId===rentLedgerId,
      ),
    ).toBe(true);
  });

  it('POST /api/v1/search searches workflow definitions', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/search')
      .send({
        query:workflowCode,
        entityTypes:['WORKFLOW'],
        limit:10,
      })
      .expect(201);

    expect(
      response.body.some(
        (r:any)=>
          r.entityType==='WORKFLOW' &&
          r.entityId===workflowDefinitionId,
      ),
    ).toBe(true);
  });
});
