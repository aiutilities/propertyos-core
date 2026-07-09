import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../../database/postgres/postgres.types';
import { SchedulerRepository } from './scheduler.repository';
import {
  SchedulerJob,
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
        attempts, max_attempts, error_message, created_at, updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
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
        job.createdAt,
        job.updatedAt,
      ],
    );

    return this.mapJob(result.rows[0]);
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
