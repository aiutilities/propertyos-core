-- Core Community Communications
-- Migration: 030-create-core-communications-tables.sql

CREATE TABLE IF NOT EXISTS communication_categories (
  id UUID PRIMARY KEY,

  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communications (
  id UUID PRIMARY KEY,

  communication_number VARCHAR(100)
    NOT NULL UNIQUE,

  property_id UUID NOT NULL
    REFERENCES properties(id)
    ON DELETE CASCADE,

  category_id UUID NOT NULL
    REFERENCES communication_categories(id)
    ON DELETE RESTRICT,

  communication_type VARCHAR(30)
    NOT NULL DEFAULT 'ANNOUNCEMENT',

  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,

  priority VARCHAR(20)
    NOT NULL DEFAULT 'NORMAL',

  status VARCHAR(30)
    NOT NULL DEFAULT 'DRAFT',

  is_pinned BOOLEAN
    NOT NULL DEFAULT FALSE,

  requires_acknowledgement BOOLEAN
    NOT NULL DEFAULT FALSE,

  publish_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,

  created_by_person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE RESTRICT,

  updated_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  published_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  archived_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  cancelled_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_communications_type
    CHECK (
      communication_type IN (
        'ANNOUNCEMENT',
        'NOTICE',
        'ALERT',
        'EVENT',
        'POLL'
      )
    ),

  CONSTRAINT ck_communications_priority
    CHECK (
      priority IN (
        'LOW',
        'NORMAL',
        'HIGH',
        'URGENT'
      )
    ),

  CONSTRAINT ck_communications_status
    CHECK (
      status IN (
        'DRAFT',
        'SCHEDULED',
        'PUBLISHED',
        'EXPIRED',
        'ARCHIVED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_communications_publish_expiry
    CHECK (
      expires_at IS NULL
      OR publish_at IS NULL
      OR expires_at > publish_at
    ),

  CONSTRAINT ck_communications_published_expiry
    CHECK (
      expires_at IS NULL
      OR published_at IS NULL
      OR expires_at > published_at
    )
);

CREATE TABLE IF NOT EXISTS communication_targets (
  id UUID PRIMARY KEY,

  communication_id UUID NOT NULL
    REFERENCES communications(id)
    ON DELETE CASCADE,

  audience_type VARCHAR(30)
    NOT NULL,

  zone_id UUID
    REFERENCES zones(id)
    ON DELETE CASCADE,

  space_id UUID
    REFERENCES spaces(id)
    ON DELETE CASCADE,

  person_id UUID
    REFERENCES persons(id)
    ON DELETE CASCADE,

  role_id UUID
    REFERENCES roles(id)
    ON DELETE CASCADE,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_communication_target_audience
    CHECK (
      audience_type IN (
        'ALL_PROPERTY',
        'ZONE',
        'SPACE',
        'PERSON',
        'ROLE',
        'OWNERS',
        'TENANTS',
        'RESIDENTS',
        'STAFF',
        'SECURITY'
      )
    ),

  CONSTRAINT ck_communication_target_shape
    CHECK (
      (
        audience_type = 'ALL_PROPERTY'
        AND zone_id IS NULL
        AND space_id IS NULL
        AND person_id IS NULL
        AND role_id IS NULL
      )
      OR
      (
        audience_type = 'ZONE'
        AND zone_id IS NOT NULL
        AND space_id IS NULL
        AND person_id IS NULL
        AND role_id IS NULL
      )
      OR
      (
        audience_type = 'SPACE'
        AND zone_id IS NULL
        AND space_id IS NOT NULL
        AND person_id IS NULL
        AND role_id IS NULL
      )
      OR
      (
        audience_type = 'PERSON'
        AND zone_id IS NULL
        AND space_id IS NULL
        AND person_id IS NOT NULL
        AND role_id IS NULL
      )
      OR
      (
        audience_type = 'ROLE'
        AND zone_id IS NULL
        AND space_id IS NULL
        AND person_id IS NULL
        AND role_id IS NOT NULL
      )
      OR
      (
        audience_type IN (
          'OWNERS',
          'TENANTS',
          'RESIDENTS',
          'STAFF',
          'SECURITY'
        )
        AND zone_id IS NULL
        AND space_id IS NULL
        AND person_id IS NULL
        AND role_id IS NULL
      )
    )
);

CREATE TABLE IF NOT EXISTS communication_attachments (
  id UUID PRIMARY KEY,

  communication_id UUID NOT NULL
    REFERENCES communications(id)
    ON DELETE CASCADE,

  document_id UUID NOT NULL
    REFERENCES core_documents(id)
    ON DELETE RESTRICT,

  uploaded_by_person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE RESTRICT,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_communication_attachment
    UNIQUE (
      communication_id,
      document_id
    )
);

CREATE TABLE IF NOT EXISTS communication_reads (
  id UUID PRIMARY KEY,

  communication_id UUID NOT NULL
    REFERENCES communications(id)
    ON DELETE CASCADE,

  person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE CASCADE,

  read_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  acknowledged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_communication_read
    UNIQUE (
      communication_id,
      person_id
    ),

  CONSTRAINT ck_communication_acknowledgement
    CHECK (
      acknowledged_at IS NULL
      OR acknowledged_at >= read_at
    )
);

CREATE TABLE IF NOT EXISTS communication_deliveries (
  id UUID PRIMARY KEY,

  communication_id UUID NOT NULL
    REFERENCES communications(id)
    ON DELETE CASCADE,

  person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  channel VARCHAR(20) NOT NULL,
  status VARCHAR(20)
    NOT NULL DEFAULT 'PENDING',

  provider_message_id VARCHAR(255),
  error_message TEXT,

  queued_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_communication_delivery_channel
    CHECK (
      channel IN (
        'IN_APP',
        'EMAIL',
        'WHATSAPP',
        'SMS',
        'PUSH'
      )
    ),

  CONSTRAINT ck_communication_delivery_status
    CHECK (
      status IN (
        'PENDING',
        'SENT',
        'DELIVERED',
        'FAILED',
        'SKIPPED'
      )
    )
);

CREATE TABLE IF NOT EXISTS communication_status_history (
  id UUID PRIMARY KEY,

  communication_id UUID NOT NULL
    REFERENCES communications(id)
    ON DELETE CASCADE,

  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,

  changed_by_person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE RESTRICT,

  remarks TEXT,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_communication_history_from_status
    CHECK (
      from_status IS NULL
      OR from_status IN (
        'DRAFT',
        'SCHEDULED',
        'PUBLISHED',
        'EXPIRED',
        'ARCHIVED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_communication_history_to_status
    CHECK (
      to_status IN (
        'DRAFT',
        'SCHEDULED',
        'PUBLISHED',
        'EXPIRED',
        'ARCHIVED',
        'CANCELLED'
      )
    )
);

CREATE INDEX IF NOT EXISTS
  idx_communications_property
ON communications(property_id);

CREATE INDEX IF NOT EXISTS
  idx_communications_category
ON communications(category_id);

CREATE INDEX IF NOT EXISTS
  idx_communications_type
ON communications(communication_type);

CREATE INDEX IF NOT EXISTS
  idx_communications_priority
ON communications(priority);

CREATE INDEX IF NOT EXISTS
  idx_communications_status
ON communications(status);

CREATE INDEX IF NOT EXISTS
  idx_communications_publish_at
ON communications(publish_at);

CREATE INDEX IF NOT EXISTS
  idx_communications_expires_at
ON communications(expires_at);

CREATE INDEX IF NOT EXISTS
  idx_communications_pinned
ON communications(is_pinned);

CREATE INDEX IF NOT EXISTS
  idx_communications_created_by
ON communications(created_by_person_id);

CREATE INDEX IF NOT EXISTS
  idx_communication_targets_communication
ON communication_targets(communication_id);

CREATE INDEX IF NOT EXISTS
  idx_communication_targets_audience
ON communication_targets(audience_type);

CREATE INDEX IF NOT EXISTS
  idx_communication_targets_zone
ON communication_targets(zone_id);

CREATE INDEX IF NOT EXISTS
  idx_communication_targets_space
ON communication_targets(space_id);

CREATE INDEX IF NOT EXISTS
  idx_communication_targets_person
ON communication_targets(person_id);

CREATE INDEX IF NOT EXISTS
  idx_communication_targets_role
ON communication_targets(role_id);

CREATE INDEX IF NOT EXISTS
  idx_communication_attachments_communication
ON communication_attachments(communication_id);

CREATE INDEX IF NOT EXISTS
  idx_communication_reads_communication
ON communication_reads(communication_id);

CREATE INDEX IF NOT EXISTS
  idx_communication_reads_person
ON communication_reads(person_id);

CREATE INDEX IF NOT EXISTS
  idx_communication_deliveries_communication
ON communication_deliveries(communication_id);

CREATE INDEX IF NOT EXISTS
  idx_communication_deliveries_person
ON communication_deliveries(person_id);

CREATE INDEX IF NOT EXISTS
  idx_communication_deliveries_status
ON communication_deliveries(status);

CREATE INDEX IF NOT EXISTS
  idx_communication_status_history_communication
ON communication_status_history(communication_id);

CREATE INDEX IF NOT EXISTS
  idx_communications_search
ON communications
USING GIN (
  to_tsvector(
    'simple',
    COALESCE(title, '')
    || ' '
    || COALESCE(summary, '')
    || ' '
    || COALESCE(content, '')
  )
);

INSERT INTO communication_categories (
  id,
  code,
  name,
  description
)
VALUES
  (
    '17000000-0000-4000-8000-000000000001',
    'GENERAL',
    'General',
    'General community announcements and notices'
  ),
  (
    '17000000-0000-4000-8000-000000000002',
    'MAINTENANCE',
    'Maintenance',
    'Maintenance shutdowns, repairs and service notices'
  ),
  (
    '17000000-0000-4000-8000-000000000003',
    'SECURITY',
    'Security',
    'Security alerts and access-related notices'
  ),
  (
    '17000000-0000-4000-8000-000000000004',
    'UTILITIES',
    'Utilities',
    'Water, electricity, internet and utility notices'
  ),
  (
    '17000000-0000-4000-8000-000000000005',
    'EVENTS',
    'Events',
    'Community meetings, activities and events'
  ),
  (
    '17000000-0000-4000-8000-000000000006',
    'EMERGENCY',
    'Emergency',
    'Urgent and emergency communications'
  ),
  (
    '17000000-0000-4000-8000-000000000007',
    'BILLING',
    'Billing',
    'Billing, dues, payments and financial notices'
  )
ON CONFLICT (code) DO NOTHING;
