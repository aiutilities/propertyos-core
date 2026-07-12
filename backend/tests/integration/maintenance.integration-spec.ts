import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { AuditService } from '../../src/core/audit/audit.service';
import { EventBusService } from '../../src/core/eventbus/services/eventbus.service';
import { WorkflowService } from '../../src/core/workflow/services/workflow.service';
import {
  MAINTENANCE_EVENTS,
  MAINTENANCE_PERMISSIONS,
} from '../../src/core/maintenance/maintenance.constants';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Maintenance API integration', () => {
  let app: any;
  let pool: Pool;
  let eventBus: EventBusService;
  let workflowService: WorkflowService;
  let auditService: AuditService;
  let accessToken: string;

  const timestamp = Date.now();
  const email = `maintenance-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';

  const adminPersonId = randomUUID();
  const technicianPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const propertyId = randomUUID();
  const spaceId = randomUUID();

  const maintenanceReadPermissionId = randomUUID();
  const maintenanceCreatePermissionId = randomUUID();
  const maintenanceManagePermissionId = randomUUID();

  const electricalCategoryId =
    '10000000-0000-4000-8000-000000000002';

  let ticketId: string;
  let ticketNumber: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);
    eventBus = app.get(EventBusService);
    workflowService = app.get(WorkflowService);
    auditService = app.get(AuditService);

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `
      INSERT INTO persons (
        id,
        display_name,
        email,
        phone,
        status
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        adminPersonId,
        'Maintenance E2E Administrator',
        email,
        '9000000001',
        'ACTIVE',
      ],
    );

    await pool.query(
      `
      INSERT INTO persons (
        id,
        display_name,
        email,
        phone,
        status
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        technicianPersonId,
        'Maintenance E2E Technician',
        `maintenance-technician-${timestamp}@propertyos.test`,
        '9000000002',
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
      VALUES ($1,$2,$3,$4)
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
      INSERT INTO roles (
        id,
        name,
        description
      )
      VALUES ($1,$2,$3)
      `,
      [
        roleId,
        `Maintenance E2E Role ${timestamp}`,
        'Maintenance integration test role',
      ],
    );

    const permissions = [
      [
        maintenanceReadPermissionId,
        MAINTENANCE_PERMISSIONS.READ,
        'Read maintenance tickets',
      ],
      [
        maintenanceCreatePermissionId,
        MAINTENANCE_PERMISSIONS.CREATE,
        'Create maintenance tickets',
      ],
      [
        maintenanceManagePermissionId,
        MAINTENANCE_PERMISSIONS.MANAGE,
        'Manage maintenance tickets',
      ],
    ];

    for (const [id, key, description] of permissions) {
      await pool.query(
        `
        INSERT INTO permissions (
          id,
          permission_key,
          description
        )
        VALUES ($1,$2,$3)
        ON CONFLICT (permission_key) DO NOTHING
        `,
        [id, key, description],
      );
    }

    await pool.query(
      `
      INSERT INTO person_roles (
        id,
        person_id,
        role_id
      )
      VALUES ($1,$2,$3)
      `,
      [
        personRoleId,
        adminPersonId,
        roleId,
      ],
    );

    for (const permissionKey of [
      MAINTENANCE_PERMISSIONS.READ,
      MAINTENANCE_PERMISSIONS.CREATE,
      MAINTENANCE_PERMISSIONS.MANAGE,
    ]) {
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
        VALUES ($1,$2,$3)
        `,
        [
          randomUUID(),
          roleId,
          permission.rows[0].id,
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
        'Maintenance E2E Property',
        `MAINT-E2E-${timestamp}`,
        'BOUTIQUE_ROOMS',
        'Maintenance integration test property',
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
        'Maintenance E2E Room',
        `MAINT-ROOM-${timestamp}`,
        'ROOM',
        '1',
        'Maintenance integration test room',
        true,
      ],
    );

    const loginResponse = await request(
      app.getHttpServer(),
    )
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
      if (ticketId) {
        await pool.query(
          `
          DELETE FROM workflow_history
          WHERE workflow_instance_id IN (
            SELECT id
            FROM workflow_instances
            WHERE entity_type = 'maintenance.ticket'
              AND entity_id = $1
          )
          `,
          [ticketId],
        );

        await pool.query(
          `
          DELETE FROM workflow_instances
          WHERE entity_type = 'maintenance.ticket'
            AND entity_id = $1
          `,
          [ticketId],
        );

        await pool.query(
          `
          DELETE FROM audit_logs
          WHERE source = 'core.maintenance'
            AND payload->>'entityId' = $1
          `,
          [ticketId],
        );
      }

      await pool.query(
        `
        DELETE FROM maintenance_ticket_history
        WHERE ticket_id IN (
          SELECT id
          FROM maintenance_tickets
          WHERE property_id = $1
        )
        `,
        [propertyId],
      );

      await pool.query(
        `
        DELETE FROM maintenance_tickets
        WHERE property_id = $1
        `,
        [propertyId],
      );

      await pool.query(
        `
        DELETE FROM spaces
        WHERE id = $1
        `,
        [spaceId],
      );

      await pool.query(
        `
        DELETE FROM properties
        WHERE id = $1
        `,
        [propertyId],
      );

      await pool.query(
        `
        DELETE FROM role_permissions
        WHERE role_id = $1
        `,
        [roleId],
      );

      await pool.query(
        `
        DELETE FROM person_roles
        WHERE person_id = $1
        `,
        [adminPersonId],
      );

      await pool.query(
        `
        DELETE FROM roles
        WHERE id = $1
        `,
        [roleId],
      );

      await pool.query(
        `
        DELETE FROM credentials
        WHERE person_id = $1
        `,
        [adminPersonId],
      );

      await pool.query(
        `
        DELETE FROM persons
        WHERE id = $1
        `,
        [technicianPersonId],
      );

      await pool.query(
        `
        DELETE FROM persons
        WHERE id = $1
        `,
        [adminPersonId],
      );

      await pool.end();
    }

    if (app) {
      await app.close();
    }
  });

  it('rejects requests without authentication', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/maintenance')
      .expect(401);
  });

  it('lists seeded maintenance categories', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .get('/api/v1/maintenance/categories')
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(
      true,
    );
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

  it('creates an urgent maintenance ticket with SLA', async () => {
    const beforeCreate = Date.now();

    const response = await request(
      app.getHttpServer(),
    )
      .post('/api/v1/maintenance')
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .send({
        title: 'Room power supply failure',
        description:
          'There is no electrical power in the room.',
        categoryId: electricalCategoryId,
        propertyId,
        spaceId,
        reporterPersonId: adminPersonId,
        priority: 'URGENT',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBeDefined();
    expect(response.body.data.ticketNumber).toMatch(
      /^MT-\d{8}-[A-F0-9]{6}$/,
    );
    expect(response.body.data.status).toBe('OPEN');
    expect(response.body.data.priority).toBe(
      'URGENT',
    );
    expect(response.body.data.propertyId).toBe(
      propertyId,
    );
    expect(response.body.data.spaceId).toBe(
      spaceId,
    );
    expect(response.body.data.slaDueAt).toBeDefined();

    ticketId = response.body.data.id;
    ticketNumber =
      response.body.data.ticketNumber;

    const slaDueAt = new Date(
      response.body.data.slaDueAt,
    ).getTime();

    const expectedUrgentSlaMs = 60 * 60 * 1000;

    expect(
      slaDueAt - beforeCreate,
    ).toBeGreaterThanOrEqual(
      expectedUrgentSlaMs - 10_000,
    );

    expect(
      slaDueAt - beforeCreate,
    ).toBeLessThanOrEqual(
      expectedUrgentSlaMs + 10_000,
    );
  });

  it('lists and filters the created ticket', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .get('/api/v1/maintenance')
      .query({
        propertyId,
        status: 'OPEN',
        priority: 'URGENT',
        reporterPersonId: adminPersonId,
        search: ticketNumber,
      })
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(
      true,
    );

    expect(
      response.body.data.some(
        (ticket: any) =>
          ticket.id === ticketId,
      ),
    ).toBe(true);
  });

  it('returns ticket details and initial history', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .get(`/api/v1/maintenance/${ticketId}`)
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(ticketId);
    expect(response.body.data.category.code).toBe(
      'ELECTRICAL',
    );
    expect(response.body.data.history).toHaveLength(
      1,
    );
    expect(
      response.body.data.history[0].toStatus,
    ).toBe('OPEN');
  });

  it('rejects an invalid OPEN to RESOLVED transition', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .post(
        `/api/v1/maintenance/${ticketId}/transition`,
      )
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .send({
        status: 'RESOLVED',
        changedByPersonId: adminPersonId,
        remarks: 'Invalid direct resolution',
      })
      .expect(400);

    expect(response.body.success).toBe(false);
  });

  it('assigns the ticket to a technician', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .post(
        `/api/v1/maintenance/${ticketId}/assign`,
      )
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .send({
        assigneePersonId: technicianPersonId,
        changedByPersonId: adminPersonId,
        remarks: 'Assigned to electrician',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe(
      'ASSIGNED',
    );
    expect(
      response.body.data.assigneePersonId,
    ).toBe(technicianPersonId);
  });

  it('moves through the full maintenance lifecycle', async () => {
    const transitions = [
      {
        status: 'IN_PROGRESS',
        remarks: 'Electrical investigation started',
      },
      {
        status: 'RESOLVED',
        remarks: 'Faulty breaker replaced',
      },
      {
        status: 'CLOSED',
        remarks: 'Reporter confirmed power restored',
      },
    ];

    for (const transition of transitions) {
      const response = await request(
        app.getHttpServer(),
      )
        .post(
          `/api/v1/maintenance/${ticketId}/transition`,
        )
        .set(
          'Authorization',
          `Bearer ${accessToken}`,
        )
        .send({
          ...transition,
          changedByPersonId: adminPersonId,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe(
        transition.status,
      );
    }
  });

  it('persists complete ticket history', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .get(
        `/api/v1/maintenance/${ticketId}/history`,
      )
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .expect(200);

    expect(response.body.success).toBe(true);

    expect(
      response.body.data.map(
        (history: any) => history.toStatus,
      ),
    ).toEqual([
      'OPEN',
      'ASSIGNED',
      'IN_PROGRESS',
      'RESOLVED',
      'CLOSED',
    ]);
  });

  it('returns property maintenance metrics', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .get('/api/v1/maintenance/metrics')
      .query({
        propertyId,
      })
      .set(
        'Authorization',
        `Bearer ${accessToken}`,
      )
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.total).toBe(1);
    expect(response.body.data.closed).toBe(1);
    expect(response.body.data.open).toBe(0);
    expect(response.body.data.overdue).toBe(0);
  });


  it('persists and completes the maintenance workflow', async () => {
    const workflow =
      await workflowService.getInstanceByEntity(
        'maintenance.ticket',
        ticketId,
      );

    expect(workflow.entityType).toBe(
      'maintenance.ticket',
    );
    expect(workflow.entityId).toBe(ticketId);
    expect(workflow.currentState).toBe('CLOSED');
    expect(workflow.status).toBe('COMPLETED');

    expect(
      workflow.history.map(
        (entry: any) => entry.actionCode,
      ),
    ).toEqual([
      'START',
      'assign',
      'start',
      'resolve',
      'close',
    ]);

    expect(
      workflow.history.map(
        (entry: any) => entry.toState,
      ),
    ).toEqual([
      'OPEN',
      'ASSIGNED',
      'IN_PROGRESS',
      'RESOLVED',
      'CLOSED',
    ]);
  });

  it('persists maintenance audit records', async () => {
    const entries = await auditService.listByEntity(
      'maintenance.ticket',
      ticketId,
      100,
    );

    const directEntries = entries.filter(
      (entry) =>
        entry.source === 'core.maintenance' &&
        entry.payload.entityType ===
          'maintenance.ticket' &&
        entry.payload.entityId === ticketId,
    );

    expect(
      directEntries.length,
    ).toBeGreaterThanOrEqual(5);

    const eventTypes = directEntries.map(
      (entry) => entry.eventType,
    );

    expect(eventTypes).toContain(
      MAINTENANCE_EVENTS.CREATED,
    );
    expect(eventTypes).toContain(
      MAINTENANCE_EVENTS.ASSIGNED,
    );
    expect(eventTypes).toContain(
      MAINTENANCE_EVENTS.IN_PROGRESS,
    );
    expect(eventTypes).toContain(
      MAINTENANCE_EVENTS.RESOLVED,
    );
    expect(eventTypes).toContain(
      MAINTENANCE_EVENTS.CLOSED,
    );
  });

  it('publishes maintenance lifecycle events', async () => {
    const createdEvents =
      await eventBus.listEvents({
        type: MAINTENANCE_EVENTS.CREATED,
        source: 'core.maintenance',
        limit: 100,
      });

    const assignedEvents =
      await eventBus.listEvents({
        type: MAINTENANCE_EVENTS.ASSIGNED,
        source: 'core.maintenance',
        limit: 100,
      });

    const closedEvents =
      await eventBus.listEvents({
        type: MAINTENANCE_EVENTS.CLOSED,
        source: 'core.maintenance',
        limit: 100,
      });

    expect(
      createdEvents.some(
        (event) =>
          event.payload.ticketId === ticketId,
      ),
    ).toBe(true);

    expect(
      assignedEvents.some(
        (event) =>
          event.payload.ticketId === ticketId,
      ),
    ).toBe(true);

    expect(
      closedEvents.some(
        (event) =>
          event.payload.ticketId === ticketId,
      ),
    ).toBe(true);
  });
});
