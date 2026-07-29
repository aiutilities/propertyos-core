-- ============================================================================
-- CORE PAYMENT RUNTIME
-- Migration 054
--
-- This schema is independent from:
--   * rent_payments
--   * procurement_payment_requests
--
-- Product modules may reference this runtime through source and
-- source_reference_id without coupling ForgeOS Payment to a vertical domain.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY,

    source VARCHAR(100) NOT NULL,
    source_reference_id VARCHAR(255),

    provider_name VARCHAR(100) NOT NULL,

    provider_order_id VARCHAR(255),
    provider_payment_id VARCHAR(255),
    provider_refund_id VARCHAR(255),

    idempotency_key VARCHAR(255) NOT NULL,

    status VARCHAR(50) NOT NULL,

    amount_minor BIGINT NOT NULL,
    currency VARCHAR(3) NOT NULL,

    customer_id VARCHAR(255),
    description TEXT,

    failure_code VARCHAR(100),
    failure_message TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_payment_transactions_idempotency
        UNIQUE (idempotency_key),

    CONSTRAINT chk_payment_transactions_amount
        CHECK (amount_minor >= 0),

    CONSTRAINT chk_payment_transactions_currency
        CHECK (
            currency = UPPER(currency)
            AND LENGTH(currency) = 3
        ),

    CONSTRAINT chk_payment_transactions_status
        CHECK (
            status IN (
                'PENDING',
                'CREATED',
                'AUTHORIZED',
                'CAPTURED',
                'FAILED',
                'CANCELLED',
                'REFUNDED',
                'PARTIALLY_REFUNDED'
            )
        )
);

CREATE UNIQUE INDEX IF NOT EXISTS
    uq_payment_transactions_provider_order
ON payment_transactions (
    provider_name,
    provider_order_id
)
WHERE provider_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
    uq_payment_transactions_provider_payment
ON payment_transactions (
    provider_name,
    provider_payment_id
)
WHERE provider_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
    idx_payment_transactions_source_reference
ON payment_transactions (
    source,
    source_reference_id
);

CREATE INDEX IF NOT EXISTS
    idx_payment_transactions_status
ON payment_transactions (
    status
);

CREATE INDEX IF NOT EXISTS
    idx_payment_transactions_provider
ON payment_transactions (
    provider_name,
    created_at DESC
);

CREATE TABLE IF NOT EXISTS payment_provider_events (
    id UUID PRIMARY KEY,

    payment_id UUID
        REFERENCES payment_transactions(id)
        ON DELETE SET NULL,

    provider_name VARCHAR(100) NOT NULL,
    provider_event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,

    provider_order_id VARCHAR(255),
    provider_payment_id VARCHAR(255),
    provider_refund_id VARCHAR(255),

    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    occurred_at TIMESTAMP,
    received_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_payment_provider_events
        UNIQUE (
            provider_name,
            provider_event_id
        )
);

CREATE INDEX IF NOT EXISTS
    idx_payment_provider_events_payment
ON payment_provider_events (
    payment_id,
    created_at
);

CREATE INDEX IF NOT EXISTS
    idx_payment_provider_events_type
ON payment_provider_events (
    provider_name,
    event_type,
    received_at DESC
);

CREATE TABLE IF NOT EXISTS payment_webhook_inbox (
    id UUID PRIMARY KEY,

    idempotency_key VARCHAR(500) NOT NULL,

    provider_name VARCHAR(100) NOT NULL,
    provider_event_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(255),

    status VARCHAR(30) NOT NULL,

    attempt_number INTEGER NOT NULL DEFAULT 1,

    raw_body TEXT NOT NULL,
    signature TEXT,
    headers JSONB NOT NULL DEFAULT '{}'::jsonb,

    error_code VARCHAR(100),
    error_message TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    claimed_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    failed_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_payment_webhook_inbox_idempotency
        UNIQUE (idempotency_key),

    CONSTRAINT uq_payment_webhook_provider_event
        UNIQUE (
            provider_name,
            provider_event_id
        ),

    CONSTRAINT chk_payment_webhook_status
        CHECK (
            status IN (
                'PROCESSING',
                'COMPLETED',
                'FAILED'
            )
        ),

    CONSTRAINT chk_payment_webhook_attempt
        CHECK (attempt_number >= 1)
);

CREATE INDEX IF NOT EXISTS
    idx_payment_webhook_inbox_status
ON payment_webhook_inbox (
    status,
    updated_at
);

CREATE INDEX IF NOT EXISTS
    idx_payment_webhook_inbox_provider
ON payment_webhook_inbox (
    provider_name,
    created_at DESC
);

CREATE TABLE IF NOT EXISTS payment_webhook_dead_letters (
    id UUID PRIMARY KEY,

    idempotency_key VARCHAR(500),

    provider_name VARCHAR(100) NOT NULL,
    provider_event_id VARCHAR(255),
    event_type VARCHAR(255),

    attempt_number INTEGER NOT NULL,

    raw_body TEXT NOT NULL,
    signature TEXT,
    headers JSONB NOT NULL DEFAULT '{}'::jsonb,

    error_code VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    failed_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_payment_dead_letter_attempt
        CHECK (attempt_number >= 1)
);

CREATE INDEX IF NOT EXISTS
    idx_payment_dead_letters_provider
ON payment_webhook_dead_letters (
    provider_name,
    failed_at DESC
);

CREATE INDEX IF NOT EXISTS
    idx_payment_dead_letters_event
ON payment_webhook_dead_letters (
    provider_name,
    provider_event_id
);

CREATE TABLE IF NOT EXISTS payment_reconciliation_runs (
    id UUID PRIMARY KEY,

    provider_name VARCHAR(100) NOT NULL,

    status VARCHAR(30) NOT NULL,

    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,

    examined_count INTEGER NOT NULL DEFAULT 0,
    matched_count INTEGER NOT NULL DEFAULT 0,
    mismatch_count INTEGER NOT NULL DEFAULT 0,

    error_message TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    started_at TIMESTAMP,
    completed_at TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_payment_reconciliation_status
        CHECK (
            status IN (
                'PENDING',
                'RUNNING',
                'COMPLETED',
                'FAILED'
            )
        ),

    CONSTRAINT chk_payment_reconciliation_period
        CHECK (
            period_end >= period_start
        ),

    CONSTRAINT chk_payment_reconciliation_counts
        CHECK (
            examined_count >= 0
            AND matched_count >= 0
            AND mismatch_count >= 0
        )
);

CREATE INDEX IF NOT EXISTS
    idx_payment_reconciliation_provider
ON payment_reconciliation_runs (
    provider_name,
    created_at DESC
);

CREATE INDEX IF NOT EXISTS
    idx_payment_reconciliation_status
ON payment_reconciliation_runs (
    status,
    created_at
);

COMMIT;
