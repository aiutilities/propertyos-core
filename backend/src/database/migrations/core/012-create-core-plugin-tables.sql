CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS core_plugins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    version VARCHAR(30) NOT NULL,
    description TEXT,
    author VARCHAR(200),
    manifest JSONB NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'INSTALLED',
    installed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    activated_at TIMESTAMP,
    deactivated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_core_plugins_status
ON core_plugins(status);

CREATE INDEX IF NOT EXISTS idx_core_plugins_name
ON core_plugins(name);
