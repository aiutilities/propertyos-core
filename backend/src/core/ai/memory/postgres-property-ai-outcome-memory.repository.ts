import {
  Inject,
  Injectable,
} from '@nestjs/common';

import {
  Pool,
} from 'pg';

import {
  randomUUID,
} from 'crypto';

import {
  POSTGRES_POOL,
} from '../../../database/postgres';

import {
  PropertyAiOutcomeMemoryRepository,
} from './property-ai-outcome-memory.repository';

import {
  PropertyAiOutcomeMemoryRecord,
} from './property-ai-outcome-memory.repository.types';


@Injectable()
export class PostgresPropertyAiOutcomeMemoryRepository
  implements PropertyAiOutcomeMemoryRepository {


  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool:
      Pool,
  ) {}


  async create(
    memory:
      PropertyAiOutcomeMemoryRecord,
  ):
    Promise<PropertyAiOutcomeMemoryRecord> {


    const id =
      memory.id ??
      randomUUID();


    await this.pool.query(
      `
      INSERT INTO ai_outcome_memory
      (
        id,
        property_id,
        command,
        decision,
        action,
        confidence,
        execution_status,
        outcome_summary,
        created_at
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        COALESCE($9, NOW())
      )
      `,
      [
        id,
        memory.propertyId,
        memory.command,
        memory.decision,
        memory.action ?? null,
        memory.confidence ?? null,
        memory.executionStatus,
        memory.outcomeSummary ?? null,
        memory.createdAt ?? null,
      ],
    );


    return {
      ...memory,
      id,
    };

  }


  async findByProperty(
    propertyId:
      string,
  ):
    Promise<PropertyAiOutcomeMemoryRecord[]> {


    const result =
      await this.pool.query(
        `
        SELECT
          id,
          property_id,
          command,
          decision,
          action,
          confidence,
          execution_status,
          outcome_summary,
          created_at
        FROM ai_outcome_memory
        WHERE property_id = $1
        ORDER BY created_at DESC
        `,
        [
          propertyId,
        ],
      );


    return result.rows.map(
      row => this.mapRow(row),
    );

  }


  async findSuccessful(
    propertyId:
      string,
  ):
    Promise<PropertyAiOutcomeMemoryRecord[]> {


    const result =
      await this.pool.query(
        `
        SELECT
          id,
          property_id,
          command,
          decision,
          action,
          confidence,
          execution_status,
          outcome_summary,
          created_at
        FROM ai_outcome_memory
        WHERE property_id = $1
          AND execution_status = 'SUCCESS'
        ORDER BY created_at DESC
        `,
        [
          propertyId,
        ],
      );


    return result.rows.map(
      row => this.mapRow(row),
    );

  }


  async count():
    Promise<number> {

    const result =
      await this.pool.query(
        `
        SELECT COUNT(*)::int AS count
        FROM ai_outcome_memory
        `,
      );

    return result.rows[0].count;

  }


  private mapRow(
    row:
      any,
  ):
    PropertyAiOutcomeMemoryRecord {

    return {

      id:
        row.id,

      propertyId:
        row.property_id,

      command:
        row.command,

      decision:
        row.decision,

      action:
        row.action,

      confidence:
        row.confidence
          ? Number(row.confidence)
          : undefined,

      executionStatus:
        row.execution_status,

      outcomeSummary:
        row.outcome_summary,

      createdAt:
        row.created_at,

    };

  }

}
