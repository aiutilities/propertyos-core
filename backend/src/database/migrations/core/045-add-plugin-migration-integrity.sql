ALTER TABLE schema_migrations
ADD COLUMN IF NOT EXISTS checksum VARCHAR(64),
ADD COLUMN IF NOT EXISTS rollback_checksum VARCHAR(64),
ADD COLUMN IF NOT EXISTS migration_scope VARCHAR(30),
ADD COLUMN IF NOT EXISTS plugin_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS plugin_version VARCHAR(50),
ADD COLUMN IF NOT EXISTS reversible BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS
idx_schema_migrations_plugin
ON schema_migrations(
    plugin_name,
    plugin_version
)
WHERE migration_scope = 'PLUGIN';
