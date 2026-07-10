import { Test } from '@nestjs/testing';
import { createHash, randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { Permissions } from '../../src/core/auth/constants/permissions';
import { POSTGRES_POOL } from '../../src/database/postgres';
import { EventBusService } from '../../src/core/eventbus/services/eventbus.service';
import { PropertyOSEvent } from '../../src/core/eventbus/types/event.types';

describe('Workflow API integration', () => {
  let app: any;
  let pool: Pool;
  let eventBus: EventBusService;
  let accessToken: string;
  const capturedEvents: PropertyOSEvent[] = [];

  const timestamp = Date.now();
  const workflowCode = `workflow.e2e.${timestamp}`;
  const entityId = randomUUID();
  const actorId = randomUUID();

  const email = `workflow-e2e-${timestamp}@propertyos.test`;
  const password = 'CorrectHorseBatteryStaple123!';
  const adminPersonId = randomUUID();
  const credentialId = randomUUID();
  const roleId = randomUUID();
  const personRoleId = randomUUID();

  const permissionKeys = [
    Permissions.WORKFLOW_READ,
    Permissions.WORKFLOW_CREATE,
  ];

  let workflowDefinitionId: string;
  let workflowInstanceId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    pool = app.get(POSTGRES_POOL);
    eventBus = app.get(EventBusService);

    const salt = randomUUID().replace(/-/g, '');
    const hash = createHash('sha256')
      .update(`${salt}:${password}`)
      .digest('hex');

    await pool.query(
      `
      INSERT INTO persons (id, display_name, email, phone, status)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [adminPersonId, 'Workflow E2E Admin', email, null, 'ACTIVE'],
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
      [roleId, `Workflow Role ${timestamp}`, 'Workflow integration'],
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

      await pool.query(
        `
        INSERT INTO role_permissions(id,role_id,permission_id)
        SELECT $1,$2,id FROM permissions WHERE permission_key=$3
        ON CONFLICT DO NOTHING
        `,
        [randomUUID(), roleId, permissionKey],
      );
    }

    const loginResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);

    accessToken = loginResponse.body.accessToken;

    eventBus.subscribeAll((event) => {
      if (event.type.startsWith('workflow.')) {
        capturedEvents.push(event);
      }
    });
  });

  afterAll(async () => {
    if (pool) {
      if (workflowInstanceId) {
        await pool.query('DELETE FROM workflow_instances WHERE id = $1', [
          workflowInstanceId,
        ]);
      }

      if (workflowDefinitionId) {
        await pool.query('DELETE FROM workflow_definitions WHERE id = $1', [
          workflowDefinitionId,
        ]);
      }


      await pool.query(
        'DELETE FROM role_permissions WHERE role_id=$1',
        [roleId],
      );

      await pool.query(
        'DELETE FROM person_roles WHERE id=$1',
        [personRoleId],
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
        [adminPersonId],
      );

      await pool.end();
    }

    await app.close();
  });


  it('GET /api/v1/workflows/definitions rejects missing bearer token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/workflows/definitions')
      .expect(401)
      .expect((response) => {
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toBe('Missing bearer token');
      });
  });

  it('POST /api/v1/workflows/definitions creates workflow definition', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/workflows/definitions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        code: workflowCode,
        name: 'Workflow E2E Definition',
        description: 'Workflow integration test definition',
        entityType: 'e2e.entity',
        initialState: 'DRAFT',
        states: [
          {
            code: 'DRAFT',
            name: 'Draft',
            isInitial: true,
            sortOrder: 1,
          },
          {
            code: 'APPROVED',
            name: 'Approved',
            sortOrder: 2,
          },
          {
            code: 'COMPLETED',
            name: 'Completed',
            isFinal: true,
            sortOrder: 3,
          },
        ],
        transitions: [
          {
            fromState: 'DRAFT',
            toState: 'APPROVED',
            actionCode: 'APPROVE',
            actionName: 'Approve',
          },
          {
            fromState: 'APPROVED',
            toState: 'COMPLETED',
            actionCode: 'COMPLETE',
            actionName: 'Complete',
          },
        ],
        metadata: {
          source: 'integration-test',
        },
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.definition.id).toBeDefined();
    expect(response.body.data.definition.code).toBe(workflowCode);
    expect(response.body.data.definition.entityType).toBe('e2e.entity');
    expect(response.body.data.definition.initialState).toBe('DRAFT');
    expect(response.body.data.definition.isActive).toBe(true);

    workflowDefinitionId = response.body.data.definition.id;
  });

  it('GET /api/v1/workflows/definitions lists created definition', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/workflows/definitions')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.definitions)).toBe(true);
    expect(
      response.body.data.definitions.some(
        (definition: any) => definition.id === workflowDefinitionId,
      ),
    ).toBe(true);
  });

  it('GET /api/v1/workflows/definitions/:id returns states and transitions', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/workflows/definitions/${workflowDefinitionId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.definition.id).toBe(workflowDefinitionId);
    expect(response.body.data.definition.states).toHaveLength(3);
    expect(response.body.data.definition.transitions).toHaveLength(2);
  });

  it('GET /api/v1/workflows/definitions/code/:code returns definition by code', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/workflows/definitions/code/${workflowCode}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.definition.id).toBe(workflowDefinitionId);
    expect(response.body.data.definition.code).toBe(workflowCode);
  });

  it('POST /api/v1/workflows/instances/by-code starts workflow instance', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/workflows/instances/by-code')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        workflowCode,
        entityType: 'e2e.entity',
        entityId,
        createdBy: actorId,
        metadata: {
          source: 'integration-test',
        },
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.instance.id).toBeDefined();
    expect(response.body.data.instance.workflowDefinitionId).toBe(
      workflowDefinitionId,
    );
    expect(response.body.data.instance.entityType).toBe('e2e.entity');
    expect(response.body.data.instance.entityId).toBe(entityId);
    expect(response.body.data.instance.currentState).toBe('DRAFT');
    expect(response.body.data.instance.status).toBe('ACTIVE');

    workflowInstanceId = response.body.data.instance.id;

    const startedEvent = capturedEvents.find(
      (event) =>
        event.type === 'workflow.started' &&
        event.payload.workflowInstanceId === workflowInstanceId,
    );

    expect(startedEvent).toBeDefined();
    expect(startedEvent?.source).toBe('workflow.service');
    expect(startedEvent?.payload.currentState).toBe('DRAFT');
  });

  it('GET /api/v1/workflows/instances/:id returns started instance with history', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/workflows/instances/${workflowInstanceId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.instance.id).toBe(workflowInstanceId);
    expect(response.body.data.instance.history).toHaveLength(1);
    expect(response.body.data.instance.history[0].actionCode).toBe('START');
    expect(response.body.data.instance.history[0].toState).toBe('DRAFT');
  });

  it('POST /api/v1/workflows/instances/:id/transitions transitions by instance id', async () => {
    const response = await request(app.getHttpServer())
      .post(`/api/v1/workflows/instances/${workflowInstanceId}/transitions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        actionCode: 'APPROVE',
        actorId,
        notes: 'Approved from integration test',
        metadata: {
          source: 'integration-test',
        },
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.instance.id).toBe(workflowInstanceId);
    expect(response.body.data.instance.currentState).toBe('APPROVED');
    expect(response.body.data.instance.status).toBe('ACTIVE');

    const transitionedEvent = capturedEvents.find(
      (event) =>
        event.type === 'workflow.transitioned' &&
        event.payload.workflowInstanceId === workflowInstanceId &&
        event.payload.actionCode === 'APPROVE',
    );

    expect(transitionedEvent).toBeDefined();
    expect(transitionedEvent?.payload.fromState).toBe('DRAFT');
    expect(transitionedEvent?.payload.toState).toBe('APPROVED');
  });

  it('POST /api/v1/workflows/instances/by-entity/transitions transitions by entity', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/workflows/instances/by-entity/transitions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        entityType: 'e2e.entity',
        entityId,
        actionCode: 'COMPLETE',
        actorId,
        notes: 'Completed from integration test',
      })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.instance.id).toBe(workflowInstanceId);
    expect(response.body.data.instance.currentState).toBe('COMPLETED');
    expect(response.body.data.instance.status).toBe('COMPLETED');

    const completedEvent = capturedEvents.find(
      (event) =>
        event.type === 'workflow.completed' &&
        event.payload.workflowInstanceId === workflowInstanceId,
    );

    expect(completedEvent).toBeDefined();
    expect(completedEvent?.payload.finalState).toBe('COMPLETED');
  });

  it('GET /api/v1/workflows/instances/by-entity/:entityType/:entityId returns instance with full history', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/workflows/instances/by-entity/e2e.entity/${entityId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.instance.id).toBe(workflowInstanceId);
    expect(response.body.data.instance.currentState).toBe('COMPLETED');
    expect(response.body.data.instance.status).toBe('COMPLETED');
    expect(response.body.data.instance.history).toHaveLength(3);
    expect(response.body.data.instance.history.map((item: any) => item.actionCode)).toEqual([
      'START',
      'APPROVE',
      'COMPLETE',
    ]);
  });



  it('GET /api/v1/workflows/metrics returns workflow operational metrics', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/workflows/metrics')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.metrics.definitions.total).toBeGreaterThanOrEqual(1);
    expect(response.body.data.metrics.definitions.active).toBeGreaterThanOrEqual(1);
    expect(response.body.data.metrics.instances.total).toBeGreaterThanOrEqual(1);
    expect(response.body.data.metrics.instances.completed).toBeGreaterThanOrEqual(1);
    expect(response.body.data.metrics.history.totalTransitions).toBeGreaterThanOrEqual(3);
    expect(
      response.body.data.metrics.history.averageTransitionsPerInstance,
    ).toBeGreaterThanOrEqual(1);
    expect(
      response.body.data.metrics.completion.averageCompletionTimeSeconds,
    ).not.toBeNull();
  });

  it('POST /api/v1/workflows/instances/:id/transitions rejects transition after completion', async () => {
    await request(app.getHttpServer())
      .post(`/api/v1/workflows/instances/${workflowInstanceId}/transitions`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        actionCode: 'COMPLETE',
        actorId,
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toBe(
          'Only active workflow instances can transition',
        );
      });
  });

  it('POST /api/v1/workflows/instances/by-code rejects duplicate entity instance', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/workflows/instances/by-code')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        workflowCode,
        entityType: 'e2e.entity',
        entityId,
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.success).toBe(false);
        expect(response.body.error.message).toBe(
          'Workflow instance already exists for this entity',
        );
        expect(response.body.requestId).toBeDefined();
      });
  });
});
