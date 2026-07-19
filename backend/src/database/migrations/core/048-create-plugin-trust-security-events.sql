CREATE TABLE IF NOT EXISTS
plugin_publisher_trust_security_events (
    id UUID PRIMARY KEY,
    publisher_id VARCHAR(100) NOT NULL
        REFERENCES plugin_publishers(id),
    key_id VARCHAR(150),
    event_type VARCHAR(50) NOT NULL,
    actor_id VARCHAR(150) NOT NULL,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT
        chk_plugin_publisher_trust_event_type
        CHECK (
            event_type IN (
                'KEY_REVOKED',
                'PUBLISHER_SUSPENDED',
                'PUBLISHER_REACTIVATED',
                'PUBLISHER_REVOKED',
                'KEY_REGISTERED',
                'PUBLISHER_REGISTERED'
            )
        )
);

CREATE INDEX IF NOT EXISTS
idx_plugin_publisher_trust_events_publisher
ON plugin_publisher_trust_security_events(
    publisher_id,
    created_at DESC
);

CREATE INDEX IF NOT EXISTS
idx_plugin_publisher_trust_events_key
ON plugin_publisher_trust_security_events(
    key_id,
    created_at DESC
)
WHERE key_id IS NOT NULL;
