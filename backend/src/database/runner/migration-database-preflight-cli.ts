import { Pool } from 'pg';
import { loadMigrationFiles } from './migration-loader';
import {
  buildMigrationReadinessReport,
} from './migration-readiness';
import {
  runDatabasePreflight,
} from './migration-database-preflight';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: Number(process.env.POSTGRES_PORT || 5433),
  database: process.env.POSTGRES_DB || 'propertyos',
  user: process.env.POSTGRES_USER || 'propertyos',
  password:
    process.env.POSTGRES_PASSWORD || 'propertyos',
});

async function main(): Promise<void> {
  const staticReport =
    buildMigrationReadinessReport(
      loadMigrationFiles(),
    );

  if (staticReport.status !== 'READY') {
    process.stdout.write(
      `${JSON.stringify({
        status: 'BLOCKED',
        static: staticReport,
        database: null,
      }, null, 2)}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const client = await pool.connect();

  try {
    await client.query(
      'BEGIN TRANSACTION READ ONLY',
    );
    await client.query(
      "SET LOCAL statement_timeout = '10s'",
    );

    const databaseReport =
      await runDatabasePreflight(
        client,
        loadMigrationFiles().map(
          (migration) => migration.name,
        ),
      );

    const report = {
      status:
        databaseReport.status === 'READY'
          ? 'READY'
          : 'BLOCKED',
      scope: 'PHASE_13D_COMBINED_PREFLIGHT',
      databaseMutated: false,
      applyAuthorized: false,
      static: staticReport,
      database: databaseReport,
    };

    process.stdout.write(
      `${JSON.stringify(report, null, 2)}\n`,
    );

    if (report.status !== 'READY') {
      process.exitCode = 1;
    }
  } finally {
    await client.query('ROLLBACK');
    client.release();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
