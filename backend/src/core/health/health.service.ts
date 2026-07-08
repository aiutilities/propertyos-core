import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigurationService } from '../configuration';
import { PluginService } from '../plugin';
import { PluginLoaderService } from '../plugin/loader/plugin-loader.service';
import { SchedulerService } from '../scheduler';
import { StorageService } from '../storage';
import { POSTGRES_POOL } from '../../database/postgres';

type HealthCheckStatus = 'ok' | 'error';

interface HealthCheckResult {
  status: HealthCheckStatus;
  latencyMs?: number;
  error?: string;
  details?: Record<string, unknown>;
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
    private readonly pluginLoaderService: PluginLoaderService,
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
      configuration: this.checkConfiguration(),
      scheduler: this.checkScheduler(),
      storage: this.checkStorage(),
      plugins: this.checkPlugins(),
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
      details: {
        uptimeSeconds: Math.floor(process.uptime()),
        pid: process.pid,
      },
    };
  }

  private checkConfiguration(): HealthCheckResult {
    if (!this.configurationService) {
      return {
        status: 'error',
        error: 'configuration service is not available',
      };
    }

    return {
      status: 'ok',
      latencyMs: 0,
      details: {
        service: 'available',
      },
    };
  }

  private checkScheduler(): HealthCheckResult {
    if (!this.schedulerService) {
      return {
        status: 'error',
        error: 'scheduler service is not available',
      };
    }

    const handlers = this.schedulerService.listHandlers();

    return {
      status: 'ok',
      latencyMs: 0,
      details: {
        registeredHandlers: handlers.length,
        handlers,
      },
    };
  }

  private checkStorage(): HealthCheckResult {
    if (!this.storageService) {
      return {
        status: 'error',
        error: 'storage service is not available',
      };
    }

    return {
      status: 'ok',
      latencyMs: 0,
      details: {
        service: 'available',
      },
    };
  }

  private checkPlugins(): HealthCheckResult {
    if (!this.pluginService || !this.pluginLoaderService) {
      return {
        status: 'error',
        error: 'plugin services are not available',
      };
    }

    const plugins = this.pluginLoaderService.listPlugins();
    const activePlugins = plugins.filter((plugin) => plugin.status === 'ACTIVE');
    const failedPlugins = plugins.filter((plugin) => plugin.status === 'FAILED');

    return {
      status: failedPlugins.length === 0 ? 'ok' : 'error',
      latencyMs: 0,
      details: {
        totalPlugins: plugins.length,
        activePlugins: activePlugins.length,
        failedPlugins: failedPlugins.length,
        failedPluginIds: failedPlugins.map((plugin) => plugin.manifest.id),
      },
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
