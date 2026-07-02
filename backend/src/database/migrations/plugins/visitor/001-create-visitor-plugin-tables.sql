CREATE TABLE IF NOT EXISTS visitors (
    id UUID PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS visits (
    id UUID PRIMARY KEY,
    visitor_id UUID NOT NULL,
    property_id UUID NOT NULL,
    host_person_id UUID NOT NULL,
    visit_date DATE NOT NULL,
    visit_purpose VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    arrived_at TIMESTAMP,
    checked_in_at TIMESTAMP,
    checked_out_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    expired_at TIMESTAMP,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,

    CONSTRAINT fk_visit_visitor FOREIGN KEY (visitor_id) REFERENCES visitors(id),
    CONSTRAINT fk_visit_property FOREIGN KEY (property_id) REFERENCES properties(id),
    CONSTRAINT fk_visit_host_person FOREIGN KEY (host_person_id) REFERENCES persons(id)
);

CREATE TABLE IF NOT EXISTS visitor_qr_passes (
    id UUID PRIMARY KEY,
    visit_id UUID NOT NULL,
    qr_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    generated_at TIMESTAMP NOT NULL,
    scanned_at TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    metadata JSONB,

    CONSTRAINT fk_qr_visit FOREIGN KEY (visit_id) REFERENCES visits(id)
);

CREATE TABLE IF NOT EXISTS visitor_status_history (
    id UUID PRIMARY KEY,
    visit_id UUID NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_person_id UUID,
    change_reason VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_history_visit FOREIGN KEY (visit_id) REFERENCES visits(id),
    CONSTRAINT fk_history_changed_by_person FOREIGN KEY (changed_by_person_id) REFERENCES persons(id)
);

CREATE TABLE IF NOT EXISTS visitor_plugin_settings (
    id UUID PRIMARY KEY,
    property_id UUID,
    settings JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_visitor_plugin_settings_property FOREIGN KEY (property_id) REFERENCES properties(id)
);

CREATE INDEX IF NOT EXISTS idx_visitors_mobile ON visitors(mobile);
CREATE INDEX IF NOT EXISTS idx_visitors_email ON visitors(email);
CREATE INDEX IF NOT EXISTS idx_visits_property ON visits(property_id);
CREATE INDEX IF NOT EXISTS idx_visits_host ON visits(host_person_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_qr_token ON visitor_qr_passes(qr_token);
CREATE INDEX IF NOT EXISTS idx_status_history_visit ON visitor_status_history(visit_id);
