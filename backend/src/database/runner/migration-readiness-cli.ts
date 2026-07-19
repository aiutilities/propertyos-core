import { loadMigrationFiles } from './migration-loader';
import { buildMigrationReadinessReport } from './migration-readiness';

function main(): void {
  const report = buildMigrationReadinessReport(
    loadMigrationFiles(),
  );

  process.stdout.write(
    `${JSON.stringify(report, null, 2)}\n`,
  );

  if (report.status !== 'READY') {
    process.exitCode = 1;
  }
}

main();
