-- Core Property / Zone / Space Tables
-- Migration: 004-create-core-property-space-tables.sql

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) UNIQUE,
    property_type VARCHAR(100),
    description TEXT,

    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS zones (
    id UUID PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    zone_type VARCHAR(100),
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_zones_property_code UNIQUE (property_id, code)
);

CREATE TABLE IF NOT EXISTS spaces (
    id UUID PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES zones(id) ON DELETE SET NULL,

    name VARCHAR(255) NOT NULL,
    code VARCHAR(100),
    space_type VARCHAR(100),
    floor VARCHAR(50),
    description TEXT,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_spaces_property_code UNIQUE (property_id, code)
);

CREATE INDEX IF NOT EXISTS idx_zones_property_id
ON zones(property_id);

CREATE INDEX IF NOT EXISTS idx_spaces_property_id
ON spaces(property_id);

CREATE INDEX IF NOT EXISTS idx_spaces_zone_id
ON spaces(zone_id);
