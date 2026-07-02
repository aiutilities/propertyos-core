import { Provider } from '@nestjs/common';
import { Pool } from 'pg';
import { POSTGRES_POOL } from './postgres.types';

export const PostgresProvider: Provider = {
  provide: POSTGRES_POOL,
  useFactory: () => {
    return new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT || 5432),
      database: process.env.POSTGRES_DB || 'propertyos',
      user: process.env.POSTGRES_USER || 'propertyos',
      password: process.env.POSTGRES_PASSWORD || 'propertyos',
    });
  },
};
