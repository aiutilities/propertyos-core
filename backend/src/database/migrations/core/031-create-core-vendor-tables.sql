-- Core Vendor Management Tables
-- Migration: 031-create-core-vendor-tables.sql

CREATE TABLE IF NOT EXISTS vendor_categories (
  id UUID PRIMARY KEY,

  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY,

  vendor_number VARCHAR(60) NOT NULL UNIQUE,

  legal_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,

  vendor_type VARCHAR(30) NOT NULL DEFAULT 'COMPANY',
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(500),

  tax_identifier VARCHAR(100),
  pan_number VARCHAR(50),
  registration_number VARCHAR(100),

  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(150),
  state VARCHAR(150),
  country VARCHAR(150),
  postal_code VARCHAR(30),

  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',

  created_by_person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE RESTRICT,

  updated_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  blocked_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_vendor_type
    CHECK (
      vendor_type IN (
        'COMPANY',
        'INDIVIDUAL',
        'AGENCY',
        'CONTRACTOR',
        'CONSULTANT'
      )
    ),

  CONSTRAINT ck_vendor_status
    CHECK (
      status IN (
        'DRAFT',
        'ACTIVE',
        'SUSPENDED',
        'BLOCKED',
        'ARCHIVED'
      )
    )
);

CREATE TABLE IF NOT EXISTS vendor_contacts (
  id UUID PRIMARY KEY,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE CASCADE,

  contact_type VARCHAR(30) NOT NULL DEFAULT 'PRIMARY',

  name VARCHAR(255) NOT NULL,
  designation VARCHAR(150),
  email VARCHAR(255),
  phone VARCHAR(50),

  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_vendor_contact_type
    CHECK (
      contact_type IN (
        'PRIMARY',
        'BILLING',
        'OPERATIONS',
        'ESCALATION',
        'EMERGENCY'
      )
    )
);

CREATE TABLE IF NOT EXISTS vendor_property_coverage (
  id UUID PRIMARY KEY,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE CASCADE,

  property_id UUID NOT NULL
    REFERENCES properties(id)
    ON DELETE CASCADE,

  zone_id UUID
    REFERENCES zones(id)
    ON DELETE CASCADE,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_vendor_property_coverage
    UNIQUE (
      vendor_id,
      property_id,
      zone_id
    )
);

CREATE TABLE IF NOT EXISTS vendor_service_categories (
  id UUID PRIMARY KEY,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE CASCADE,

  category_id UUID NOT NULL
    REFERENCES vendor_categories(id)
    ON DELETE RESTRICT,

  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_vendor_service_category
    UNIQUE (
      vendor_id,
      category_id
    )
);

