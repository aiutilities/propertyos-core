import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import request from 'supertest';

import { AppModule } from '../../src/app.module';
import { POSTGRES_POOL } from '../../src/database/postgres';

describe('Workflow API integration', () => {
  let app: any;
  let pool: Pool;

  const timestamp = Date.now();
  const workflowCode = `workflow.e2e.${timestamp}`;
  const entityId = randomUUID();
  const actorId = randomUUID();

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

      await pool.end();
    }

    await app.close();
  });

  it('POST /api/v1/workflows/definitions creates workflow definition', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/workflows/definitions')
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
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.definition.id).toBe(workflowDefinitionId);
    expect(response.body.data.definition.states).toHaveLength(3);
    expect(response.body.data.definition.transitions).toHaveLength(2);
  });

  it('GET /api/v1/workflows/definitions/code/:code returns definition by code', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/workflows/definitions/code/${workflowCode}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.definition.id).toBe(workflowDefinitionId);
    expect(response.body.data.definition.code).toBe(workflowCode);
  });

  it('POST /api/v1/workflows/instances/by-code starts workflow instance', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/workflows/instances/by-code')
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
  });

  it('GET /api/v1/workflows/instances/:id returns started instance with history', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/workflows/instances/${workflowInstanceId}`)
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
  });

  it('POST /api/v1/workflows/instances/by-entity/transitions transitions by entity', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/workflows/instances/by-entity/transitions')
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
  });

  it('GET /api/v1/workflows/instances/by-entity/:entityType/:entityId returns instance with full history', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/v1/workflows/instances/by-entity/e2e.entity/${entityId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.instance.id).toBe(workflowInstanceId);
    expect(response.body.data.instance.currentState).toBe('COMPLETED');
    expect(response.body.data.instance.history).toHaveLength(3);
    expect(response.body.data.instance.history.map((item: any) => item.actionCode)).toEqual([
      'START',
      'APPROVE',
      'COMPLETE',
    ]);
  });

  it('POST /api/v1/workflows/instances/by-code rejects duplicate entity instance', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/workflows/instances/by-code')
      .send({
        workflowCode,
        entityType: 'e2e.entity',
        entityId,
      })
      .expect(400)
      .expect((response) => {
        expect(response.body.message).toBe(
          'Workflow instance already exists for this entity',
        );
      });
  });
});
