import { createHash } from 'crypto';
import { MigrationFile } from './migration-loader';

export interface ControlledMigrationDefinition {
  name: string;
  sha256: string;
  dependsOn: string[];
  transactional: true;
  reversible: false;
  recovery: 'BACKUP_RESTORE';
  purpose: string;
}

export interface MigrationReadinessItem
  extends ControlledMigrationDefinition {
  actualSha256: string | null;
  present: boolean;
  order: number | null;
  ready: boolean;
  errors: string[];
}

export interface MigrationReadinessReport {
  status: 'READY' | 'BLOCKED';
  scope: 'PHASE_13D_PLUGIN_TRUST_ROLLOUT';
  databaseTouched: false;
  applyAuthorized: false;
  generatedAt: string;
  requiredOrder: string[];
  requirements: {
    backupEvidenceRequired: true;
    restoreExerciseRequired: true;
    isolatedEnvironmentFirst: true;
    explicitProductionAuthorizationRequired: true;
  };
  migrations: MigrationReadinessItem[];
  errors: string[];
}

export const CONTROLLED_PLUGIN_TRUST_MIGRATIONS:
  readonly ControlledMigrationDefinition[] = [
  {
    name: 'core/044-create-plugin-installation-attempts.sql',
    sha256:
      '713db15f25b656fdfc1f7ec80e646ece27fe287bb4d220bab777ae8c3a580d12',
    dependsOn: [],
    transactional: true,
    reversible: false,
    recovery: 'BACKUP_RESTORE',
    purpose: 'Durable and replay-safe plugin installation coordination',
  },
  {
    name: 'core/045-add-plugin-migration-integrity.sql',
    sha256:
      '141b981413f399f6468c1fe888cc42fd2fd7c1940ee9cebcf7db149ec7294767',
    dependsOn: ['core/044-create-plugin-installation-attempts.sql'],
    transactional: true,
    reversible: false,
    recovery: 'BACKUP_RESTORE',
    purpose: 'Checksums and provenance for plugin migration records',
  },
  {
    name: 'core/046-create-plugin-publisher-trust.sql',
    sha256:
      '7b2d6694f0d5659c447da961689e7360a8611b140bd91eaec1c7fa0db7cf6bb0',
    dependsOn: [],
    transactional: true,
    reversible: false,
    recovery: 'BACKUP_RESTORE',
    purpose: 'Trusted publisher and public-key registry',
  },
  {
    name: 'core/047-create-plugin-publication-governance.sql',
    sha256:
      '6eb0c306d8679b8d9a333b6cd52e9ffcf07c33772673c963e326dc83bc335511',
    dependsOn: ['core/046-create-plugin-publisher-trust.sql'],
    transactional: true,
    reversible: false,
    recovery: 'BACKUP_RESTORE',
    purpose: 'Immutable governed plugin publications and security events',
  },
  {
    name: 'core/048-create-plugin-trust-security-events.sql',
    sha256:
      '93f8d23f34fffae8fe1a33a9f70987f612e93634f173cc31668fa7d253ecfeeb',
    dependsOn: ['core/046-create-plugin-publisher-trust.sql'],
    transactional: true,
    reversible: false,
    recovery: 'BACKUP_RESTORE',
    purpose: 'Auditable publisher and signing-key lifecycle events',
  },
] as const;

export function migrationSha256(sql: string): string {
  return createHash('sha256')
    .update(sql, 'utf8')
    .digest('hex');
}

export function buildMigrationReadinessReport(
  migrations: readonly MigrationFile[],
  generatedAt = new Date().toISOString(),
): MigrationReadinessReport {
  const byName = new Map(
    migrations.map((migration, order) => [
      migration.name,
      { migration, order },
    ]),
  );

  const items = CONTROLLED_PLUGIN_TRUST_MIGRATIONS.map(
    (definition): MigrationReadinessItem => {
      const loaded = byName.get(definition.name);
      const errors: string[] = [];
      const actualSha256 = loaded
        ? migrationSha256(loaded.migration.sql)
        : null;

      if (!loaded) {
        errors.push(`Missing migration: ${definition.name}`);
      } else if (actualSha256 !== definition.sha256) {
        errors.push(
          `Checksum mismatch for ${definition.name}: ` +
            `expected ${definition.sha256}, received ${actualSha256}`,
        );
      }

      if (loaded) {
        for (const dependency of definition.dependsOn) {
          const dependencyEntry = byName.get(dependency);

          if (!dependencyEntry) {
            errors.push(
              `Missing dependency ${dependency} required by ` +
                definition.name,
            );
          } else if (dependencyEntry.order >= loaded.order) {
            errors.push(
              `Dependency order violation: ${dependency} must precede ` +
                definition.name,
            );
          }
        }
      }

      return {
        ...definition,
        actualSha256,
        present: Boolean(loaded),
        order: loaded?.order ?? null,
        ready: errors.length === 0,
        errors,
      };
    },
  );

  const errors = items.flatMap((item) => item.errors);

  return {
    status: errors.length === 0 ? 'READY' : 'BLOCKED',
    scope: 'PHASE_13D_PLUGIN_TRUST_ROLLOUT',
    databaseTouched: false,
    applyAuthorized: false,
    generatedAt,
    requiredOrder: CONTROLLED_PLUGIN_TRUST_MIGRATIONS.map(
      (migration) => migration.name,
    ),
    requirements: {
      backupEvidenceRequired: true,
      restoreExerciseRequired: true,
      isolatedEnvironmentFirst: true,
      explicitProductionAuthorizationRequired: true,
    },
    migrations: items,
    errors,
  };
}
