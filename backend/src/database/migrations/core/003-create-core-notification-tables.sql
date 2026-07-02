CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    channel VARCHAR(100) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMP,
    failed_at TIMESTAMP
);

CREATE INDEX idx_notifications_channel ON notifications(channel);
CREATE INDEX idx_notifications_recipient ON notifications(recipient);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
