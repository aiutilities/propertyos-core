import {
  CONTROLLED_DEPLOYMENT_MIGRATIONS,
} from './migration-readiness';

export interface SchemaAcceptanceSnapshot {
  appliedMigrations: string[];
  relations: string[];
  columns: string[];
  indexes: string[];
  constraints: string[];
  functions: string[];
  triggers: string[];
  corePluginCountBefore: number;
  corePluginCountAfter: number;
}

export interface SchemaAcceptanceResult {
  status: 'ACCEPTED' | 'REJECTED';
  applyAuthorized: false;
  missing: {
    migrations: string[];
    relations: string[];
    columns: string[];
    indexes: string[];
    constraints: string[];
    functions: string[];
    triggers: string[];
  };
  errors: string[];
}

export const REQUIRED_SCHEMA_ACCEPTANCE = {
  migrations:
    CONTROLLED_DEPLOYMENT_MIGRATIONS.map(
      (migration) => migration.name,
    ),
  relations: [
    'inventory_material_issues',
    'inventory_material_issue_items',
    'inventory_material_returns',
    'inventory_material_return_items',
    'inventory_batches',
    'inventory_batch_balances',
    'core_plugin_installation_attempts',
    'plugin_publishers',
    'plugin_publisher_keys',
    'plugin_publications',
    'plugin_publication_security_events',
    'plugin_publisher_trust_security_events',
  ],
  columns: [
    'inventory_stock_ledger.batch_id',
    'procurement_goods_receipt_items.batch_id',
    'procurement_goods_receipt_items.batch_number',
    'procurement_goods_receipt_items.manufacturer_batch_number',
    'procurement_goods_receipt_items.manufacture_date',
    'procurement_goods_receipt_items.expiry_date',
    'inventory_material_issue_items.batch_id',
    'inventory_material_return_items.batch_id',
    'inventory_stock_reservations.batch_id',
    'schema_migrations.checksum',
    'schema_migrations.rollback_checksum',
    'schema_migrations.migration_scope',
    'schema_migrations.plugin_name',
    'schema_migrations.plugin_version',
    'schema_migrations.reversible',
  ],
  indexes: [
    'uq_inventory_batch_balance_location',
    'idx_inventory_stock_ledger_batch',
    'idx_procurement_grn_items_batch',
    'idx_inventory_material_issue_items_batch',
    'uq_inventory_material_issue_item',
    'idx_inventory_material_return_items_batch',
    'uq_inventory_material_return_item',
    'idx_inventory_stock_reservations_batch',
    'idx_plugin_installation_attempts_status',
    'idx_plugin_installation_attempts_heartbeat',
    'idx_schema_migrations_plugin',
    'idx_plugin_publisher_keys_active',
    'idx_plugin_publications_discovery',
    'idx_plugin_publications_publisher',
    'idx_plugin_publication_events_publication',
    'idx_plugin_publisher_trust_events_publisher',
    'idx_plugin_publisher_trust_events_key',
  ],
  constraints: [
    'ck_inventory_material_issue_status',
    'ck_inventory_material_return_status',
    'ck_inventory_batch_status',
    'ck_procurement_grn_batch_reference',
    'chk_plugin_installation_attempt_status',
    'chk_plugin_installation_attempt_number',
    'chk_plugin_publisher_status',
    'chk_plugin_publisher_key_algorithm',
    'chk_plugin_publisher_key_status',
    'chk_plugin_publisher_key_validity',
    'uq_plugin_publication_version',
    'chk_plugin_publication_status',
    'chk_plugin_publication_artifact_sha256',
    'chk_plugin_publication_integrity_sha256',
    'chk_plugin_publication_event_type',
    'chk_plugin_publisher_trust_event_type',
  ],
  functions: [
    'prevent_plugin_publication_artifact_mutation',
  ],
  triggers: [
    'trg_plugin_publication_artifact_immutable',
  ],
} as const;

function missingValues(
  expected: readonly string[],
  actual: readonly string[],
): string[] {
  const actualSet = new Set(actual);

  return expected.filter(
    (value) => !actualSet.has(value),
  );
}

export function validateSchemaAcceptance(
  snapshot: SchemaAcceptanceSnapshot,
): SchemaAcceptanceResult {
  const missing = {
    migrations: missingValues(
      REQUIRED_SCHEMA_ACCEPTANCE.migrations,
      snapshot.appliedMigrations,
    ),
    relations: missingValues(
      REQUIRED_SCHEMA_ACCEPTANCE.relations,
      snapshot.relations,
    ),
    columns: missingValues(
      REQUIRED_SCHEMA_ACCEPTANCE.columns,
      snapshot.columns,
    ),
    indexes: missingValues(
      REQUIRED_SCHEMA_ACCEPTANCE.indexes,
      snapshot.indexes,
    ),
    constraints: missingValues(
      REQUIRED_SCHEMA_ACCEPTANCE.constraints,
      snapshot.constraints,
    ),
    functions: missingValues(
      REQUIRED_SCHEMA_ACCEPTANCE.functions,
      snapshot.functions,
    ),
    triggers: missingValues(
      REQUIRED_SCHEMA_ACCEPTANCE.triggers,
      snapshot.triggers,
    ),
  };

  const errors: string[] = [];

  for (
    const [category, values]
    of Object.entries(missing)
  ) {
    if (values.length > 0) {
      errors.push(
        `Missing ${category}: ${values.join(', ')}`,
      );
    }
  }

  if (
    snapshot.corePluginCountAfter !==
    snapshot.corePluginCountBefore
  ) {
    errors.push(
      'core_plugins row count changed during rollout',
    );
  }

  return {
    status:
      errors.length === 0
        ? 'ACCEPTED'
        : 'REJECTED',
    applyAuthorized: false,
    missing,
    errors,
  };
}
