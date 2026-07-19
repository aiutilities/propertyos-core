CREATE TABLE IF NOT EXISTS core_plugin_installation_attempts (
    request_key VARCHAR(64) PRIMARY KEY,
    status VARCHAR(20) NOT NULL,
    attempt_number INTEGER NOT NULL DEFAULT 1,
    result JSONB,
    error TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_plugin_installation_attempt_status
        CHECK (
            status IN (
                'RUNNING',
                'COMPLETE',
                'FAILED',
                'INTERRUPTED'
            )
        ),
    CONSTRAINT chk_plugin_installation_attempt_number
        CHECK (attempt_number > 0)
);

CREATE INDEX IF NOT EXISTS idx_plugin_installation_attempts_status
ON core_plugin_installation_attempts(status);

CREATE INDEX IF NOT EXISTS idx_plugin_installation_attempts_heartbeat
ON core_plugin_installation_attempts(heartbeat_at);
