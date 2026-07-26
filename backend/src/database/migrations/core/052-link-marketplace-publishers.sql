ALTER TABLE marketplace_plugins
ADD COLUMN IF NOT EXISTS publisher_id VARCHAR(100)
    REFERENCES plugin_publishers(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS
idx_marketplace_plugins_publisher
ON marketplace_plugins(
    publisher_id,
    published_at DESC
);
