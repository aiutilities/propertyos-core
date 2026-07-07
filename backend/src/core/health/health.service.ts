import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../database/postgres';

@Injectable()
export class HealthService {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  getHealth() {
    return {
      status: 'ok',
      service: 'propertyos-api',
      timestamp: new Date().toISOString(),
    };
  }

  getLiveness() {
    const memoryUsage = process.memoryUsage();

    return {
      status: 'ok',
      service: 'propertyos-api',
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        rss: memoryUsage.rss,
        heapTotal: memoryUsage.heapTotal,
        heapUsed: memoryUsage.heapUsed,
        external: memoryUsage.external,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    const checks = {
      database: await this.checkDatabase(),
      process: {
        status: 'ok',
      },
    };

    const status = Object.values(checks).every((check) => check.status === 'ok')
      ? 'ok'
      : 'degraded';

    return {
      status,
      service: 'propertyos-api',
      checks,
      timestamp: new Date().toISOString(),
    };
  }

  async getDatabaseHealth() {
    const result = await this.pool.query('SELECT NOW() as now');

    return {
      status: 'ok',
      database: 'postgres',
      timestamp: result.rows[0].now,
    };
  }

  private async checkDatabase(): Promise<{
    status: 'ok' | 'error';
    latencyMs?: number;
    error?: string;
  }> {
    const startedAt = Date.now();

    try {
      await this.pool.query('SELECT 1');
      return {
        status: 'ok',
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        status: 'error',
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }
}
