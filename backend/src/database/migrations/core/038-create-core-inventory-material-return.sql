-- Migration: 038-create-core-inventory-material-return.sql
-- PropertyOS Inventory Material Return document foundation.

CREATE TABLE IF NOT EXISTS inventory_material_returns (
  id UUID PRIMARY KEY,

  return_number VARCHAR(80)
    NOT NULL UNIQUE,

  property_id UUID NOT NULL
    REFERENCES properties(id)
    ON DELETE RESTRICT,

  store_id UUID NOT NULL
    REFERENCES inventory_stores(id)
    ON DELETE RESTRICT,

  material_issue_id UUID
    REFERENCES inventory_material_issues(id)
    ON DELETE SET NULL,

  status VARCHAR(30)
    NOT NULL DEFAULT 'DRAFT',

  return_date DATE
    NOT NULL,

  reason_code VARCHAR(80)
    NOT NULL,

  reason_description TEXT,

  returned_by_person_id UUID
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

  CONSTRAINT ck_inventory_material_return_status
    CHECK (
      status IN (
        'DRAFT',
        'POSTED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_inventory_material_return_posted_state
    CHECK (
      status <> 'POSTED'
      OR (
        posted_by_person_id IS NOT NULL
        AND posted_at IS NOT NULL
      )
    ),

  CONSTRAINT ck_inventory_material_return_cancelled_state
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
  idx_inventory_material_returns_property
ON inventory_material_returns(
  property_id,
  return_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_returns_store
ON inventory_material_returns(
  store_id,
  return_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_returns_issue
ON inventory_material_returns(
  material_issue_id
)
WHERE material_issue_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_returns_status
ON inventory_material_returns(status);

CREATE TABLE IF NOT EXISTS inventory_material_return_items (
  id UUID PRIMARY KEY,

  material_return_id UUID NOT NULL
    REFERENCES inventory_material_returns(id)
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

  CONSTRAINT ck_inventory_material_return_quantity
    CHECK (
      quantity > 0
    ),

  CONSTRAINT ck_inventory_material_return_cost
    CHECK (
      unit_cost >= 0
    ),

  CONSTRAINT uq_inventory_material_return_item
    UNIQUE (
      material_return_id,
      item_id,
      bin_location_id
    )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_return_items_return
ON inventory_material_return_items(
  material_return_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_return_items_item
ON inventory_material_return_items(
  item_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_return_items_bin
ON inventory_material_return_items(
  bin_location_id
);
