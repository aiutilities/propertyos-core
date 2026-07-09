CREATE TABLE IF NOT EXISTS eventbus_events (
    id UUID PRIMARY KEY,
    event_type VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    correlation_id UUID NOT NULL,
    causation_id UUID NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS eventbus_dead_letters (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL,
    event_snapshot JSONB NOT NULL,
    handler_name VARCHAR(255) NOT NULL,
    error_message TEXT NOT NULL,
    attempt INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventbus_events_type
ON eventbus_events(event_type);

CREATE INDEX IF NOT EXISTS idx_eventbus_events_source
ON eventbus_events(source);

CREATE INDEX IF NOT EXISTS idx_eventbus_events_correlation
ON eventbus_events(correlation_id);

CREATE INDEX IF NOT EXISTS idx_eventbus_dead_letters_event
ON eventbus_dead_letters(event_id);
