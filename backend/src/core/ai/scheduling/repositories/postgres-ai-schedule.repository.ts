import {
  Inject,
  Injectable,
} from "@nestjs/common";

import {
  Pool,
} from "pg";

import {
  POSTGRES_POOL,
} from "../../../../database/postgres";

import {
  AiScheduleListFilter,
  AiScheduleHistoryFilter,
  AiScheduleRepository,
} from "./ai-schedule.repository";

import {
  AiOccurrenceClaim,
  AiScheduleAttempt,
  AiScheduleManifest,
  AiScheduledOccurrence,
  AiScheduleStatus,
} from "../types/ai-schedule.types";

@Injectable()
export class PostgresAiScheduleRepository
  implements AiScheduleRepository
{
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async createSchedule(
    schedule: AiScheduleManifest,
  ): Promise<AiScheduleManifest> {
    const result = await this.pool.query(
      `
      INSERT INTO ai_schedules
      (
        id,
        name,
        description,
        command_name,
        command_payload,
        schedule_type,
        run_at,
        interval_seconds,
        timezone,
        status,
        retry_policy,
        governance_context,
        created_by,
        metadata,
        created_at,
        updated_at
      )
      VALUES
      (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $15
      )
      RETURNING *
      `,
      [
        schedule.id,
        schedule.name,
        schedule.description ?? null,
        schedule.commandName,
        schedule.commandPayload,
        schedule.scheduleType,
        schedule.runAt ?? null,
        schedule.intervalSeconds ?? null,
        schedule.timezone,
        schedule.status,
        schedule.retryPolicy,
        schedule.governanceContext,
        schedule.createdBy,
        schedule.metadata ?? {},
        schedule.createdAt,
      ],
    );

    return this.mapSchedule(result.rows[0]);
  }

  async getSchedule(
    id: string,
  ): Promise<AiScheduleManifest | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM ai_schedules
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0]
      ? this.mapSchedule(result.rows[0])
      : null;
  }

  async listSchedules(
    filter: AiScheduleListFilter = {},
  ): Promise<AiScheduleManifest[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    const add = (
      sql: string,
      value: unknown,
    ): void => {
      values.push(value);
      conditions.push(
        sql.replace(
          "?",
          `$${values.length}`,
        ),
      );
    };

    if (filter.status) {
      add("status = ?", filter.status);
    }

    if (filter.commandName) {
      add(
        "command_name = ?",
        filter.commandName,
      );
    }

    if (filter.propertyId) {
      add(
        "governance_context ->> 'propertyId' = ?",
        filter.propertyId,
      );
    }

    if (filter.organizationId) {
      add(
        "governance_context ->> 'organizationId' = ?",
        filter.organizationId,
      );
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await this.pool.query(
      `
      SELECT *
      FROM ai_schedules
      ${where}
      ORDER BY created_at ASC, id ASC
      `,
      values,
    );

    return result.rows.map(
      (row) => this.mapSchedule(row),
    );
  }

  async updateScheduleStatus(
    id: string,
    status: AiScheduleStatus,
    updatedAt: string,
  ): Promise<AiScheduleManifest | null> {
    const result = await this.pool.query(
      `
      UPDATE ai_schedules
      SET
        status = $2,
        updated_at = $3
      WHERE id = $1
      RETURNING *
      `,
      [
        id,
        status,
        updatedAt,
      ],
    );

    return result.rows[0]
      ? this.mapSchedule(result.rows[0])
      : null;
  }

  async createOccurrence(
    occurrence: AiScheduledOccurrence,
  ): Promise<AiScheduledOccurrence> {
    const result = await this.pool.query(
      `
      INSERT INTO ai_schedule_occurrences
      (
        id,
        schedule_id,
        sequence,
        scheduled_for,
        status,
        attempt_count,
        next_attempt_at,
        worker_id,
        claimed_at,
        claim_expires_at,
        started_at,
        completed_at,
        outcome,
        error_code,
        error_message,
        created_at,
        updated_at
      )
      VALUES
      (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17
      )
      RETURNING *
      `,
      [
        occurrence.id,
        occurrence.scheduleId,
        occurrence.sequence,
        occurrence.scheduledFor,
        occurrence.status,
        occurrence.attemptCount,
        occurrence.nextAttemptAt ?? null,
        occurrence.workerId ?? null,
        occurrence.claimedAt ?? null,
        occurrence.claimExpiresAt ?? null,
        occurrence.startedAt ?? null,
        occurrence.completedAt ?? null,
        occurrence.outcome ?? null,
        occurrence.errorCode ?? null,
        occurrence.errorMessage ?? null,
        occurrence.createdAt,
        occurrence.updatedAt,
      ],
    );

    return this.mapOccurrence(
      result.rows[0],
    );
  }

  async getOccurrence(
    id: string,
  ): Promise<AiScheduledOccurrence | null> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM ai_schedule_occurrences
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0]
      ? this.mapOccurrence(result.rows[0])
      : null;
  }

  async findDueOccurrences(
    now: string,
    limit: number,
  ): Promise<AiScheduledOccurrence[]> {
    const result = await this.pool.query(
      `
      SELECT *
      FROM ai_schedule_occurrences
      WHERE
        (
          status = 'pending'
          AND scheduled_for <= $1
        )
        OR
        (
          status = 'retry_scheduled'
          AND next_attempt_at <= $1
        )
      ORDER BY
        COALESCE(
          next_attempt_at,
          scheduled_for
        ) ASC,
        sequence ASC,
        id ASC
      LIMIT $2
      `,
      [
        now,
        limit,
      ],
    );

    return result.rows.map(
      (row) =>
        this.mapOccurrence(row),
    );
  }

  async claimOccurrence(
    occurrenceId: string,
    claim: AiOccurrenceClaim,
  ): Promise<AiScheduledOccurrence | null> {
    const result = await this.pool.query(
      `
      UPDATE ai_schedule_occurrences
      SET
        status = 'claimed',
        worker_id = $2,
        claimed_at = $3,
        claim_expires_at = $4,
        updated_at = $3
      WHERE id = $1
        AND
        (
          status IN (
            'pending',
            'retry_scheduled'
          )
          OR
          (
            status = 'claimed'
            AND claim_expires_at < $3
          )
        )
      RETURNING *
      `,
      [
        occurrenceId,
        claim.workerId,
        claim.claimedAt,
        claim.claimExpiresAt,
      ],
    );

    return result.rows[0]
      ? this.mapOccurrence(result.rows[0])
      : null;
  }

  async updateOccurrence(
    occurrence: AiScheduledOccurrence,
  ): Promise<AiScheduledOccurrence> {
    const result = await this.pool.query(
      `
      UPDATE ai_schedule_occurrences
      SET
        status = $2,
        attempt_count = $3,
        next_attempt_at = $4,
        worker_id = $5,
        claimed_at = $6,
        claim_expires_at = $7,
        started_at = $8,
        completed_at = $9,
        outcome = $10,
        error_code = $11,
        error_message = $12,
        updated_at = $13
      WHERE id = $1
      RETURNING *
      `,
      [
        occurrence.id,
        occurrence.status,
        occurrence.attemptCount,
        occurrence.nextAttemptAt ?? null,
        occurrence.workerId ?? null,
        occurrence.claimedAt ?? null,
        occurrence.claimExpiresAt ?? null,
        occurrence.startedAt ?? null,
        occurrence.completedAt ?? null,
        occurrence.outcome ?? null,
        occurrence.errorCode ?? null,
        occurrence.errorMessage ?? null,
        occurrence.updatedAt,
      ],
    );

    return this.mapOccurrence(
      result.rows[0],
    );
  }

  async createAttempt(
    attempt: AiScheduleAttempt,
  ): Promise<AiScheduleAttempt> {
    const result = await this.pool.query(
      `
      INSERT INTO ai_schedule_attempts
      (
        id,
        occurrence_id,
        attempt_number,
        worker_id,
        status,
        retryable,
        error_code,
        error_message,
        outcome,
        started_at,
        completed_at
      )
      VALUES
      (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11
      )
      RETURNING *
      `,
      [
        attempt.id,
        attempt.occurrenceId,
        attempt.attemptNumber,
        attempt.workerId,
        attempt.status,
        attempt.retryable ?? null,
        attempt.errorCode ?? null,
        attempt.errorMessage ?? null,
        attempt.outcome ?? null,
        attempt.startedAt,
        attempt.completedAt ?? null,
      ],
    );

    return this.mapAttempt(
      result.rows[0],
    );
  }

  async updateAttempt(
    attempt: AiScheduleAttempt,
  ): Promise<AiScheduleAttempt> {
    const result = await this.pool.query(
      `
      UPDATE ai_schedule_attempts
      SET
        status = $2,
        retryable = $3,
        error_code = $4,
        error_message = $5,
        outcome = $6,
        completed_at = $7
      WHERE id = $1
      RETURNING *
      `,
      [
        attempt.id,
        attempt.status,
        attempt.retryable ?? null,
        attempt.errorCode ?? null,
        attempt.errorMessage ?? null,
        attempt.outcome ?? null,
        attempt.completedAt ?? null,
      ],
    );

    return this.mapAttempt(
      result.rows[0],
    );
  }

  async listExecutionHistory(
    filter: AiScheduleHistoryFilter = {},
  ): Promise<AiScheduledOccurrence[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (filter.scheduleId) {
      values.push(filter.scheduleId);
      conditions.push(
        `schedule_id = $${values.length}`,
      );
    }

    if (filter.occurrenceId) {
      values.push(filter.occurrenceId);
      conditions.push(
        `id = $${values.length}`,
      );
    }

    values.push(filter.limit ?? 100);

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await this.pool.query(
      `
      SELECT *
      FROM ai_schedule_occurrences
      ${where}
      ORDER BY
        scheduled_for DESC,
        sequence DESC,
        id DESC
      LIMIT $${values.length}
      `,
      values,
    );

    return result.rows.map(
      (row) =>
        this.mapOccurrence(row),
    );
  }

  private mapSchedule(
    row: any,
  ): AiScheduleManifest {
    return {
      id: row.id,
      name: row.name,
      description:
        row.description ?? undefined,
      commandName:
        row.command_name,
      commandPayload:
        row.command_payload ?? {},
      scheduleType:
        row.schedule_type,
      runAt:
        row.run_at
          ? new Date(row.run_at).toISOString()
          : undefined,
      intervalSeconds:
        row.interval_seconds ?? undefined,
      timezone:
        row.timezone,
      status:
        row.status,
      retryPolicy:
        row.retry_policy,
      governanceContext:
        row.governance_context ?? {},
      createdBy:
        row.created_by,
      createdAt:
        new Date(row.created_at).toISOString(),
      metadata:
        row.metadata ?? {},
    };
  }

  private mapOccurrence(
    row: any,
  ): AiScheduledOccurrence {
    const iso = (
      value: unknown,
    ): string | undefined =>
      value
        ? new Date(
            value as string | Date,
          ).toISOString()
        : undefined;

    return {
      id: row.id,
      scheduleId:
        row.schedule_id,
      sequence:
        Number(row.sequence),
      scheduledFor:
        new Date(
          row.scheduled_for,
        ).toISOString(),
      status:
        row.status,
      attemptCount:
        Number(row.attempt_count),
      nextAttemptAt:
        iso(row.next_attempt_at),
      workerId:
        row.worker_id ?? undefined,
      claimedAt:
        iso(row.claimed_at),
      claimExpiresAt:
        iso(row.claim_expires_at),
      startedAt:
        iso(row.started_at),
      completedAt:
        iso(row.completed_at),
      outcome:
        row.outcome ?? undefined,
      errorCode:
        row.error_code ?? undefined,
      errorMessage:
        row.error_message ?? undefined,
      createdAt:
        new Date(
          row.created_at,
        ).toISOString(),
      updatedAt:
        new Date(
          row.updated_at,
        ).toISOString(),
    };
  }

  private mapAttempt(
    row: any,
  ): AiScheduleAttempt {
    return {
      id: row.id,
      occurrenceId:
        row.occurrence_id,
      attemptNumber:
        Number(row.attempt_number),
      workerId:
        row.worker_id,
      status:
        row.status,
      retryable:
        row.retryable ?? undefined,
      errorCode:
        row.error_code ?? undefined,
      errorMessage:
        row.error_message ?? undefined,
      outcome:
        row.outcome ?? undefined,
      startedAt:
        new Date(
          row.started_at,
        ).toISOString(),
      completedAt:
        row.completed_at
          ? new Date(
              row.completed_at,
            ).toISOString()
          : undefined,
    };
  }
}
