-- Core Helpdesk Tables
-- Migration: 029-create-core-helpdesk-tables.sql

CREATE TABLE IF NOT EXISTS helpdesk_categories (
  id UUID PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  default_priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  response_sla_minutes INTEGER NOT NULL DEFAULT 240,
  resolution_sla_minutes INTEGER NOT NULL DEFAULT 1440,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_helpdesk_category_priority
    CHECK (
      default_priority IN (
        'LOW',
        'MEDIUM',
        'HIGH',
        'URGENT'
      )
    ),

  CONSTRAINT ck_helpdesk_category_response_sla
    CHECK (response_sla_minutes > 0),

  CONSTRAINT ck_helpdesk_category_resolution_sla
    CHECK (resolution_sla_minutes > 0)
);

CREATE TABLE IF NOT EXISTS helpdesk_tickets (
  id UUID PRIMARY KEY,

  ticket_number VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,

  category_id UUID NOT NULL
    REFERENCES helpdesk_categories(id),

  property_id UUID NOT NULL
    REFERENCES properties(id),

  space_id UUID
    REFERENCES spaces(id)
    ON DELETE SET NULL,

  requester_person_id UUID NOT NULL
    REFERENCES persons(id),

  assignee_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  channel VARCHAR(20) NOT NULL DEFAULT 'WEB',

  response_due_at TIMESTAMPTZ,
  resolution_due_at TIMESTAMPTZ,
  first_responded_at TIMESTAMPTZ,
  escalated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  resolution_summary TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_helpdesk_ticket_priority
    CHECK (
      priority IN (
        'LOW',
        'MEDIUM',
        'HIGH',
        'URGENT'
      )
    ),

  CONSTRAINT ck_helpdesk_ticket_status
    CHECK (
      status IN (
        'OPEN',
        'ASSIGNED',
        'IN_PROGRESS',
        'ESCALATED',
        'RESOLVED',
        'CLOSED',
        'REOPENED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_helpdesk_ticket_channel
    CHECK (
      channel IN (
        'WEB',
        'MOBILE',
        'WHATSAPP',
        'EMAIL',
        'PHONE',
        'ADMIN'
      )
    )
);

CREATE TABLE IF NOT EXISTS helpdesk_ticket_history (
  id UUID PRIMARY KEY,

  ticket_id UUID NOT NULL
    REFERENCES helpdesk_tickets(id)
    ON DELETE CASCADE,

  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,

  changed_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_helpdesk_history_from_status
    CHECK (
      from_status IS NULL OR
      from_status IN (
        'OPEN',
        'ASSIGNED',
        'IN_PROGRESS',
        'ESCALATED',
        'RESOLVED',
        'CLOSED',
        'REOPENED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_helpdesk_history_to_status
    CHECK (
      to_status IN (
        'OPEN',
        'ASSIGNED',
        'IN_PROGRESS',
        'ESCALATED',
        'RESOLVED',
        'CLOSED',
        'REOPENED',
        'CANCELLED'
      )
    )
);

CREATE TABLE IF NOT EXISTS helpdesk_comments (
  id UUID PRIMARY KEY,

  ticket_id UUID NOT NULL
    REFERENCES helpdesk_tickets(id)
    ON DELETE CASCADE,

  author_person_id UUID NOT NULL
    REFERENCES persons(id),

  body TEXT NOT NULL,
  visibility VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_helpdesk_comment_visibility
    CHECK (
      visibility IN (
        'PUBLIC',
        'INTERNAL'
      )
    )
);

CREATE TABLE IF NOT EXISTS helpdesk_attachments (
  id UUID PRIMARY KEY,

  ticket_id UUID NOT NULL
    REFERENCES helpdesk_tickets(id)
    ON DELETE CASCADE,

  comment_id UUID
    REFERENCES helpdesk_comments(id)
    ON DELETE CASCADE,

  document_id UUID NOT NULL
    REFERENCES core_documents(id),

  uploaded_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS helpdesk_worklogs (
  id UUID PRIMARY KEY,

  ticket_id UUID NOT NULL
    REFERENCES helpdesk_tickets(id)
    ON DELETE CASCADE,

  person_id UUID NOT NULL
    REFERENCES persons(id),

  minutes_spent INTEGER NOT NULL,
  description TEXT NOT NULL,
  worked_at TIMESTAMPTZ NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_helpdesk_worklog_minutes
    CHECK (minutes_spent > 0)
);

CREATE TABLE IF NOT EXISTS helpdesk_feedback (
  id UUID PRIMARY KEY,

  ticket_id UUID NOT NULL UNIQUE
    REFERENCES helpdesk_tickets(id)
    ON DELETE CASCADE,

  submitted_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  rating INTEGER NOT NULL,
  comments TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_helpdesk_feedback_rating
    CHECK (rating BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_ticket_property
ON helpdesk_tickets(property_id);

CREATE INDEX IF NOT EXISTS idx_helpdesk_ticket_space
ON helpdesk_tickets(space_id);

CREATE INDEX IF NOT EXISTS idx_helpdesk_ticket_category
ON helpdesk_tickets(category_id);

CREATE INDEX IF NOT EXISTS idx_helpdesk_ticket_requester
ON helpdesk_tickets(requester_person_id);

CREATE INDEX IF NOT EXISTS idx_helpdesk_ticket_assignee
ON helpdesk_tickets(assignee_person_id);

CREATE INDEX IF NOT EXISTS idx_helpdesk_ticket_status
ON helpdesk_tickets(status);

CREATE INDEX IF NOT EXISTS idx_helpdesk_ticket_priority
ON helpdesk_tickets(priority);

CREATE INDEX IF NOT EXISTS idx_helpdesk_ticket_channel
ON helpdesk_tickets(channel);

CREATE INDEX IF NOT EXISTS idx_helpdesk_ticket_response_due
ON helpdesk_tickets(response_due_at);

CREATE INDEX IF NOT EXISTS idx_helpdesk_ticket_resolution_due
ON helpdesk_tickets(resolution_due_at);

CREATE INDEX IF NOT EXISTS idx_helpdesk_history_ticket
ON helpdesk_ticket_history(ticket_id);

CREATE INDEX IF NOT EXISTS idx_helpdesk_comment_ticket
ON helpdesk_comments(ticket_id);

CREATE INDEX IF NOT EXISTS idx_helpdesk_attachment_ticket
ON helpdesk_attachments(ticket_id);

CREATE INDEX IF NOT EXISTS idx_helpdesk_worklog_ticket
ON helpdesk_worklogs(ticket_id);

INSERT INTO helpdesk_categories (
  id,
  code,
  name,
  description,
  default_priority,
  response_sla_minutes,
  resolution_sla_minutes
)
VALUES
  (
    '16000000-0000-4000-8000-000000000001',
    'GENERAL_ENQUIRY',
    'General Enquiry',
    'General questions and administrative assistance',
    'LOW',
    480,
    2880
  ),
  (
    '16000000-0000-4000-8000-000000000002',
    'ACCESS_SUPPORT',
    'Access Support',
    'Entry, credential, gate and access-related assistance',
    'HIGH',
    60,
    240
  ),
  (
    '16000000-0000-4000-8000-000000000003',
    'RESERVATION_SUPPORT',
    'Reservation Support',
    'Facility booking, approval and reservation assistance',
    'MEDIUM',
    240,
    1440
  ),
  (
    '16000000-0000-4000-8000-000000000004',
    'BILLING_SUPPORT',
    'Billing Support',
    'Invoice, receipt, payment and account enquiries',
    'MEDIUM',
    240,
    2880
  ),
  (
    '16000000-0000-4000-8000-000000000005',
    'SECURITY_CONCERN',
    'Security Concern',
    'Security incidents and urgent operational concerns',
    'URGENT',
    15,
    120
  ),
  (
    '16000000-0000-4000-8000-000000000006',
    'SERVICE_REQUEST',
    'Service Request',
    'General service requests not represented by another category',
    'MEDIUM',
    240,
    1440
  ),
  (
    '16000000-0000-4000-8000-000000000007',
    'OTHER',
    'Other',
    'Helpdesk requests not covered by another category',
    'MEDIUM',
    480,
    2880
  )
ON CONFLICT (code) DO NOTHING;
