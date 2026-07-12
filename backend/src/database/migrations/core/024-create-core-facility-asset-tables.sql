-- Core Facility and Asset Management
-- Migration: 024-create-core-facility-asset-tables.sql

CREATE TABLE IF NOT EXISTS asset_categories (
  id UUID PRIMARY KEY,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facility_assets (
  id UUID PRIMARY KEY,
  asset_number VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,

  category_id UUID NOT NULL
    REFERENCES asset_categories(id),

  property_id UUID NOT NULL
    REFERENCES properties(id),

  zone_id UUID
    REFERENCES zones(id)
    ON DELETE SET NULL,

  space_id UUID
    REFERENCES spaces(id)
    ON DELETE SET NULL,

  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serial_number VARCHAR(255),
  qr_token UUID NOT NULL UNIQUE,

  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  condition VARCHAR(30) NOT NULL DEFAULT 'GOOD',

  purchase_date DATE,
  purchase_cost NUMERIC(14,2),
  warranty_expires_at TIMESTAMPTZ,

  vendor_name VARCHAR(255),
  vendor_contact VARCHAR(255),

  installed_at TIMESTAMPTZ,
  retired_at TIMESTAMPTZ,
  disposed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_facility_asset_status
    CHECK (
      status IN (
        'DRAFT',
        'ACTIVE',
        'IN_MAINTENANCE',
        'OUT_OF_SERVICE',
        'RETIRED',
        'DISPOSED'
      )
    ),

  CONSTRAINT ck_facility_asset_condition
    CHECK (
      condition IN (
        'NEW',
        'GOOD',
        'FAIR',
        'POOR',
        'DAMAGED'
      )
    )
);

CREATE TABLE IF NOT EXISTS facility_asset_history (
  id UUID PRIMARY KEY,

  asset_id UUID NOT NULL
    REFERENCES facility_assets(id)
    ON DELETE CASCADE,

  from_status VARCHAR(30),
  to_status VARCHAR(30) NOT NULL,

  changed_by_person_id UUID NOT NULL
    REFERENCES persons(id),

  remarks TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS preventive_maintenance_plans (
  id UUID PRIMARY KEY,

  asset_id UUID NOT NULL
    REFERENCES facility_assets(id)
    ON DELETE CASCADE,

  name VARCHAR(255) NOT NULL,
  description TEXT,

  frequency VARCHAR(30) NOT NULL,
  interval_days INTEGER,

  next_due_at TIMESTAMPTZ NOT NULL,
  last_completed_at TIMESTAMPTZ,

  assigned_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  is_active BOOLEAN NOT NULL DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_preventive_frequency
    CHECK (
      frequency IN (
        'DAILY',
        'WEEKLY',
        'MONTHLY',
        'QUARTERLY',
        'HALF_YEARLY',
        'YEARLY',
        'CUSTOM'
      )
    ),

  CONSTRAINT ck_preventive_interval
    CHECK (
      interval_days IS NULL OR interval_days > 0
    )
);

CREATE INDEX IF NOT EXISTS idx_facility_asset_property
ON facility_assets(property_id);

CREATE INDEX IF NOT EXISTS idx_facility_asset_zone
ON facility_assets(zone_id);

CREATE INDEX IF NOT EXISTS idx_facility_asset_space
ON facility_assets(space_id);

CREATE INDEX IF NOT EXISTS idx_facility_asset_category
ON facility_assets(category_id);

CREATE INDEX IF NOT EXISTS idx_facility_asset_status
ON facility_assets(status);

CREATE INDEX IF NOT EXISTS idx_facility_asset_condition
ON facility_assets(condition);

CREATE INDEX IF NOT EXISTS idx_facility_asset_serial
ON facility_assets(serial_number);

CREATE INDEX IF NOT EXISTS idx_facility_history_asset
ON facility_asset_history(asset_id);

CREATE INDEX IF NOT EXISTS idx_preventive_plan_asset
ON preventive_maintenance_plans(asset_id);

CREATE INDEX IF NOT EXISTS idx_preventive_plan_next_due
ON preventive_maintenance_plans(next_due_at);

INSERT INTO asset_categories (
  id,
  code,
  name,
  description
)
VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    'ELECTRICAL',
    'Electrical Equipment',
    'Electrical infrastructure and equipment'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    'PLUMBING',
    'Plumbing Equipment',
    'Water, drainage and plumbing equipment'
  ),
  (
    '20000000-0000-4000-8000-000000000003',
    'HVAC',
    'HVAC',
    'Heating, ventilation and air-conditioning equipment'
  ),
  (
    '20000000-0000-4000-8000-000000000004',
    'SECURITY',
    'Security Equipment',
    'CCTV, access control and security equipment'
  ),
  (
    '20000000-0000-4000-8000-000000000005',
    'FIRE_SAFETY',
    'Fire Safety',
    'Fire extinguishers, alarms and emergency equipment'
  ),
  (
    '20000000-0000-4000-8000-000000000006',
    'HOUSEKEEPING',
    'Housekeeping Equipment',
    'Cleaning and housekeeping equipment'
  ),
  (
    '20000000-0000-4000-8000-000000000007',
    'OTHER',
    'Other',
    'Assets not covered by another category'
  )
ON CONFLICT (code) DO NOTHING;
