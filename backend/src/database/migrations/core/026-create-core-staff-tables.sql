-- Core Staff Registry and Attendance
-- Migration: 026-create-core-staff-tables.sql

CREATE TABLE IF NOT EXISTS staff_members (
  id UUID PRIMARY KEY,

  employee_code VARCHAR(100) NOT NULL,
  normalized_employee_code VARCHAR(100) NOT NULL,

  person_id UUID NOT NULL
    REFERENCES persons(id),

  staff_type VARCHAR(40) NOT NULL,

  property_id UUID NOT NULL
    REFERENCES properties(id),

  zone_id UUID
    REFERENCES zones(id)
    ON DELETE SET NULL,

  employer_name VARCHAR(200),
  department VARCHAR(150),
  designation VARCHAR(150),
  shift_name VARCHAR(150),

  id_card_number VARCHAR(150),
  qr_code VARCHAR(255),
  rfid_tag VARCHAR(255),

  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

  verified_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  verified_at TIMESTAMPTZ,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_staff_type
    CHECK (
      staff_type IN (
        'SECURITY',
        'HOUSEKEEPING',
        'MAINTENANCE',
        'ELECTRICIAN',
        'PLUMBER',
        'GARDENER',
        'ADMIN',
        'VENDOR',
        'CONTRACTOR',
        'OTHER'
      )
    ),

  CONSTRAINT ck_staff_status
    CHECK (
      status IN (
        'PENDING',
        'ACTIVE',
        'INACTIVE',
        'SUSPENDED',
        'ARCHIVED'
      )
    ),

  CONSTRAINT uq_staff_employee_code_property
    UNIQUE (
      property_id,
      normalized_employee_code
    )
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID PRIMARY KEY,

  staff_id UUID NOT NULL
    REFERENCES staff_members(id)
    ON DELETE CASCADE,

  attendance_type VARCHAR(20) NOT NULL,

  gate VARCHAR(150),

  recorded_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  occurred_at TIMESTAMPTZ NOT NULL,
  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_staff_attendance_type
    CHECK (
      attendance_type IN (
        'CHECK_IN',
        'CHECK_OUT'
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_staff_id_card_property
ON staff_members(
  property_id,
  id_card_number
)
WHERE id_card_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_staff_qr_code
ON staff_members(qr_code)
WHERE qr_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_staff_rfid_tag
ON staff_members(rfid_tag)
WHERE rfid_tag IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_staff_property
ON staff_members(property_id);

CREATE INDEX IF NOT EXISTS
  idx_staff_zone
ON staff_members(zone_id);

CREATE INDEX IF NOT EXISTS
  idx_staff_person
ON staff_members(person_id);

CREATE INDEX IF NOT EXISTS
  idx_staff_type
ON staff_members(staff_type);

CREATE INDEX IF NOT EXISTS
  idx_staff_status
ON staff_members(status);

CREATE INDEX IF NOT EXISTS
  idx_staff_employee_code
ON staff_members(normalized_employee_code);

CREATE INDEX IF NOT EXISTS
  idx_staff_attendance_staff
ON staff_attendance(staff_id);

CREATE INDEX IF NOT EXISTS
  idx_staff_attendance_occurred
ON staff_attendance(occurred_at);
