-- Core Maintenance Management Tables
-- Migration: 023-create-core-maintenance-tables.sql

CREATE TABLE IF NOT EXISTS maintenance_categories (
  id UUID PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  default_sla_minutes INTEGER NOT NULL DEFAULT 1440,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_maintenance_category_sla_positive
    CHECK (default_sla_minutes > 0)
);

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id UUID PRIMARY KEY,
  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  category_id UUID NOT NULL
    REFERENCES maintenance_categories(id),

  property_id UUID NOT NULL
    REFERENCES properties(id),

  space_id UUID
    REFERENCES spaces(id)
    ON DELETE SET NULL,

  reporter_person_id UUID NOT NULL
    REFERENCES persons(id),

  assignee_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN',

  sla_due_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_maintenance_ticket_priority
    CHECK (
      priority IN (
        'LOW',
        'MEDIUM',
        'HIGH',
        'URGENT'
      )
    ),

  CONSTRAINT ck_maintenance_ticket_status
    CHECK (
      status IN (
        'OPEN',
        'ASSIGNED',
        'IN_PROGRESS',
        'RESOLVED',
        'CLOSED',
        'CANCELLED',
        'REJECTED'
      )
    )
);

CREATE TABLE IF NOT EXISTS maintenance_ticket_history (
  id UUID PRIMARY KEY,

  ticket_id UUID NOT NULL
    REFERENCES maintenance_tickets(id)
    ON DELETE CASCADE,

  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,

  changed_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_ticket_property
ON maintenance_tickets(property_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_ticket_space
ON maintenance_tickets(space_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_ticket_category
ON maintenance_tickets(category_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_ticket_reporter
ON maintenance_tickets(reporter_person_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_ticket_assignee
ON maintenance_tickets(assignee_person_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_ticket_status
ON maintenance_tickets(status);

CREATE INDEX IF NOT EXISTS idx_maintenance_ticket_priority
ON maintenance_tickets(priority);

CREATE INDEX IF NOT EXISTS idx_maintenance_ticket_sla_due_at
ON maintenance_tickets(sla_due_at);

CREATE INDEX IF NOT EXISTS idx_maintenance_history_ticket
ON maintenance_ticket_history(ticket_id);

INSERT INTO maintenance_categories (
  id,
  code,
  name,
  description,
  default_sla_minutes
)
VALUES
  (
    '10000000-0000-4000-8000-000000000001',
    'PLUMBING',
    'Plumbing',
    'Water supply, leakage, drainage and sanitary issues',
    480
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'ELECTRICAL',
    'Electrical',
    'Power, lighting, wiring and electrical equipment issues',
    240
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'HOUSEKEEPING',
    'Housekeeping',
    'Cleaning and common-area housekeeping requests',
    720
  ),
  (
    '10000000-0000-4000-8000-000000000004',
    'CARPENTRY',
    'Carpentry',
    'Doors, windows, furniture and woodwork issues',
    1440
  ),
  (
    '10000000-0000-4000-8000-000000000005',
    'APPLIANCE',
    'Appliance',
    'Property-provided appliance repair requests',
    1440
  ),
  (
    '10000000-0000-4000-8000-000000000006',
    'CIVIL',
    'Civil Work',
    'Structural, masonry, flooring and painting issues',
    2880
  ),
  (
    '10000000-0000-4000-8000-000000000007',
    'OTHER',
    'Other',
    'Maintenance requests not covered by another category',
    1440
  )
ON CONFLICT (code) DO NOTHING;
