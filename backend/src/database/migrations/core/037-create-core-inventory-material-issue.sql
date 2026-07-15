-- Migration: 037-create-core-inventory-material-issue.sql
-- PropertyOS Inventory Material Issue document foundation.

CREATE TABLE IF NOT EXISTS inventory_material_issues (
  id UUID PRIMARY KEY,

  issue_number VARCHAR(80)
    NOT NULL UNIQUE,

  property_id UUID NOT NULL
    REFERENCES properties(id)
    ON DELETE RESTRICT,

  store_id UUID NOT NULL
    REFERENCES inventory_stores(id)
    ON DELETE RESTRICT,

  status VARCHAR(30)
    NOT NULL DEFAULT 'DRAFT',

  issue_date DATE
    NOT NULL,

  reason_code VARCHAR(80)
    NOT NULL,

  reason_description TEXT,

  requested_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  created_by_person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE RESTRICT,

  posted_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  cancelled_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  posted_at TIMESTAMPTZ,

  cancelled_at TIMESTAMPTZ,

  cancellation_reason TEXT,

  remarks TEXT,

  metadata JSONB
    NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_inventory_material_issue_status
    CHECK (
      status IN (
        'DRAFT',
        'POSTED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_inventory_material_issue_posted_state
    CHECK (
      status <> 'POSTED'
      OR (
        posted_by_person_id IS NOT NULL
        AND posted_at IS NOT NULL
      )
    ),

  CONSTRAINT ck_inventory_material_issue_cancelled_state
    CHECK (
      status <> 'CANCELLED'
      OR (
        cancelled_by_person_id IS NOT NULL
        AND cancelled_at IS NOT NULL
        AND cancellation_reason IS NOT NULL
      )
    )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_issues_property
ON inventory_material_issues(
  property_id,
  issue_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_issues_store
ON inventory_material_issues(
  store_id,
  issue_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_issues_status
ON inventory_material_issues(status);

CREATE TABLE IF NOT EXISTS inventory_material_issue_items (
  id UUID PRIMARY KEY,

  material_issue_id UUID NOT NULL
    REFERENCES inventory_material_issues(id)
    ON DELETE CASCADE,

  item_id UUID NOT NULL
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT,

  bin_location_id UUID
    REFERENCES inventory_bin_locations(id)
    ON DELETE SET NULL,

  quantity NUMERIC(18,6)
    NOT NULL,

  unit_cost NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  remarks TEXT,

  metadata JSONB
    NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_inventory_material_issue_item_quantity
    CHECK (
      quantity > 0
    ),

  CONSTRAINT ck_inventory_material_issue_item_cost
    CHECK (
      unit_cost >= 0
    ),

  CONSTRAINT uq_inventory_material_issue_item
    UNIQUE (
      material_issue_id,
      item_id,
      bin_location_id
    )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_issue_items_issue
ON inventory_material_issue_items(
  material_issue_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_issue_items_item
ON inventory_material_issue_items(
  item_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_issue_items_bin
ON inventory_material_issue_items(
  bin_location_id
);
