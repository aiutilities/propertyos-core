CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    event_type VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_source ON audit_logs(source);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
