CREATE TABLE IF NOT EXISTS configuration_settings (
    id UUID PRIMARY KEY,
    scope_type VARCHAR(50) NOT NULL,
    scope_id UUID NULL,
    key VARCHAR(255) NOT NULL,
    value JSONB NOT NULL,
    value_type VARCHAR(50) NOT NULL DEFAULT 'JSON',
    description TEXT,
    is_secret BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_configuration_scope_key
ON configuration_settings (
    scope_type,
    COALESCE(scope_id, '00000000-0000-0000-0000-000000000000'::uuid),
    key
);
