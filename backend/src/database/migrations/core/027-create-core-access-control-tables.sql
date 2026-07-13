-- Core Access Control Management
-- Migration: 027-create-core-access-control-tables.sql

CREATE TABLE IF NOT EXISTS access_points (
  id UUID PRIMARY KEY,

  property_id UUID NOT NULL
    REFERENCES properties(id),

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

  access_point_type VARCHAR(40) NOT NULL,
  direction VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

  controller_provider VARCHAR(150),
  controller_reference VARCHAR(255),

  requires_anti_passback BOOLEAN
    NOT NULL DEFAULT FALSE,

  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_access_point_code_property
    UNIQUE (
      property_id,
      normalized_code
    ),

  CONSTRAINT ck_access_point_type
    CHECK (
      access_point_type IN (
        'GATE',
        'DOOR',
        'TURNSTILE',
        'VEHICLE_BARRIER',
        'ELEVATOR',
        'OTHER'
      )
    ),

  CONSTRAINT ck_access_point_direction
    CHECK (
      direction IN (
        'ENTRY',
        'EXIT',
        'BIDIRECTIONAL'
      )
    ),

  CONSTRAINT ck_access_point_status
    CHECK (
      status IN (
        'ACTIVE',
        'INACTIVE',
        'MAINTENANCE',
        'EMERGENCY_OPEN',
        'ARCHIVED'
      )
    )
);

CREATE TABLE IF NOT EXISTS access_grants (
  id UUID PRIMARY KEY,

  access_point_id UUID NOT NULL
    REFERENCES access_points(id)
    ON DELETE CASCADE,

  subject_type VARCHAR(30) NOT NULL,
  subject_id UUID NOT NULL,

  direction VARCHAR(30) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',

  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,

  schedule JSONB,

  issued_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  revoked_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_access_grant_subject_type
    CHECK (
      subject_type IN (
        'PERSON',
        'STAFF',
        'VISITOR',
        'VEHICLE'
      )
    ),

  CONSTRAINT ck_access_grant_direction
    CHECK (
      direction IN (
        'ENTRY',
        'EXIT',
        'BIDIRECTIONAL'
      )
    ),

  CONSTRAINT ck_access_grant_status
    CHECK (
      status IN (
        'ACTIVE',
        'SUSPENDED',
        'REVOKED',
        'EXPIRED'
      )
    ),

  CONSTRAINT ck_access_grant_validity
    CHECK (
      valid_from IS NULL
      OR valid_until IS NULL
      OR valid_until > valid_from
    )
);

CREATE TABLE IF NOT EXISTS access_events (
  id UUID PRIMARY KEY,

  access_point_id UUID NOT NULL
    REFERENCES access_points(id),

  subject_type VARCHAR(30),
  subject_id UUID,

  credential_id UUID
    REFERENCES credentials(id)
    ON DELETE SET NULL,

  event_type VARCHAR(20) NOT NULL,
  decision VARCHAR(20) NOT NULL,

  denial_reason VARCHAR(60),

  grant_id UUID
    REFERENCES access_grants(id)
    ON DELETE SET NULL,

  recorded_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  occurred_at TIMESTAMPTZ NOT NULL,

  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_access_event_subject_type
    CHECK (
      subject_type IS NULL
      OR subject_type IN (
        'PERSON',
        'STAFF',
        'VISITOR',
        'VEHICLE'
      )
    ),

  CONSTRAINT ck_access_event_type
    CHECK (
      event_type IN (
        'ENTRY',
        'EXIT'
      )
    ),

  CONSTRAINT ck_access_event_decision
    CHECK (
      decision IN (
        'GRANTED',
        'DENIED'
      )
    ),

  CONSTRAINT ck_access_denial_reason
    CHECK (
      denial_reason IS NULL
      OR denial_reason IN (
        'ACCESS_POINT_INACTIVE',
        'GRANT_NOT_FOUND',
        'GRANT_INACTIVE',
        'GRANT_NOT_STARTED',
        'GRANT_EXPIRED',
        'DIRECTION_NOT_ALLOWED',
        'SCHEDULE_NOT_ALLOWED',
        'CREDENTIAL_INVALID',
        'ANTI_PASSBACK',
        'SUBJECT_INACTIVE',
        'OTHER'
      )
    )
);

CREATE INDEX IF NOT EXISTS
  idx_access_point_property
ON access_points(property_id);

CREATE INDEX IF NOT EXISTS
  idx_access_point_zone
ON access_points(zone_id);

CREATE INDEX IF NOT EXISTS
  idx_access_point_space
ON access_points(space_id);

CREATE INDEX IF NOT EXISTS
  idx_access_point_status
ON access_points(status);

CREATE INDEX IF NOT EXISTS
  idx_access_point_type
ON access_points(access_point_type);

CREATE INDEX IF NOT EXISTS
  idx_access_grant_access_point
ON access_grants(access_point_id);

CREATE INDEX IF NOT EXISTS
  idx_access_grant_subject
ON access_grants(
  subject_type,
  subject_id
);

CREATE INDEX IF NOT EXISTS
  idx_access_grant_status
ON access_grants(status);

CREATE INDEX IF NOT EXISTS
  idx_access_grant_validity
ON access_grants(
  valid_from,
  valid_until
);

CREATE INDEX IF NOT EXISTS
  idx_access_event_access_point
ON access_events(access_point_id);

CREATE INDEX IF NOT EXISTS
  idx_access_event_subject
ON access_events(
  subject_type,
  subject_id
);

CREATE INDEX IF NOT EXISTS
  idx_access_event_credential
ON access_events(credential_id);

CREATE INDEX IF NOT EXISTS
  idx_access_event_occurred
ON access_events(occurred_at);

CREATE INDEX IF NOT EXISTS
  idx_access_event_decision
ON access_events(decision);
