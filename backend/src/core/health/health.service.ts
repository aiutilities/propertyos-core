import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigurationService } from '../configuration';
import { PluginService } from '../plugin';
import { SchedulerService } from '../scheduler';
import { StorageService } from '../storage';
import { POSTGRES_POOL } from '../../database/postgres';

type HealthCheckStatus = 'ok' | 'error';

interface HealthCheckResult {
  status: HealthCheckStatus;
  latencyMs?: number;
  error?: string;
}

@Injectable()
export class HealthService {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
    private readonly configurationService: ConfigurationService,
    private readonly schedulerService: SchedulerService,
    private readonly storageService: StorageService,
    private readonly pluginService: PluginService,
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
      process: this.checkProcess(),
      configuration: this.checkProvider(
        'configuration',
        this.configurationService,
      ),
      scheduler: this.checkProvider('scheduler', this.schedulerService),
      storage: this.checkProvider('storage', this.storageService),
      plugins: this.checkProvider('plugins', this.pluginService),
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

  private checkProcess(): HealthCheckResult {
    return {
      status: 'ok',
      latencyMs: 0,
    };
  }

  private checkProvider(name: string, provider: unknown): HealthCheckResult {
    if (!provider) {
      return {
        status: 'error',
        error: `${name} provider is not available`,
      };
    }

    return {
      status: 'ok',
      latencyMs: 0,
    };
  }

  private async checkDatabase(): Promise<HealthCheckResult> {
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
