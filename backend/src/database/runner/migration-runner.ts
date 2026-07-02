import { Pool } from 'pg';
import { loadMigrationFiles } from './migration-loader';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: Number(process.env.POSTGRES_PORT || 5433),
  database: process.env.POSTGRES_DB || 'propertyos',
  user: process.env.POSTGRES_USER || 'propertyos',
  password: process.env.POSTGRES_PASSWORD || 'propertyos',
});

async function ensureMigrationTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(500) NOT NULL UNIQUE,
      executed_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
}

async function hasMigrationRun(name: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM schema_migrations WHERE name = $1 LIMIT 1',
    [name],
  );

  return result.rowCount > 0;
}

async function recordMigration(name: string): Promise<void> {
  await pool.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
}

async function runMigrations(): Promise<void> {
  await ensureMigrationTable();

  const migrations = loadMigrationFiles();

  console.log(`Found ${migrations.length} migration(s).`);

  for (const migration of migrations) {
    const alreadyRun = await hasMigrationRun(migration.name);

    if (alreadyRun) {
      console.log(`SKIP ${migration.name}`);
      continue;
    }

    console.log(`RUN  ${migration.name}`);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(migration.sql);
      await client.query(
        'INSERT INTO schema_migrations (name) VALUES ($1)',
        [migration.name],
      );
      await client.query('COMMIT');

      console.log(`DONE ${migration.name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`FAIL ${migration.name}`);
      throw error;
    } finally {
      client.release();
    }
  }

  console.log('Migration run complete.');
}

runMigrations()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
