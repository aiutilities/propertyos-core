import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import {
  CreateWorkflowDefinitionInput,
  StartWorkflowInput,
  TransitionWorkflowInput,
  WorkflowDefinition,
  WorkflowHistory,
  WorkflowInstance,
  WorkflowState,
  WorkflowTransition,
} from '../types/workflow.types';

@Injectable()
export class PostgresWorkflowRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async createDefinition(input: CreateWorkflowDefinitionInput): Promise<WorkflowDefinition> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const definitionResult = await client.query(
        `
        INSERT INTO workflow_definitions (
          code, name, description, entity_type, initial_state, metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          input.code,
          input.name,
          input.description ?? null,
          input.entityType,
          input.initialState,
          JSON.stringify(input.metadata ?? {}),
        ],
      );

      const definition = this.mapDefinition(definitionResult.rows[0]);

      for (const state of input.states) {
        await client.query(
          `
          INSERT INTO workflow_states (
            workflow_definition_id, code, name, is_initial, is_final, sort_order, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            definition.id,
            state.code,
            state.name,
            state.isInitial ?? state.code === input.initialState,
            state.isFinal ?? false,
            state.sortOrder ?? 0,
            JSON.stringify(state.metadata ?? {}),
          ],
        );
      }

      for (const transition of input.transitions) {
        await client.query(
          `
          INSERT INTO workflow_transitions (
            workflow_definition_id, from_state, to_state, action_code,
            action_name, required_permission, metadata
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            definition.id,
            transition.fromState,
            transition.toState,
            transition.actionCode,
            transition.actionName,
            transition.requiredPermission ?? null,
            JSON.stringify(transition.metadata ?? {}),
          ],
        );
      }

      await client.query('COMMIT');
      return definition;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findDefinitionById(id: string): Promise<WorkflowDefinition | null> {
    const result = await this.pool.query('SELECT * FROM workflow_definitions WHERE id = $1', [id]);
    return result.rows[0] ? this.mapDefinition(result.rows[0]) : null;
  }

  async findDefinitionByCode(code: string): Promise<WorkflowDefinition | null> {
    const result = await this.pool.query('SELECT * FROM workflow_definitions WHERE code = $1', [code]);
    return result.rows[0] ? this.mapDefinition(result.rows[0]) : null;
  }

  async listDefinitions(): Promise<WorkflowDefinition[]> {
    const result = await this.pool.query('SELECT * FROM workflow_definitions ORDER BY created_at DESC');
    return result.rows.map((row) => this.mapDefinition(row));
  }

  async listStates(workflowDefinitionId: string): Promise<WorkflowState[]> {
    const result = await this.pool.query(
      'SELECT * FROM workflow_states WHERE workflow_definition_id = $1 ORDER BY sort_order ASC, created_at ASC',
      [workflowDefinitionId],
    );
    return result.rows.map((row) => this.mapState(row));
  }

  async listTransitions(workflowDefinitionId: string): Promise<WorkflowTransition[]> {
    const result = await this.pool.query(
      'SELECT * FROM workflow_transitions WHERE workflow_definition_id = $1 ORDER BY created_at ASC',
      [workflowDefinitionId],
    );
    return result.rows.map((row) => this.mapTransition(row));
  }

  async findTransition(
    workflowDefinitionId: string,
    fromState: string,
    actionCode: string,
  ): Promise<WorkflowTransition | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM workflow_transitions
      WHERE workflow_definition_id = $1
        AND from_state = $2
        AND action_code = $3
      `,
      [workflowDefinitionId, fromState, actionCode],
    );

    return result.rows[0] ? this.mapTransition(result.rows[0]) : null;
  }

  async startInstance(input: StartWorkflowInput): Promise<WorkflowInstance> {
    const definition = await this.findDefinitionById(input.workflowDefinitionId);

    if (!definition) {
      throw new Error('Workflow definition not found');
    }

    const result = await this.pool.query(
      `
      INSERT INTO workflow_instances (
        workflow_definition_id, entity_type, entity_id, current_state, created_by, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        input.workflowDefinitionId,
        input.entityType,
        input.entityId,
        definition.initialState,
        input.createdBy ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    return this.mapInstance(result.rows[0]);
  }

  async findInstanceById(id: string): Promise<WorkflowInstance | null> {
    const result = await this.pool.query('SELECT * FROM workflow_instances WHERE id = $1', [id]);
    return result.rows[0] ? this.mapInstance(result.rows[0]) : null;
  }

  async findInstanceByEntity(entityType: string, entityId: string): Promise<WorkflowInstance | null> {
    const result = await this.pool.query(
      'SELECT * FROM workflow_instances WHERE entity_type = $1 AND entity_id = $2',
      [entityType, entityId],
    );
    return result.rows[0] ? this.mapInstance(result.rows[0]) : null;
  }

  async transitionInstance(input: TransitionWorkflowInput, toState: string): Promise<WorkflowInstance> {
    const result = await this.pool.query(
      `
      UPDATE workflow_instances
      SET current_state = $2,
          updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [input.workflowInstanceId, toState],
    );

    return this.mapInstance(result.rows[0]);
  }

  async addHistory(input: {
    workflowInstanceId: string;
    fromState?: string | null;
    toState: string;
    actionCode: string;
    actorId?: string | null;
    notes?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<WorkflowHistory> {
    const result = await this.pool.query(
      `
      INSERT INTO workflow_history (
        workflow_instance_id, from_state, to_state, action_code, actor_id, notes, metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
      `,
      [
        input.workflowInstanceId,
        input.fromState ?? null,
        input.toState,
        input.actionCode,
        input.actorId ?? null,
        input.notes ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    return this.mapHistory(result.rows[0]);
  }

  async listHistory(workflowInstanceId: string): Promise<WorkflowHistory[]> {
    const result = await this.pool.query(
      'SELECT * FROM workflow_history WHERE workflow_instance_id = $1 ORDER BY created_at ASC',
      [workflowInstanceId],
    );
    return result.rows.map((row) => this.mapHistory(row));
  }

  private mapDefinition(row: any): WorkflowDefinition {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      entityType: row.entity_type,
      initialState: row.initial_state,
      isActive: row.is_active,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapState(row: any): WorkflowState {
    return {
      id: row.id,
      workflowDefinitionId: row.workflow_definition_id,
      code: row.code,
      name: row.name,
      isInitial: row.is_initial,
      isFinal: row.is_final,
      sortOrder: row.sort_order,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    };
  }

  private mapTransition(row: any): WorkflowTransition {
    return {
      id: row.id,
      workflowDefinitionId: row.workflow_definition_id,
      fromState: row.from_state,
      toState: row.to_state,
      actionCode: row.action_code,
      actionName: row.action_name,
      requiredPermission: row.required_permission,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    };
  }

  private mapInstance(row: any): WorkflowInstance {
    return {
      id: row.id,
      workflowDefinitionId: row.workflow_definition_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      currentState: row.current_state,
      status: row.status,
      metadata: row.metadata ?? {},
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapHistory(row: any): WorkflowHistory {
    return {
      id: row.id,
      workflowInstanceId: row.workflow_instance_id,
      fromState: row.from_state,
      toState: row.to_state,
      actionCode: row.action_code,
      actorId: row.actor_id,
      notes: row.notes,
      metadata: row.metadata ?? {},
      createdAt: row.created_at,
    };
  }
}
