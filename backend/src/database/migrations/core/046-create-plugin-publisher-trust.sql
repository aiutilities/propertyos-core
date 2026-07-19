CREATE TABLE IF NOT EXISTS plugin_publishers (
    id VARCHAR(100) PRIMARY KEY,
    display_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    CONSTRAINT chk_plugin_publisher_status
        CHECK (
            status IN (
                'ACTIVE',
                'SUSPENDED',
                'REVOKED'
            )
        )
);

CREATE TABLE IF NOT EXISTS plugin_publisher_keys (
    key_id VARCHAR(150) PRIMARY KEY,
    publisher_id VARCHAR(100) NOT NULL
        REFERENCES plugin_publishers(id),
    algorithm VARCHAR(30) NOT NULL,
    public_key_pem TEXT NOT NULL,
    fingerprint_sha256 VARCHAR(64) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    CONSTRAINT chk_plugin_publisher_key_algorithm
        CHECK (
            algorithm IN (
                'RSA-SHA256'
            )
        ),
    CONSTRAINT chk_plugin_publisher_key_status
        CHECK (
            status IN (
                'ACTIVE',
                'REVOKED'
            )
        ),
    CONSTRAINT chk_plugin_publisher_key_validity
        CHECK (
            valid_until IS NULL
            OR valid_until > valid_from
        )
);

CREATE INDEX IF NOT EXISTS
idx_plugin_publisher_keys_active
ON plugin_publisher_keys(
    publisher_id,
    status,
    valid_from,
    valid_until
);
