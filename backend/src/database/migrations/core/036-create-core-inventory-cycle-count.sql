CREATE TABLE IF NOT EXISTS inventory_cycle_counts (
  id UUID PRIMARY KEY,

  count_number VARCHAR(80)
    NOT NULL UNIQUE,

  property_id UUID NOT NULL
    REFERENCES properties(id)
    ON DELETE RESTRICT,

  store_id UUID NOT NULL
    REFERENCES inventory_stores(id)
    ON DELETE RESTRICT,

  status VARCHAR(30)
    NOT NULL DEFAULT 'DRAFT',

  count_date DATE
    NOT NULL,

  blind_count BOOLEAN
    NOT NULL DEFAULT TRUE,

  freeze_stock BOOLEAN
    NOT NULL DEFAULT FALSE,

  scope_type VARCHAR(30)
    NOT NULL DEFAULT 'STORE',

  notes TEXT,

  created_by_person_id UUID NOT NULL
    REFERENCES persons(id)
    ON DELETE RESTRICT,

  started_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  completed_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  posted_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  cancelled_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  started_at TIMESTAMPTZ,

  completed_at TIMESTAMPTZ,

  posted_at TIMESTAMPTZ,

  cancelled_at TIMESTAMPTZ,

  cancellation_reason TEXT,

  metadata JSONB
    NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT ck_inventory_cycle_count_status
    CHECK (
      status IN (
        'DRAFT',
        'IN_PROGRESS',
        'COMPLETED',
        'POSTED',
        'CANCELLED'
      )
    ),

  CONSTRAINT ck_inventory_cycle_count_scope
    CHECK (
      scope_type IN (
        'STORE',
        'BIN',
        'ITEM'
      )
    )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_cycle_counts_property
ON inventory_cycle_counts(
  property_id,
  count_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_cycle_counts_store
ON inventory_cycle_counts(
  store_id,
  count_date DESC
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_cycle_counts_status
ON inventory_cycle_counts(status);

CREATE TABLE IF NOT EXISTS inventory_cycle_count_items (
  id UUID PRIMARY KEY,

  cycle_count_id UUID NOT NULL
    REFERENCES inventory_cycle_counts(id)
    ON DELETE CASCADE,

  item_id UUID NOT NULL
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT,

  bin_location_id UUID
    REFERENCES inventory_bin_locations(id)
    ON DELETE SET NULL,

  system_quantity NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  counted_quantity NUMERIC(18,6),

  variance_quantity NUMERIC(18,6),

  average_unit_cost NUMERIC(18,6)
    NOT NULL DEFAULT 0,

  variance_value NUMERIC(18,6),

  counted_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,

  counted_at TIMESTAMPTZ,

  remarks TEXT,

  metadata JSONB
    NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_inventory_cycle_count_item
    UNIQUE (
      cycle_count_id,
      item_id,
      bin_location_id
    ),

  CONSTRAINT ck_inventory_cycle_count_system_quantity
    CHECK (
      system_quantity >= 0
    ),

  CONSTRAINT ck_inventory_cycle_count_counted_quantity
    CHECK (
      counted_quantity IS NULL
      OR counted_quantity >= 0
    ),

  CONSTRAINT ck_inventory_cycle_count_average_cost
    CHECK (
      average_unit_cost >= 0
    ),

  CONSTRAINT ck_inventory_cycle_count_variance
    CHECK (
      variance_quantity IS NULL
      OR variance_quantity =
        counted_quantity -
        system_quantity
    ),

  CONSTRAINT ck_inventory_cycle_count_variance_value
    CHECK (
      variance_value IS NULL
      OR variance_value =
        variance_quantity *
        average_unit_cost
    )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_cycle_count_items_count
ON inventory_cycle_count_items(
  cycle_count_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_cycle_count_items_item
ON inventory_cycle_count_items(
  item_id
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_cycle_count_items_bin
ON inventory_cycle_count_items(
  bin_location_id
);

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_inventory_open_cycle_count_store
ON inventory_cycle_counts(store_id)
WHERE status IN (
  'DRAFT',
  'IN_PROGRESS',
  'COMPLETED'
);
