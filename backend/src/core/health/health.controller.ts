import { Controller, Get, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from '../../database/postgres';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  @Get()
  getHealth() {
    return {
      status: 'ok',
      service: 'propertyos-api',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('database')
  async getDatabaseHealth() {
    const result = await this.pool.query('SELECT NOW() as now');

    return {
      status: 'ok',
      database: 'postgres',
      timestamp: result.rows[0].now,
    };
  }
}
