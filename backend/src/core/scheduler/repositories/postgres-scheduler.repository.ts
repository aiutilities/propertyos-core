import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/postgres/postgres.types';
import { SchedulerRepository } from './scheduler.repository';
import {
  SchedulerJob,
  SchedulerJobCreateOrResolveResult,
  SchedulerJobStatus,
  SchedulerScheduleType,
} from '../types/scheduler.types';

@Injectable()
export class PostgresSchedulerRepository implements SchedulerRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async create(job: SchedulerJob): Promise<SchedulerJob> {
    const result = await this.pool.query(
      `
      INSERT INTO scheduler_jobs (
        id, name, job_type, status, payload, schedule_type,
        run_at, cron_expression, last_run_at, next_run_at,
        attempts, max_attempts, error_message, idempotency_key,
        created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *
      `,
      [
        job.id,
        job.name,
        job.jobType,
        job.status,
        JSON.stringify(job.payload ?? {}),
        job.scheduleType,
        job.runAt ?? null,
        job.cronExpression ?? null,
        job.lastRunAt ?? null,
        job.nextRunAt ?? null,
        job.attempts,
        job.maxAttempts,
        job.errorMessage ?? null,
        job.idempotencyKey ?? null,
        job.createdAt,
        job.updatedAt,
      ],
    );

