CREATE TABLE IF NOT EXISTS storage_objects (
    id UUID PRIMARY KEY,
    provider VARCHAR(50) NOT NULL,
    bucket VARCHAR(255),
    object_key TEXT NOT NULL,
    original_name VARCHAR(255),
    mime_type VARCHAR(255),
    size_bytes BIGINT NOT NULL DEFAULT 0,
    checksum VARCHAR(255),
    entity_type VARCHAR(100),
    entity_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_objects_provider
ON storage_objects(provider);

CREATE INDEX IF NOT EXISTS idx_storage_objects_entity
ON storage_objects(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_storage_objects_object_key
ON storage_objects(object_key);
