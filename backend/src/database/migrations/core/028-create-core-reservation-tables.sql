-- Core Booking and Reservations
-- Migration: 028-create-core-reservation-tables.sql

CREATE TABLE IF NOT EXISTS reservation_resources (
  id UUID PRIMARY KEY,

  property_id UUID NOT NULL
    REFERENCES properties(id)
    ON DELETE CASCADE,

  zone_id UUID
    REFERENCES zones(id)
    ON DELETE SET NULL,

  space_id UUID
    REFERENCES spaces(id)
    ON DELETE SET NULL,

  code VARCHAR(100) NOT NULL,
  normalized_code VARCHAR(100) NOT NULL,

  name VARCHAR(200) NOT NULL,
  description TEXT,

  resource_type VARCHAR(40) NOT NULL DEFAULT 'FACILITY',

  capacity INTEGER NOT NULL DEFAULT 1,

  requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  minimum_duration_minutes INTEGER NOT NULL DEFAULT 30,
  maximum_duration_minutes INTEGER,
  booking_interval_minutes INTEGER NOT NULL DEFAULT 30,

  advance_booking_days INTEGER NOT NULL DEFAULT 30,
  minimum_notice_minutes INTEGER NOT NULL DEFAULT 0,

  opening_time TIME,
  closing_time TIME,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_reservation_resource_type
    CHECK (
      resource_type IN (
        'FACILITY',
        'ROOM',
        'DESK',
        'PARKING',
        'EQUIPMENT',
        'AMENITY',
        'SERVICE',
        'OTHER'
      )
    ),

  CONSTRAINT ck_reservation_resource_capacity
    CHECK (capacity > 0),

  CONSTRAINT ck_reservation_resource_minimum_duration
    CHECK (minimum_duration_minutes > 0),

  CONSTRAINT ck_reservation_resource_maximum_duration
    CHECK (
      maximum_duration_minutes IS NULL
      OR maximum_duration_minutes >= minimum_duration_minutes
    ),

  CONSTRAINT ck_reservation_resource_interval
    CHECK (booking_interval_minutes > 0),

  CONSTRAINT ck_reservation_resource_advance_days
    CHECK (advance_booking_days >= 0),

  CONSTRAINT ck_reservation_resource_notice
    CHECK (minimum_notice_minutes >= 0),

  CONSTRAINT uq_reservation_resource_code_property
    UNIQUE (
      property_id,
      normalized_code
    )
);

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY,

  reservation_number VARCHAR(100) NOT NULL UNIQUE,

  resource_id UUID NOT NULL
    REFERENCES reservation_resources(id)
    ON DELETE RESTRICT,

  property_id UUID NOT NULL
    REFERENCES properties(id)
    ON DELETE CASCADE,

  requester_person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE RESTRICT,

  beneficiary_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  title VARCHAR(250) NOT NULL,
  description TEXT,

  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,

  attendee_count INTEGER NOT NULL DEFAULT 1,

  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

  approval_required BOOLEAN NOT NULL DEFAULT FALSE,

  approved_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  approved_at TIMESTAMPTZ,

  rejected_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  cancelled_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,

  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_reservation_time_range
    CHECK (end_at > start_at),

  CONSTRAINT ck_reservation_attendee_count
    CHECK (attendee_count > 0),

  CONSTRAINT ck_reservation_status
    CHECK (
      status IN (
        'DRAFT',
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED',
        'CHECKED_IN',
        'COMPLETED',
        'NO_SHOW'
      )
    )
);

CREATE TABLE IF NOT EXISTS reservation_status_history (
  id UUID PRIMARY KEY,

  reservation_id UUID NOT NULL
    REFERENCES reservations(id)
    ON DELETE CASCADE,

  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,

  changed_by_person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE RESTRICT,

  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_reservation_history_from_status
    CHECK (
      from_status IS NULL
      OR from_status IN (
        'DRAFT',
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED',
        'CHECKED_IN',
        'COMPLETED',
        'NO_SHOW'
      )
    ),

  CONSTRAINT ck_reservation_history_to_status
    CHECK (
      to_status IN (
        'DRAFT',
        'PENDING',
        'APPROVED',
        'REJECTED',
        'CANCELLED',
        'CHECKED_IN',
        'COMPLETED',
        'NO_SHOW'
      )
    )
);

CREATE TABLE IF NOT EXISTS reservation_resource_blocks (
  id UUID PRIMARY KEY,

  resource_id UUID NOT NULL
    REFERENCES reservation_resources(id)
    ON DELETE CASCADE,

  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,

  reason TEXT NOT NULL,

  created_by_person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE RESTRICT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_reservation_resource_block_time
    CHECK (end_at > start_at)
);

CREATE INDEX IF NOT EXISTS
  idx_reservation_resources_property
ON reservation_resources(property_id);

CREATE INDEX IF NOT EXISTS
  idx_reservation_resources_zone
ON reservation_resources(zone_id);

CREATE INDEX IF NOT EXISTS
  idx_reservation_resources_space
ON reservation_resources(space_id);

CREATE INDEX IF NOT EXISTS
  idx_reservation_resources_type
ON reservation_resources(resource_type);

CREATE INDEX IF NOT EXISTS
  idx_reservation_resources_active
ON reservation_resources(is_active);

CREATE INDEX IF NOT EXISTS
  idx_reservations_resource
ON reservations(resource_id);

CREATE INDEX IF NOT EXISTS
  idx_reservations_property
ON reservations(property_id);

CREATE INDEX IF NOT EXISTS
  idx_reservations_requester
ON reservations(requester_person_id);

CREATE INDEX IF NOT EXISTS
  idx_reservations_status
ON reservations(status);

CREATE INDEX IF NOT EXISTS
  idx_reservations_start_at
ON reservations(start_at);

CREATE INDEX IF NOT EXISTS
  idx_reservations_end_at
ON reservations(end_at);

CREATE INDEX IF NOT EXISTS
  idx_reservations_resource_time
ON reservations(
  resource_id,
  start_at,
  end_at
);

CREATE INDEX IF NOT EXISTS
  idx_reservation_history_reservation
ON reservation_status_history(reservation_id);

CREATE INDEX IF NOT EXISTS
  idx_reservation_blocks_resource_time
ON reservation_resource_blocks(
  resource_id,
  start_at,
  end_at
);
