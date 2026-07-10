import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from './postgres.types';

@Injectable()
export class PostgresShutdownService implements OnApplicationShutdown {
  private closed = false;

  constructor(
    @Inject(POSTGRES_POOL)
    private readonly pool: Pool,
  ) {}

  async onApplicationShutdown() {
    if (this.closed) {
      return;
    }

    this.closed = true;

    try {
      await this.pool.end();
    } catch {
      // Ignore repeated shutdowns during tests.
    }
  }
}
