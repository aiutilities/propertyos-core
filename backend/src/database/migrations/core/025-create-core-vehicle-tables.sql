-- Core Vehicle Registry
-- Migration: 025-create-core-vehicle-tables.sql

CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY,

  registration_number VARCHAR(50) NOT NULL,
  normalized_registration_number VARCHAR(50)
    NOT NULL UNIQUE,

  vehicle_type VARCHAR(30) NOT NULL,

  owner_person_id UUID NOT NULL
    REFERENCES persons(id),

  property_id UUID NOT NULL
    REFERENCES properties(id),

  space_id UUID
    REFERENCES spaces(id)
    ON DELETE SET NULL,

  parking_slot VARCHAR(100),

  make VARCHAR(150),
  model VARCHAR(150),
  colour VARCHAR(100),
  year_of_manufacture INTEGER,

  rfid_tag VARCHAR(255) UNIQUE,

  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

  verified_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_vehicle_type
    CHECK (
      vehicle_type IN (
        'TWO_WHEELER',
        'CAR',
        'COMMERCIAL',
        'BICYCLE',
        'OTHER'
      )
    ),

  CONSTRAINT ck_vehicle_status
    CHECK (
      status IN (
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'SUSPENDED',
        'ARCHIVED'
      )
    ),

  CONSTRAINT ck_vehicle_year
    CHECK (
      year_of_manufacture IS NULL
      OR year_of_manufacture BETWEEN 1900 AND 2200
    )
);

CREATE TABLE IF NOT EXISTS vehicle_movements (
  id UUID PRIMARY KEY,

  vehicle_id UUID NOT NULL
    REFERENCES vehicles(id)
    ON DELETE CASCADE,

  movement_type VARCHAR(20) NOT NULL,

  gate VARCHAR(150),

  recorded_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  occurred_at TIMESTAMPTZ NOT NULL,
  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_vehicle_movement_type
    CHECK (
      movement_type IN (
        'ENTRY',
        'EXIT'
      )
    )
);

CREATE INDEX IF NOT EXISTS idx_vehicle_property
ON vehicles(property_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_space
ON vehicles(space_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_owner
ON vehicles(owner_person_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_status
ON vehicles(status);

CREATE INDEX IF NOT EXISTS idx_vehicle_type
ON vehicles(vehicle_type);

CREATE INDEX IF NOT EXISTS idx_vehicle_registration
ON vehicles(normalized_registration_number);

CREATE INDEX IF NOT EXISTS idx_vehicle_movement_vehicle
ON vehicle_movements(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_movement_occurred
ON vehicle_movements(occurred_at);
