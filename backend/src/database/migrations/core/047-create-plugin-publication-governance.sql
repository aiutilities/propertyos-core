CREATE TABLE IF NOT EXISTS plugin_publications (
    id UUID PRIMARY KEY,
    plugin_id VARCHAR(150) NOT NULL,
    plugin_name VARCHAR(200) NOT NULL,
    version VARCHAR(50) NOT NULL,
    publisher_id VARCHAR(100) NOT NULL
        REFERENCES plugin_publishers(id),
    key_id VARCHAR(150) NOT NULL
        REFERENCES plugin_publisher_keys(key_id),
    artifact_storage_object_id UUID NOT NULL,
    artifact_sha256 VARCHAR(64) NOT NULL,
    integrity_sha256 VARCHAR(64) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
    submitted_by VARCHAR(150) NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_by VARCHAR(150),
    reviewed_at TIMESTAMPTZ,
    decision_reason TEXT,
    quarantined_by VARCHAR(150),
    quarantined_at TIMESTAMPTZ,
    quarantine_reason TEXT,
    revoked_by VARCHAR(150),
    revoked_at TIMESTAMPTZ,
    revocation_reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_plugin_publication_version
        UNIQUE (
            plugin_id,
            version
        ),
    CONSTRAINT chk_plugin_publication_status
        CHECK (
            status IN (
                'SUBMITTED',
                'APPROVED',
                'REJECTED',
                'QUARANTINED',
                'REVOKED'
            )
        ),
    CONSTRAINT chk_plugin_publication_artifact_sha256
        CHECK (
            artifact_sha256 ~ '^[a-f0-9]{64}$'
        ),
    CONSTRAINT chk_plugin_publication_integrity_sha256
        CHECK (
            integrity_sha256 ~ '^[a-f0-9]{64}$'
        )
);

CREATE INDEX IF NOT EXISTS
idx_plugin_publications_discovery
ON plugin_publications(
    status,
    plugin_id,
    version
);

CREATE INDEX IF NOT EXISTS
idx_plugin_publications_publisher
ON plugin_publications(
    publisher_id,
    submitted_at DESC
);

CREATE TABLE IF NOT EXISTS
plugin_publication_security_events (
    id UUID PRIMARY KEY,
    publication_id UUID NOT NULL
        REFERENCES plugin_publications(id),
    event_type VARCHAR(60) NOT NULL,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    actor_id VARCHAR(150) NOT NULL,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_plugin_publication_event_type
        CHECK (
            event_type IN (
                'SUBMITTED',
                'APPROVED',
                'REJECTED',
                'QUARANTINED',
                'QUARANTINE_RELEASED',
                'REVOKED'
            )
        )
);

CREATE INDEX IF NOT EXISTS
idx_plugin_publication_events_publication
ON plugin_publication_security_events(
    publication_id,
    created_at
);

CREATE OR REPLACE FUNCTION
prevent_plugin_publication_artifact_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF
        NEW.plugin_id IS DISTINCT FROM OLD.plugin_id
        OR NEW.version IS DISTINCT FROM OLD.version
        OR NEW.publisher_id IS DISTINCT FROM OLD.publisher_id
        OR NEW.key_id IS DISTINCT FROM OLD.key_id
        OR NEW.artifact_storage_object_id
            IS DISTINCT FROM OLD.artifact_storage_object_id
        OR NEW.artifact_sha256
            IS DISTINCT FROM OLD.artifact_sha256
        OR NEW.integrity_sha256
            IS DISTINCT FROM OLD.integrity_sha256
        OR NEW.submitted_by
            IS DISTINCT FROM OLD.submitted_by
        OR NEW.submitted_at
            IS DISTINCT FROM OLD.submitted_at
    THEN
        RAISE EXCEPTION
            'PLUGIN_PUBLICATION_ARTIFACT_IMMUTABLE';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
trg_plugin_publication_artifact_immutable
ON plugin_publications;

CREATE TRIGGER
trg_plugin_publication_artifact_immutable
BEFORE UPDATE
ON plugin_publications
FOR EACH ROW
EXECUTE FUNCTION
prevent_plugin_publication_artifact_mutation();
