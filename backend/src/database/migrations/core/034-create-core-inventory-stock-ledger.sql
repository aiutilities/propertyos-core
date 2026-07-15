-- Migration: 034-create-core-inventory-stock-ledger.sql
-- PropertyOS immutable Inventory stock-ledger foundation.

CREATE TABLE IF NOT EXISTS inventory_stock_ledger (
  id UUID PRIMARY KEY,

  movement_number VARCHAR(80)
    NOT NULL UNIQUE,

  movement_type VARCHAR(40)
    NOT NULL,

  item_id UUID NOT NULL
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT,

  store_id UUID NOT NULL
    REFERENCES inventory_stores(id)
    ON DELETE RESTRICT,

  bin_location_id UUID
    REFERENCES inventory_bin_locations(id)
    ON DELETE SET NULL,

  quantity_delta NUMERIC(18,6)
    NOT NULL,

  quantity_before NUMERIC(18,6)
    NOT NULL,

  quantity_after NUMERIC(18,6)
    NOT NULL,

  reserved_quantity_delta NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  reserved_quantity_before NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  reserved_quantity_after NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  unit_cost NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  total_cost NUMERIC(18,6)
    GENERATED ALWAYS AS (
      ABS(quantity_delta) * unit_cost
    ) STORED,

  average_unit_cost_before NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  average_unit_cost_after NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  source_type VARCHAR(80)
    NOT NULL,

  source_id UUID,

  source_line_id UUID,

  reference_number VARCHAR(160),

  idempotency_key VARCHAR(255),

  correlation_id VARCHAR(255),

  movement_date TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  posted_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  remarks TEXT,

  metadata JSONB
    NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_inventory_stock_ledger_type
    CHECK (
      movement_type IN (
        'OPENING',
        'RECEIPT',
        'ISSUE',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT',
        'RESERVATION',
        'RESERVATION_RELEASE',
        'REVERSAL'
      )
    ),

  CONSTRAINT ck_inventory_stock_ledger_quantity
    CHECK (
      quantity_after =
        quantity_before + quantity_delta
    ),

  CONSTRAINT ck_inventory_stock_ledger_reserved_quantity
    CHECK (
      reserved_quantity_after =
        reserved_quantity_before +
        reserved_quantity_delta
      AND reserved_quantity_after >= 0
    ),

  CONSTRAINT ck_inventory_stock_ledger_costs
    CHECK (
      unit_cost >= 0
      AND average_unit_cost_before >= 0
      AND average_unit_cost_after >= 0
    ),

  CONSTRAINT ck_inventory_stock_ledger_movement_sign
    CHECK (
      (
        movement_type IN (
          'OPENING',
          'RECEIPT',
          'TRANSFER_IN',
          'ADJUSTMENT_IN'
        )
        AND quantity_delta > 0
      )
      OR
      (
        movement_type IN (
          'ISSUE',
          'TRANSFER_OUT',
          'ADJUSTMENT_OUT'
        )
        AND quantity_delta < 0
      )
      OR
      (
        movement_type IN (
          'RESERVATION',
          'RESERVATION_RELEASE'
        )
        AND quantity_delta = 0
        AND reserved_quantity_delta <> 0
      )
      OR
      (
        movement_type = 'REVERSAL'
        AND quantity_delta <> 0
      )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_inventory_stock_ledger_idempotency
ON inventory_stock_ledger(idempotency_key)
WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_ledger_item
ON inventory_stock_ledger(
  item_id,
  movement_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_ledger_store
ON inventory_stock_ledger(
  store_id,
  movement_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_ledger_bin
ON inventory_stock_ledger(
  bin_location_id,
  movement_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_ledger_source
ON inventory_stock_ledger(
  source_type,
  source_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_ledger_correlation
ON inventory_stock_ledger(correlation_id)
WHERE correlation_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS inventory_stock_reservations (
  id UUID PRIMARY KEY,

  reservation_number VARCHAR(80)
    NOT NULL UNIQUE,

  item_id UUID NOT NULL
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT,

  store_id UUID NOT NULL
    REFERENCES inventory_stores(id)
    ON DELETE RESTRICT,

  bin_location_id UUID
    REFERENCES inventory_bin_locations(id)
    ON DELETE SET NULL,

  quantity NUMERIC(18,6)
    NOT NULL,

  fulfilled_quantity NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  released_quantity NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  status VARCHAR(30)
    NOT NULL DEFAULT 'ACTIVE',

  source_type VARCHAR(80)
    NOT NULL,

  source_id UUID,

  reference_number VARCHAR(160),

  reserved_for_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  created_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  released_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  fulfilled_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  expires_at TIMESTAMPTZ,

  released_at TIMESTAMPTZ,

  fulfilled_at TIMESTAMPTZ,

  remarks TEXT,

  metadata JSONB
    NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_inventory_reservation_status
    CHECK (
      status IN (
        'ACTIVE',
        'PARTIALLY_FULFILLED',
        'FULFILLED',
        'RELEASED',
        'EXPIRED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_inventory_reservation_quantities
    CHECK (
      quantity > 0
      AND fulfilled_quantity >= 0
      AND released_quantity >= 0
      AND fulfilled_quantity +
          released_quantity <= quantity
    )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_reservations_item
ON inventory_stock_reservations(
  item_id,
  status
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_reservations_store
ON inventory_stock_reservations(
  store_id,
  status
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_reservations_source
ON inventory_stock_reservations(
  source_type,
  source_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_reservations_expiry
ON inventory_stock_reservations(expires_at)
WHERE status IN (
  'ACTIVE',
  'PARTIALLY_FULFILLED'
);

CREATE TABLE IF NOT EXISTS inventory_stock_adjustments (
  id UUID PRIMARY KEY,

  adjustment_number VARCHAR(80)
    NOT NULL UNIQUE,

  property_id UUID NOT NULL
    REFERENCES properties(id)
    ON DELETE RESTRICT,

  store_id UUID NOT NULL
    REFERENCES inventory_stores(id)
    ON DELETE RESTRICT,

  status VARCHAR(30)
    NOT NULL DEFAULT 'DRAFT',

  adjustment_date DATE
    NOT NULL,

  reason_code VARCHAR(80)
    NOT NULL,

  reason_description TEXT,

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

  CONSTRAINT ck_inventory_adjustment_status
    CHECK (
      status IN (
        'DRAFT',
        'POSTED',
        'CANCELLED'
      )
    )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_adjustments_property
ON inventory_stock_adjustments(
  property_id,
  adjustment_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_adjustments_store
ON inventory_stock_adjustments(
  store_id,
  adjustment_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_adjustments_status
ON inventory_stock_adjustments(status);

CREATE TABLE IF NOT EXISTS inventory_stock_adjustment_items (
  id UUID PRIMARY KEY,

  adjustment_id UUID NOT NULL
    REFERENCES inventory_stock_adjustments(id)
    ON DELETE CASCADE,

  item_id UUID NOT NULL
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT,

  bin_location_id UUID
    REFERENCES inventory_bin_locations(id)
    ON DELETE SET NULL,

  quantity_delta NUMERIC(18,6)
    NOT NULL,

  unit_cost NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  remarks TEXT,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_inventory_adjustment_item
    UNIQUE (
      adjustment_id,
      item_id,
      bin_location_id
    ),

  CONSTRAINT ck_inventory_adjustment_item_quantity
    CHECK (
      quantity_delta <> 0
    ),

  CONSTRAINT ck_inventory_adjustment_item_cost
    CHECK (
      unit_cost >= 0
    )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_adjustment_items_adjustment
ON inventory_stock_adjustment_items(
  adjustment_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_adjustment_items_item
ON inventory_stock_adjustment_items(
  item_id
);

CREATE TABLE IF NOT EXISTS inventory_stock_transfers (
  id UUID PRIMARY KEY,

  transfer_number VARCHAR(80)
    NOT NULL UNIQUE,

  property_id UUID NOT NULL
    REFERENCES properties(id)
    ON DELETE RESTRICT,

  source_store_id UUID NOT NULL
    REFERENCES inventory_stores(id)
    ON DELETE RESTRICT,

  destination_store_id UUID NOT NULL
    REFERENCES inventory_stores(id)
    ON DELETE RESTRICT,

  status VARCHAR(30)
    NOT NULL DEFAULT 'DRAFT',

  transfer_date DATE
    NOT NULL,

  created_by_person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE RESTRICT,

  dispatched_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  received_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  cancelled_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  dispatched_at TIMESTAMPTZ,

  received_at TIMESTAMPTZ,

  cancelled_at TIMESTAMPTZ,

  cancellation_reason TEXT,

  remarks TEXT,

  metadata JSONB
    NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_inventory_transfer_status
    CHECK (
      status IN (
        'DRAFT',
        'DISPATCHED',
        'RECEIVED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_inventory_transfer_stores
    CHECK (
      source_store_id <>
      destination_store_id
    )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_transfers_source
ON inventory_stock_transfers(
  source_store_id,
  transfer_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_transfers_destination
ON inventory_stock_transfers(
  destination_store_id,
  transfer_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_transfers_status
ON inventory_stock_transfers(status);

CREATE TABLE IF NOT EXISTS inventory_stock_transfer_items (
  id UUID PRIMARY KEY,

  transfer_id UUID NOT NULL
    REFERENCES inventory_stock_transfers(id)
    ON DELETE CASCADE,

  item_id UUID NOT NULL
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT,

  source_bin_location_id UUID
    REFERENCES inventory_bin_locations(id)
    ON DELETE SET NULL,

  destination_bin_location_id UUID
    REFERENCES inventory_bin_locations(id)
    ON DELETE SET NULL,

  quantity NUMERIC(18,6)
    NOT NULL,

  dispatched_quantity NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  received_quantity NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  unit_cost NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  remarks TEXT,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_inventory_transfer_item
    UNIQUE (
      transfer_id,
      item_id,
      source_bin_location_id,
      destination_bin_location_id
    ),

  CONSTRAINT ck_inventory_transfer_item_quantities
    CHECK (
      quantity > 0
      AND dispatched_quantity >= 0
      AND received_quantity >= 0
      AND dispatched_quantity <= quantity
      AND received_quantity <= dispatched_quantity
    ),

  CONSTRAINT ck_inventory_transfer_item_cost
    CHECK (
      unit_cost >= 0
    )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_transfer_items_transfer
ON inventory_stock_transfer_items(
  transfer_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_transfer_items_item
ON inventory_stock_transfer_items(
  item_id
);

ALTER TABLE inventory_stock_balances
  ADD CONSTRAINT
    ck_inventory_stock_balance_available
  CHECK (
    reserved_quantity <=
    quantity_on_hand
  )
  NOT VALID;
