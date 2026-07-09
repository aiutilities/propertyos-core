CREATE TABLE IF NOT EXISTS access_credentials (
    id UUID PRIMARY KEY,
    credential_type VARCHAR(50) NOT NULL,
    subject_type VARCHAR(100) NOT NULL,
    subject_id UUID NOT NULL,
    issued_to_person_id UUID NULL,
    issued_by_person_id UUID NULL,
    property_id UUID NULL,
    space_id UUID NULL,
    token_hash VARCHAR(128) NOT NULL UNIQUE,
    display_value TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    valid_from TIMESTAMP NULL,
    valid_until TIMESTAMP NULL,
    max_uses INTEGER NULL,
    use_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS access_credential_usage (
    id UUID PRIMARY KEY,
    credential_id UUID NOT NULL,
    used_at TIMESTAMP NOT NULL DEFAULT NOW(),
    used_by_person_id UUID NULL,
    property_id UUID NULL,
    space_id UUID NULL,
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    CONSTRAINT fk_access_credential_usage_credential
        FOREIGN KEY (credential_id)
        REFERENCES access_credentials(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_access_credentials_type ON access_credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_access_credentials_subject ON access_credentials(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_access_credentials_property ON access_credentials(property_id);
CREATE INDEX IF NOT EXISTS idx_access_credentials_status ON access_credentials(status);
CREATE INDEX IF NOT EXISTS idx_access_credentials_valid_until ON access_credentials(valid_until);
CREATE INDEX IF NOT EXISTS idx_access_credential_usage_credential ON access_credential_usage(credential_id);
CREATE INDEX IF NOT EXISTS idx_access_credential_usage_used_at ON access_credential_usage(used_at);
