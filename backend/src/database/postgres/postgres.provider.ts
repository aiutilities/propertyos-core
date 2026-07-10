import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from './postgres.types';

export const PostgresProvider: Provider = {
  provide: POSTGRES_POOL,
  useFactory: () => {
    return new Pool({
      host: process.env.POSTGRES_HOST || '127.0.0.1',
      port: Number(process.env.POSTGRES_PORT || 5433),
      database: process.env.POSTGRES_DB || 'propertyos',
      user: process.env.POSTGRES_USER || 'propertyos',
      password: process.env.POSTGRES_PASSWORD || 'propertyos',
    });
  },
};