    return this.mapJob(result.rows[0]);
  }

  async createOrResolve(
    job: SchedulerJob,
  ): Promise<SchedulerJobCreateOrResolveResult> {
    const idempotencyKey =
      job.idempotencyKey?.trim();

    if (!idempotencyKey) {
      throw new Error(
        "Scheduler job idempotency key is required",
      );
    }

    if (idempotencyKey.length > 500) {
      throw new Error(
        "Scheduler job idempotency key exceeds 500 characters",
      );
    }

    const inserted =
      await this.pool.query(
        `
        INSERT INTO scheduler_jobs (
          id, name, job_type, status, payload, schedule_type,
          run_at, cron_expression, last_run_at, next_run_at,
          attempts, max_attempts, error_message, idempotency_key,
          created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
        ON CONFLICT (idempotency_key)
          WHERE idempotency_key IS NOT NULL
        DO NOTHING
        RETURNING *
        `,
        [
          job.id,
          job.name,
          job.jobType,
          job.status,
          JSON.stringify(
            job.payload ?? {},
          ),
          job.scheduleType,
          job.runAt ?? null,
          job.cronExpression ?? null,
          job.lastRunAt ?? null,
          job.nextRunAt ?? null,
          job.attempts,
          job.maxAttempts,
          job.errorMessage ?? null,
          idempotencyKey,
          job.createdAt,
          job.updatedAt,
        ],
      );

    if (inserted.rows[0]) {
      return {
        job: this.mapJob(
          inserted.rows[0],
        ),
        created: true,
      };
    }

    const existing =
      await this.pool.query(
        `
        SELECT *
        FROM scheduler_jobs
        WHERE idempotency_key = $1
        LIMIT 1
        `,
        [idempotencyKey],
      );

    if (!existing.rows[0]) {
      throw new Error(
        "Scheduler job idempotency conflict could not be resolved",
      );
    }

    const resolved =
      this.mapJob(
        existing.rows[0],
      );

    if (
      resolved.idempotencyKey !==
      idempotencyKey
    ) {
      throw new Error(
        "Resolved scheduler job idempotency key mismatch",
      );
    }

    return {
      job: resolved,
      created: false,
    };
  }

  async findById(id: string): Promise<SchedulerJob | null> {
    const result = await this.pool.query(
      `SELECT * FROM scheduler_jobs WHERE id = $1`,
      [id],
    );

    return result.rows[0] ? this.mapJob(result.rows[0]) : null;
  }

  async list(): Promise<SchedulerJob[]> {
    const result = await this.pool.query(
      `SELECT * FROM scheduler_jobs ORDER BY created_at DESC`,
    );

    return result.rows.map((row) => this.mapJob(row));
  }

  async updateStatus(
    id: string,
    status: SchedulerJobStatus,
    errorMessage?: string,
  ): Promise<SchedulerJob> {
    const result = await this.pool.query(
      `
      UPDATE scheduler_jobs
      SET
        status = $2::varchar,
        error_message = $3,
        last_run_at = CASE
          WHEN $2::varchar IN ('COMPLETED', 'FAILED') THEN NOW()
          ELSE last_run_at
        END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id, status, errorMessage ?? null],
    );

    return this.mapJob(result.rows[0]);
  }

  async incrementAttempts(id: string): Promise<void> {
    await this.pool.query(
      `
      UPDATE scheduler_jobs
      SET attempts = attempts + 1, updated_at = NOW()
      WHERE id = $1
      `,
      [id],
    );
  }

  async claimDueOneTimeJobs(
    limit: number,
  ): Promise<SchedulerJob[]> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      const result = await client.query(
        `
        WITH due_jobs AS (
          SELECT id
          FROM scheduler_jobs
          WHERE schedule_type = 'ONE_TIME'
            AND status IN ('PENDING', 'FAILED')
            AND attempts < max_attempts
            AND COALESCE(next_run_at, run_at) IS NOT NULL
            AND COALESCE(next_run_at, run_at) <= NOW()
          ORDER BY COALESCE(next_run_at, run_at) ASC,
                   created_at ASC
          FOR UPDATE SKIP LOCKED
          LIMIT $1
        )
        UPDATE scheduler_jobs job
        SET status = 'RUNNING',
            attempts = job.attempts + 1,
            error_message = NULL,
            updated_at = NOW()
        FROM due_jobs
        WHERE job.id = due_jobs.id
        RETURNING job.*
        `,
        [Math.max(1, limit)],
      );

      await client.query('COMMIT');

      return result.rows.map((row) => this.mapJob(row));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async completeClaimedJob(
    id: string,
  ): Promise<SchedulerJob> {
    const result = await this.pool.query(
      `
      UPDATE scheduler_jobs
      SET status = 'COMPLETED',
          last_run_at = NOW(),
          next_run_at = NULL,
          error_message = NULL,
          updated_at = NOW()
      WHERE id = $1
        AND status = 'RUNNING'
      RETURNING *
      `,
      [id],
    );

    if (!result.rows[0]) {
      throw new Error(
        `Claimed scheduler job not found or not running: ${id}`,
      );
    }

    return this.mapJob(result.rows[0]);
  }

  async failClaimedJob(
    id: string,
    errorMessage: string,
    retryAt?: Date,
  ): Promise<SchedulerJob> {
    const result = await this.pool.query(
      `
      UPDATE scheduler_jobs
      SET status = 'FAILED',
          last_run_at = NOW(),
          next_run_at = CASE
            WHEN attempts < max_attempts THEN $3
            ELSE NULL
          END,
          error_message = $2,
          updated_at = NOW()
      WHERE id = $1
        AND status = 'RUNNING'
      RETURNING *
      `,
      [id, errorMessage, retryAt ?? null],
    );

    if (!result.rows[0]) {
      throw new Error(
        `Claimed scheduler job not found or not running: ${id}`,
      );
    }

    return this.mapJob(result.rows[0]);
  }

  async recoverStaleRunningJobs(
    staleBefore: Date,
  ): Promise<number> {
    const result = await this.pool.query(
      `
      UPDATE scheduler_jobs
      SET status = 'FAILED',
          next_run_at = CASE
            WHEN attempts < max_attempts THEN NOW()
            ELSE NULL
          END,
          error_message = 'Recovered after stale RUNNING state',
          updated_at = NOW()
      WHERE status = 'RUNNING'
        AND updated_at < $1
      `,
      [staleBefore],
    );

    return result.rowCount ?? 0;
  }

  private mapJob(row: any): SchedulerJob {
    return {
      id: row.id,
      name: row.name,
      jobType: row.job_type,
      status: row.status as SchedulerJobStatus,
      payload: row.payload ?? {},
      scheduleType: row.schedule_type as SchedulerScheduleType,
      runAt: row.run_at ?? undefined,
      cronExpression: row.cron_expression ?? undefined,
      lastRunAt: row.last_run_at ?? undefined,
      nextRunAt: row.next_run_at ?? undefined,
      attempts: Number(row.attempts),
      maxAttempts: Number(row.max_attempts),
      errorMessage: row.error_message ?? undefined,
      idempotencyKey: row.idempotency_key ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