CREATE TABLE IF NOT EXISTS vendor_contracts (
  id UUID PRIMARY KEY,

  contract_number VARCHAR(60) NOT NULL UNIQUE,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE CASCADE,

  property_id UUID
    REFERENCES properties(id)
    ON DELETE SET NULL,

  contract_type VARCHAR(40) NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,

  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  contract_value NUMERIC(15, 2),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',

  response_sla_minutes INTEGER,
  resolution_sla_minutes INTEGER,

  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  renewal_notice_days INTEGER NOT NULL DEFAULT 30,

  created_by_person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE RESTRICT,

  approved_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  terminated_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  activated_at TIMESTAMPTZ,
  terminated_at TIMESTAMPTZ,
  renewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_vendor_contract_type
    CHECK (
      contract_type IN (
        'AMC',
        'RATE_CONTRACT',
        'SERVICE_AGREEMENT',
        'MANPOWER',
        'PROJECT',
        'SUPPLY',
        'CONSULTING',
        'OTHER'
      )
    ),

  CONSTRAINT ck_vendor_contract_status
    CHECK (
      status IN (
        'DRAFT',
        'ACTIVE',
        'EXPIRED',
        'TERMINATED',
        'RENEWED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_vendor_contract_dates
    CHECK (end_date >= start_date),

  CONSTRAINT ck_vendor_contract_value
    CHECK (
      contract_value IS NULL
      OR contract_value >= 0
    ),

  CONSTRAINT ck_vendor_contract_response_sla
    CHECK (
      response_sla_minutes IS NULL
      OR response_sla_minutes > 0
    ),

  CONSTRAINT ck_vendor_contract_resolution_sla
    CHECK (
      resolution_sla_minutes IS NULL
      OR resolution_sla_minutes > 0
    ),

  CONSTRAINT ck_vendor_contract_renewal_notice
    CHECK (renewal_notice_days >= 0)
);

CREATE TABLE IF NOT EXISTS vendor_contract_documents (
  id UUID PRIMARY KEY,

  contract_id UUID NOT NULL
    REFERENCES vendor_contracts(id)
    ON DELETE CASCADE,

  document_id UUID NOT NULL
    REFERENCES core_documents(id),

  uploaded_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_vendor_contract_document
    UNIQUE (
      contract_id,
      document_id
    )
);

CREATE TABLE IF NOT EXISTS vendor_compliance_documents (
  id UUID PRIMARY KEY,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE CASCADE,

  compliance_type VARCHAR(40) NOT NULL,

  document_id UUID NOT NULL
    REFERENCES core_documents(id),

  reference_number VARCHAR(150),

  issued_at DATE,
  expires_at DATE,

  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

  verified_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  verified_at TIMESTAMPTZ,

  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_vendor_compliance_type
    CHECK (
      compliance_type IN (
        'GST',
        'PAN',
        'INSURANCE',
        'LICENCE',
        'CERTIFICATION',
        'LABOUR_REGISTRATION',
        'POLICE_VERIFICATION',
        'SAFETY_CERTIFICATE',
        'OTHER'
      )
    ),

  CONSTRAINT ck_vendor_compliance_status
    CHECK (
      status IN (
        'PENDING',
        'VERIFIED',
        'REJECTED',
        'EXPIRED',
        'WAIVED'
      )
    ),

  CONSTRAINT ck_vendor_compliance_dates
    CHECK (
      expires_at IS NULL
      OR issued_at IS NULL
      OR expires_at >= issued_at
    ),

  CONSTRAINT uq_vendor_compliance_document
    UNIQUE (
      vendor_id,
      compliance_type,
      document_id
    )
);

CREATE TABLE IF NOT EXISTS vendor_work_orders (
  id UUID PRIMARY KEY,

  work_order_number VARCHAR(60) NOT NULL UNIQUE,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE RESTRICT,

  property_id UUID NOT NULL
    REFERENCES properties(id),

  zone_id UUID
    REFERENCES zones(id)
    ON DELETE SET NULL,

  space_id UUID
    REFERENCES spaces(id)
    ON DELETE SET NULL,

  contract_id UUID
    REFERENCES vendor_contracts(id)
    ON DELETE SET NULL,

  maintenance_ticket_id UUID
    REFERENCES maintenance_tickets(id)
    ON DELETE SET NULL,

  helpdesk_ticket_id UUID
    REFERENCES helpdesk_tickets(id)
    ON DELETE SET NULL,

  facility_asset_id UUID
    REFERENCES facility_assets(id)
    ON DELETE SET NULL,

  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,

  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

  scheduled_start_at TIMESTAMPTZ,
  scheduled_end_at TIMESTAMPTZ,

  actual_start_at TIMESTAMPTZ,
  actual_end_at TIMESTAMPTZ,

  estimated_cost NUMERIC(15, 2),
  actual_cost NUMERIC(15, 2),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',

  assigned_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  accepted_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  completed_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  cancelled_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  completion_notes TEXT,
  cancellation_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_vendor_work_order_priority
    CHECK (
      priority IN (
        'LOW',
        'MEDIUM',
        'HIGH',
        'URGENT'
      )
    ),

  CONSTRAINT ck_vendor_work_order_status
    CHECK (
      status IN (
        'DRAFT',
        'ISSUED',
        'ACCEPTED',
        'IN_PROGRESS',
        'ON_HOLD',
        'COMPLETED',
        'CANCELLED',
        'REJECTED'
      )
    ),

  CONSTRAINT ck_vendor_work_order_schedule
    CHECK (
      scheduled_end_at IS NULL
      OR scheduled_start_at IS NULL
      OR scheduled_end_at >= scheduled_start_at
    ),

  CONSTRAINT ck_vendor_work_order_actual_dates
    CHECK (
      actual_end_at IS NULL
      OR actual_start_at IS NULL
      OR actual_end_at >= actual_start_at
    ),

  CONSTRAINT ck_vendor_work_order_estimated_cost
    CHECK (
      estimated_cost IS NULL
      OR estimated_cost >= 0
    ),

  CONSTRAINT ck_vendor_work_order_actual_cost
    CHECK (
      actual_cost IS NULL
      OR actual_cost >= 0
    )
);

CREATE TABLE IF NOT EXISTS vendor_work_order_history (
  id UUID PRIMARY KEY,

  work_order_id UUID NOT NULL
    REFERENCES vendor_work_orders(id)
    ON DELETE CASCADE,

  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,

  changed_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_vendor_work_order_history_from
    CHECK (
      from_status IS NULL
      OR from_status IN (
        'DRAFT',
        'ISSUED',
        'ACCEPTED',
        'IN_PROGRESS',
        'ON_HOLD',
        'COMPLETED',
        'CANCELLED',
        'REJECTED'
      )
    ),

  CONSTRAINT ck_vendor_work_order_history_to
    CHECK (
      to_status IN (
        'DRAFT',
        'ISSUED',
        'ACCEPTED',
        'IN_PROGRESS',
        'ON_HOLD',
        'COMPLETED',
        'CANCELLED',
        'REJECTED'
      )
    )
);

CREATE TABLE IF NOT EXISTS vendor_ratings (
  id UUID PRIMARY KEY,

  vendor_id UUID NOT NULL
    REFERENCES vendors(id)
    ON DELETE CASCADE,

  work_order_id UUID
    REFERENCES vendor_work_orders(id)
    ON DELETE SET NULL,

  property_id UUID
    REFERENCES properties(id)
    ON DELETE SET NULL,

  rated_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  rating INTEGER NOT NULL,

  quality_rating INTEGER,
  timeliness_rating INTEGER,
  professionalism_rating INTEGER,

  comments TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_vendor_rating
    CHECK (rating BETWEEN 1 AND 5),

  CONSTRAINT ck_vendor_quality_rating
    CHECK (
      quality_rating IS NULL
      OR quality_rating BETWEEN 1 AND 5
    ),

  CONSTRAINT ck_vendor_timeliness_rating
    CHECK (
      timeliness_rating IS NULL
      OR timeliness_rating BETWEEN 1 AND 5
    ),

  CONSTRAINT ck_vendor_professionalism_rating
    CHECK (
      professionalism_rating IS NULL
      OR professionalism_rating BETWEEN 1 AND 5
    ),

  CONSTRAINT uq_vendor_work_order_rating
    UNIQUE (
      vendor_id,
      work_order_id,
      rated_by_person_id
    )
);

CREATE INDEX IF NOT EXISTS idx_vendors_status
ON vendors(status);

CREATE INDEX IF NOT EXISTS idx_vendors_type
ON vendors(vendor_type);

CREATE INDEX IF NOT EXISTS idx_vendors_legal_name
ON vendors(legal_name);

CREATE INDEX IF NOT EXISTS idx_vendors_display_name
ON vendors(display_name);

CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor
ON vendor_contacts(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_property_coverage_vendor
ON vendor_property_coverage(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_property_coverage_property
ON vendor_property_coverage(property_id);

CREATE INDEX IF NOT EXISTS idx_vendor_property_coverage_zone
ON vendor_property_coverage(zone_id);

CREATE INDEX IF NOT EXISTS idx_vendor_service_categories_vendor
ON vendor_service_categories(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_service_categories_category
ON vendor_service_categories(category_id);

CREATE INDEX IF NOT EXISTS idx_vendor_contracts_vendor
ON vendor_contracts(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_contracts_property
ON vendor_contracts(property_id);

CREATE INDEX IF NOT EXISTS idx_vendor_contracts_status
ON vendor_contracts(status);

CREATE INDEX IF NOT EXISTS idx_vendor_contracts_end_date
ON vendor_contracts(end_date);

CREATE INDEX IF NOT EXISTS idx_vendor_compliance_vendor
ON vendor_compliance_documents(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_compliance_status
ON vendor_compliance_documents(status);

CREATE INDEX IF NOT EXISTS idx_vendor_compliance_expiry
ON vendor_compliance_documents(expires_at);

CREATE INDEX IF NOT EXISTS idx_vendor_work_orders_vendor
ON vendor_work_orders(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendor_work_orders_property
ON vendor_work_orders(property_id);

CREATE INDEX IF NOT EXISTS idx_vendor_work_orders_status
ON vendor_work_orders(status);

CREATE INDEX IF NOT EXISTS idx_vendor_work_orders_priority
ON vendor_work_orders(priority);

CREATE INDEX IF NOT EXISTS idx_vendor_work_orders_contract
ON vendor_work_orders(contract_id);

CREATE INDEX IF NOT EXISTS idx_vendor_work_orders_maintenance
ON vendor_work_orders(maintenance_ticket_id);

CREATE INDEX IF NOT EXISTS idx_vendor_work_orders_helpdesk
ON vendor_work_orders(helpdesk_ticket_id);

CREATE INDEX IF NOT EXISTS idx_vendor_work_orders_asset
ON vendor_work_orders(facility_asset_id);

CREATE INDEX IF NOT EXISTS idx_vendor_work_order_history
ON vendor_work_order_history(work_order_id);

CREATE INDEX IF NOT EXISTS idx_vendor_ratings_vendor
ON vendor_ratings(vendor_id);

CREATE INDEX IF NOT EXISTS idx_vendors_search
ON vendors
USING GIN (
  to_tsvector(
    'simple',
    COALESCE(vendor_number, '')
    || ' '
    || COALESCE(legal_name, '')
    || ' '
    || COALESCE(display_name, '')
    || ' '
    || COALESCE(email, '')
    || ' '
    || COALESCE(phone, '')
    || ' '
    || COALESCE(city, '')
  )
);

INSERT INTO vendor_categories (
  id,
  code,
  name,
  description
)
VALUES
  (
    '18000000-0000-4000-8000-000000000001',
    'ELECTRICAL',
    'Electrical',
    'Electrical installation, repair and maintenance services'
  ),
  (
    '18000000-0000-4000-8000-000000000002',
    'PLUMBING',
    'Plumbing',
    'Plumbing, water supply and drainage services'
  ),
  (
    '18000000-0000-4000-8000-000000000003',
    'HOUSEKEEPING',
    'Housekeeping',
    'Cleaning, housekeeping and sanitation services'
  ),
  (
    '18000000-0000-4000-8000-000000000004',
    'SECURITY',
    'Security',
    'Security guards, surveillance and access services'
  ),
  (
    '18000000-0000-4000-8000-000000000005',
    'HVAC',
    'HVAC',
    'Air conditioning, ventilation and cooling services'
  ),
  (
    '18000000-0000-4000-8000-000000000006',
    'LIFT',
    'Lift and Elevator',
    'Lift, elevator and escalator maintenance services'
  ),
  (
    '18000000-0000-4000-8000-000000000007',
    'PEST_CONTROL',
    'Pest Control',
    'Pest-control and fumigation services'
  ),
  (
    '18000000-0000-4000-8000-000000000008',
    'LANDSCAPING',
    'Landscaping',
    'Gardening, landscaping and outdoor maintenance'
  ),
  (
    '18000000-0000-4000-8000-000000000009',
    'IT_NETWORKING',
    'IT and Networking',
    'Internet, networking, CCTV and IT support services'
  ),
  (
    '18000000-0000-4000-8000-000000000010',
    'CIVIL_WORKS',
    'Civil Works',
    'Construction, masonry, painting and civil maintenance'
  ),
  (
    '18000000-0000-4000-8000-000000000011',
    'WASTE_MANAGEMENT',
    'Waste Management',
    'Waste collection, segregation and disposal services'
  ),
  (
    '18000000-0000-4000-8000-000000000012',
    'OTHER',
    'Other',
    'Other vendor services'
  )
ON CONFLICT (code) DO NOTHING;
