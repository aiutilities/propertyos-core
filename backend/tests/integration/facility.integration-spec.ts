import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { AuditService } from '../../src/core/audit/audit.service';
import { EventBusService } from '../../src/core/eventbus/services/eventbus.service';
import {
  FACILITY_EVENTS,
  FACILITY_PERMISSIONS,
} from '../../src/core/facility/facility.constants';
import { WorkflowService } from '../../src/core/workflow/services/workflow.service';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Facility Asset API integration', () => {
  let app: any;
  let pool: Pool;
  let eventBus: EventBusService;
  let auditService: AuditService;
  let workflowService: WorkflowService;
  let accessToken: string;

  const timestamp = Date.now();
  const password = 'CorrectHorseBatteryStaple123!';
  const email =
    `facility-e2e-${timestamp}@propertyos.test`;

  const personId = randomUUID();
  const technicianPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const propertyId = randomUUID();
  const spaceId = randomUUID();

  const categoryId =
    '20000000-0000-4000-8000-000000000001';

  let assetId = '';
  let assetNumber = '';
  let planId = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);
    eventBus = app.get(EventBusService);
    auditService = app.get(AuditService);
    workflowService = app.get(WorkflowService);

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `
      INSERT INTO persons (
        id, display_name, email, phone, status
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        personId,
        'Facility E2E Administrator',
        email,
        '9000000101',
        'ACTIVE',
      ],
    );

    await pool.query(
      `
      INSERT INTO persons (
        id, display_name, email, phone, status
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        technicianPersonId,
        'Facility E2E Technician',
        `facility-tech-${timestamp}@propertyos.test`,
        '9000000102',
        'ACTIVE',
      ],
    );

    await pool.query(
      `
      INSERT INTO credentials (
        id, person_id, credential_type, credential_value
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        credentialId,
        personId,
        'PASSWORD',
        `sha256:${salt}:${hash}`,
      ],
    );

    await pool.query(
      `
      INSERT INTO roles (
        id, name, description
      )
      VALUES ($1,$2,$3)
      `,
      [
        roleId,
        `Facility E2E Role ${timestamp}`,
        'Facility integration test role',
      ],
    );

    for (const permission of [
      FACILITY_PERMISSIONS.READ,
      FACILITY_PERMISSIONS.CREATE,
      FACILITY_PERMISSIONS.MANAGE,
    ]) {
      await pool.query(
        `
        INSERT INTO permissions (
          id, permission_key, description
        )
        VALUES ($1,$2,$3)
        ON CONFLICT (permission_key) DO NOTHING
        `,
        [
          randomUUID(),
          permission,
          `Facility test permission: ${permission}`,
        ],
      );
    }

    await pool.query(
      `
      INSERT INTO person_roles (
        id, person_id, role_id
      )
      VALUES ($1,$2,$3)
      `,
      [personRoleId, personId, roleId],
    );

    for (const permission of [
      FACILITY_PERMISSIONS.READ,
      FACILITY_PERMISSIONS.CREATE,
      FACILITY_PERMISSIONS.MANAGE,
    ]) {
      const result = await pool.query(
        `
        SELECT id
        FROM permissions
        WHERE permission_key = $1
        `,
        [permission],
      );

      await pool.query(
        `
        INSERT INTO role_permissions (
          id, role_id, permission_id
        )
        VALUES ($1,$2,$3)
        `,
        [
          randomUUID(),
          roleId,
          result.rows[0].id,
        ],
      );
    }

    await pool.query(
      `
      INSERT INTO properties (
        id,
        name,
        code,
        property_type,
        description,
        city,
        state,
        country,
        is_active
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        propertyId,
        'Facility E2E Property',
        `FAC-E2E-${timestamp}`,
        'BOUTIQUE_ROOMS',
        'Facility integration test property',
        'Chengalpattu',
        'Tamil Nadu',
        'India',
        true,
      ],
    );

    await pool.query(
      `
      INSERT INTO spaces (
        id,
        property_id,
        zone_id,
        name,
        code,
        space_type,
        floor,
        description,
        is_active
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        spaceId,
        propertyId,
        null,
        'Facility E2E Utility Room',
        `FAC-SPACE-${timestamp}`,
        'ROOM',
        'Ground',
        'Facility integration test space',
        true,
      ],
    );

    const login = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email,
        password,
      })
      .expect(201);

    accessToken = login.body.accessToken;
  });

  afterAll(async () => {
    if (pool) {
      if (assetId) {
        await pool.query(
          `
          DELETE FROM workflow_history
          WHERE workflow_instance_id IN (
            SELECT id
            FROM workflow_instances
            WHERE entity_type = 'facility.asset'
              AND entity_id = $1
          )
          `,
          [assetId],
        );

        await pool.query(
          `
          DELETE FROM workflow_instances
          WHERE entity_type = 'facility.asset'
            AND entity_id = $1
          `,
          [assetId],
        );

        await pool.query(
          `
          DELETE FROM audit_logs
          WHERE payload->>'entityId' = $1
             OR payload->>'assetId' = $1
          `,
          [assetId],
        );
      }

      await pool.query(
        `
        DELETE FROM preventive_maintenance_plans
        WHERE asset_id = $1
        `,
        [assetId || randomUUID()],
      );

      await pool.query(
        `
        DELETE FROM facility_asset_history
        WHERE asset_id = $1
        `,
        [assetId || randomUUID()],
      );

      await pool.query(
        `
        DELETE FROM facility_assets
        WHERE id = $1
        `,
        [assetId || randomUUID()],
      );

      await pool.query(
        `DELETE FROM spaces WHERE id = $1`,
        [spaceId],
      );

      await pool.query(
        `DELETE FROM properties WHERE id = $1`,
        [propertyId],
      );

      await pool.query(
        `DELETE FROM role_permissions WHERE role_id = $1`,
        [roleId],
      );

      await pool.query(
        `DELETE FROM person_roles WHERE person_id = $1`,
        [personId],
      );

      await pool.query(
        `DELETE FROM roles WHERE id = $1`,
        [roleId],
      );

      await pool.query(
        `DELETE FROM credentials WHERE person_id = $1`,
        [personId],
      );

      await pool.query(
        `DELETE FROM persons WHERE id IN ($1,$2)`,
        [personId, technicianPersonId],
      );

      await pool.end();
    }

    if (app) {
      await app.close();
    }
  });

  it('rejects unauthenticated asset listing', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/facilities/assets')
      .expect(401);
  });

  it('lists seeded asset categories', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/facilities/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(
      7,
    );

    expect(
      response.body.data.some(
        (category: any) =>
          category.code === 'ELECTRICAL',
      ),
    ).toBe(true);
  });

  it('creates a draft facility asset with QR identity', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/facilities/assets')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Main Distribution Board',
        description:
          'Electrical distribution board for the ground floor',
        categoryId,
        propertyId,
        spaceId,
        manufacturer: 'PropertyOS Test Electric',
        model: 'MDB-100',
        serialNumber: `MDB-${timestamp}`,
        status: 'DRAFT',
        condition: 'NEW',
        purchaseCost: 125000,
        warrantyExpiresAt: '2028-12-31T00:00:00.000Z',
        vendorName: 'Test Electrical Vendor',
        vendorContact: '9000000199',
        createdByPersonId: personId,
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.assetNumber).toMatch(
      /^AS-\d{8}-[A-F0-9]{6}$/,
    );
    expect(response.body.data.qrToken).toBeDefined();
    expect(response.body.data.status).toBe('DRAFT');
    expect(response.body.data.condition).toBe('NEW');

    assetId = response.body.data.id;
    assetNumber = response.body.data.assetNumber;
  });

  it('lists and searches the facility asset', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/facilities/assets')
      .query({
        propertyId,
        status: 'DRAFT',
        condition: 'NEW',
        search: assetNumber,
      })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(
      response.body.data.some(
        (asset: any) => asset.id === assetId,
      ),
    ).toBe(true);
  });

  it('returns asset details and initial history', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/facilities/assets/${assetId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.category.code).toBe(
      'ELECTRICAL',
    );
    expect(response.body.data.history).toHaveLength(1);
    expect(
      response.body.data.history[0].toStatus,
    ).toBe('DRAFT');
  });

  it('rejects an invalid DRAFT to RETIRED transition', async () => {
    await request(app.getHttpServer())
      .post(
        `/api/v1/facilities/assets/${assetId}/transition`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        status: 'RETIRED',
        changedByPersonId: personId,
        remarks: 'Invalid direct retirement',
      })
      .expect(400);
  });

  it('activates and cycles the asset through maintenance', async () => {
    for (const status of [
      'ACTIVE',
      'IN_MAINTENANCE',
      'ACTIVE',
    ]) {
      const response = await request(app.getHttpServer())
        .post(
          `/api/v1/facilities/assets/${assetId}/transition`,
        )
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status,
          changedByPersonId: personId,
          remarks: `Transition asset to ${status}`,
        })
        .expect(201);

      expect(response.body.data.status).toBe(status);
    }
  });

  it('creates a preventive-maintenance plan', async () => {
    const response = await request(app.getHttpServer())
      .post(
        `/api/v1/facilities/assets/${assetId}/preventive-plans`,
      )
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Quarterly electrical inspection',
        description:
          'Inspect terminals, load balance and insulation',
        frequency: 'QUARTERLY',
        nextDueAt: '2026-10-01T03:30:00.000Z',
        assignedPersonId: technicianPersonId,
        createdByPersonId: personId,
      })
      .expect(201);

    expect(response.body.data.assetId).toBe(assetId);
    expect(response.body.data.frequency).toBe(
      'QUARTERLY',
    );

    planId = response.body.data.id;
  });

  it('returns asset and preventive-maintenance metrics', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/facilities/assets/metrics')
      .query({ propertyId })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.total).toBe(1);
    expect(response.body.data.active).toBe(1);
    expect(response.body.data.inMaintenance).toBe(0);
  });

  it('persists asset workflow history', async () => {
    const workflow =
      await workflowService.getInstanceByEntity(
        'facility.asset',
        assetId,
      );

    expect(workflow.currentState).toBe('ACTIVE');
    expect(workflow.status).toBe('ACTIVE');

    expect(
      workflow.history.map(
        (entry: any) => entry.actionCode,
      ),
    ).toEqual([
      'START',
      'activate',
      'start-maintenance',
      'return-to-service',
    ]);
  });

  it('persists facility audit and Event Bus entries', async () => {
    const audits = await auditService.listByEntity(
      'facility.asset',
      assetId,
      100,
    );

    const directAudits = audits.filter(
      (entry) =>
        entry.source === 'core.facility' &&
        entry.payload.entityId === assetId,
    );

    expect(
      directAudits.map((entry) => entry.eventType),
    ).toEqual(
      expect.arrayContaining([
        FACILITY_EVENTS.ASSET_CREATED,
        FACILITY_EVENTS.ASSET_ACTIVATED,
        FACILITY_EVENTS.ASSET_IN_MAINTENANCE,
      ]),
    );

    const events = await eventBus.listEvents({
      source: 'core.facility',
      limit: 100,
    });

    expect(
      events.some(
        (event) =>
          event.payload.assetId === assetId,
      ),
    ).toBe(true);

    expect(planId).toBeDefined();
  });
});
