-- Migration: 039-create-core-inventory-batch-foundation.sql
-- PropertyOS Inventory Batch/Lot and expiry tracking foundation.
--
-- The existing immutable stock ledger remains authoritative.
-- A batch identifies a lot for one Inventory item.
-- Batch balances track the batch quantity by store and optional bin.

CREATE TABLE IF NOT EXISTS inventory_batches (
  id UUID PRIMARY KEY,

  item_id UUID NOT NULL
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT,

  batch_number VARCHAR(120)
    NOT NULL,

  manufacturer_batch_number VARCHAR(160),

  manufacture_date DATE,

  expiry_date DATE,

  status VARCHAR(30)
    NOT NULL DEFAULT 'ACTIVE',

  source_type VARCHAR(80),

  source_id UUID,

  source_line_id UUID,

  remarks TEXT,

  metadata JSONB
    NOT NULL DEFAULT '{}'::JSONB,

  created_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_inventory_batch_item_number
    UNIQUE (
      item_id,
      batch_number
    ),

  CONSTRAINT ck_inventory_batch_number
    CHECK (
      LENGTH(TRIM(batch_number)) > 0
    ),

  CONSTRAINT ck_inventory_batch_status
    CHECK (
      status IN (
        'ACTIVE',
        'HOLD',
        'EXPIRED',
        'CLOSED'
      )
    ),

  CONSTRAINT ck_inventory_batch_dates
    CHECK (
      manufacture_date IS NULL
      OR expiry_date IS NULL
      OR expiry_date >= manufacture_date
    )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_batches_item
ON inventory_batches(
  item_id,
  status
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_batches_expiry
ON inventory_batches(
  expiry_date
)
WHERE expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_inventory_batches_source
ON inventory_batches(
  source_type,
  source_id
)
WHERE source_type IS NOT NULL;

CREATE TABLE IF NOT EXISTS inventory_batch_balances (
  id UUID PRIMARY KEY,

  batch_id UUID NOT NULL
    REFERENCES inventory_batches(id)
    ON DELETE RESTRICT,

  item_id UUID NOT NULL
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT,

  store_id UUID NOT NULL
    REFERENCES inventory_stores(id)
    ON DELETE RESTRICT,

  bin_location_id UUID
    REFERENCES inventory_bin_locations(id)
    ON DELETE SET NULL,

  quantity_on_hand NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  reserved_quantity NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  average_unit_cost NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  last_movement_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_inventory_batch_balance_quantities
    CHECK (
      quantity_on_hand >= 0
      AND reserved_quantity >= 0
      AND reserved_quantity <= quantity_on_hand
    ),

  CONSTRAINT ck_inventory_batch_balance_cost
    CHECK (
      average_unit_cost >= 0
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_inventory_batch_balance_location
ON inventory_batch_balances(
  batch_id,
  item_id,
  store_id,
  COALESCE(
    bin_location_id,
    '00000000-0000-0000-0000-000000000000'::UUID
  )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_batch_balances_batch
ON inventory_batch_balances(
  batch_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_batch_balances_item_store
ON inventory_batch_balances(
  item_id,
  store_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_batch_balances_bin
ON inventory_batch_balances(
  bin_location_id
)
WHERE bin_location_id IS NOT NULL;

ALTER TABLE inventory_stock_ledger
  ADD COLUMN IF NOT EXISTS batch_id UUID
    REFERENCES inventory_batches(id)
    ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_ledger_batch
ON inventory_stock_ledger(
  batch_id,
  movement_date DESC
)
WHERE batch_id IS NOT NULL;
