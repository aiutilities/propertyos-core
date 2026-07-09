import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';

import { POSTGRES_POOL } from '../../../database/postgres';
import { MetricSample } from '../types/metric.types';
import { MetricsRepository } from './metrics.repository';

@Injectable()
export class PostgresMetricsRepository implements MetricsRepository {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async saveSample(sample: MetricSample): Promise<MetricSample> {
    const result = await this.pool.query(
      `
      INSERT INTO metric_samples (
        id, metric_name, metric_type, help, labels, value, sampled_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING *
      `,
      [
        randomUUID(),
        sample.name,
        sample.type,
        sample.help,
        JSON.stringify(sample.labels ?? {}),
        sample.value,
        sample.timestamp,
      ],
    );

    return this.mapSample(result.rows[0]);
  }

  async listSamples(filters: {
    name?: string;
    type?: MetricSample['type'];
    limit?: number;
  } = {}): Promise<MetricSample[]> {
    const clauses: string[] = [];
    const values: unknown[] = [];

    if (filters.name) {
      values.push(filters.name);
      clauses.push(`metric_name = $${values.length}`);
    }

    if (filters.type) {
      values.push(filters.type);
      clauses.push(`metric_type = $${values.length}`);
    }

    values.push(filters.limit ?? 100);
    const limitParam = `$${values.length}`;
    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const result = await this.pool.query(
      `
      SELECT *
      FROM metric_samples
      ${whereSql}
      ORDER BY sampled_at DESC
      LIMIT ${limitParam}
      `,
      values,
    );

    return result.rows.map((row) => this.mapSample(row));
  }

  async clearSamples(): Promise<void> {
    await this.pool.query(`DELETE FROM metric_samples`);
  }

  private mapSample(row: any): MetricSample {
    return {
      name: row.metric_name,
      type: row.metric_type,
      help: row.help,
      labels:
        typeof row.labels === 'string'
          ? JSON.parse(row.labels)
          : row.labels ?? {},
      value: Number(row.value),
      timestamp: new Date(row.sampled_at).toISOString(),
    };
  }
}
