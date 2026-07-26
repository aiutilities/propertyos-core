CREATE TABLE IF NOT EXISTS core_idempotency_requests (
    id uuid PRIMARY KEY,

    actor_id varchar(255) NOT NULL,
    operation varchar(160) NOT NULL,
    resource_key varchar(500) NOT NULL,
    idempotency_key varchar(255) NOT NULL,

    request_fingerprint char(64) NOT NULL,

    status varchar(20) NOT NULL
        DEFAULT 'RUNNING',

    response_status integer,
    response_payload jsonb,
    error_payload jsonb,

    attempt_number integer NOT NULL
        DEFAULT 1,

    started_at timestamptz NOT NULL
        DEFAULT now(),

    heartbeat_at timestamptz NOT NULL
        DEFAULT now(),

    completed_at timestamptz,

    expires_at timestamptz NOT NULL,

    created_at timestamptz NOT NULL
        DEFAULT now(),

    updated_at timestamptz NOT NULL
        DEFAULT now(),

    CONSTRAINT chk_core_idempotency_status
        CHECK (
            status IN (
                'RUNNING',
                'COMPLETE',
                'FAILED'
            )
        ),

    CONSTRAINT chk_core_idempotency_fingerprint
        CHECK (
            request_fingerprint ~ '^[a-f0-9]{64}$'
        ),

    CONSTRAINT chk_core_idempotency_attempt
        CHECK (
            attempt_number >= 1
        ),

    CONSTRAINT chk_core_idempotency_expiry
        CHECK (
            expires_at > created_at
        )
);

CREATE UNIQUE INDEX IF NOT EXISTS
    uq_core_idempotency_scope
ON core_idempotency_requests (
    actor_id,
    operation,
    idempotency_key
);

CREATE INDEX IF NOT EXISTS
    idx_core_idempotency_status
ON core_idempotency_requests (
    status,
    updated_at
);

CREATE INDEX IF NOT EXISTS
    idx_core_idempotency_expiry
ON core_idempotency_requests (
    expires_at
);

CREATE INDEX IF NOT EXISTS
    idx_core_idempotency_resource
ON core_idempotency_requests (
    operation,
    resource_key
);
