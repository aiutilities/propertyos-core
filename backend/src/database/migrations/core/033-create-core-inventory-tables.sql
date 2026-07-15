-- Migration: 033-create-core-inventory-tables.sql
-- PropertyOS Inventory & Stores foundation.

CREATE TABLE IF NOT EXISTS inventory_units_of_measure (
  id UUID PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  symbol VARCHAR(32) NOT NULL,
  decimal_places INTEGER NOT NULL DEFAULT 2
    CHECK (
      decimal_places >= 0
      AND decimal_places <= 6
    ),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_item_categories (
  id UUID PRIMARY KEY,
  parent_category_id UUID
    REFERENCES inventory_item_categories(id)
    ON DELETE RESTRICT,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    parent_category_id IS NULL
    OR parent_category_id <> id
  )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_item_categories_parent
ON inventory_item_categories(
  parent_category_id
);

CREATE TABLE IF NOT EXISTS inventory_brands (
  id UUID PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  category_id UUID NOT NULL
    REFERENCES inventory_item_categories(id)
    ON DELETE RESTRICT,
  unit_of_measure_id UUID NOT NULL
    REFERENCES inventory_units_of_measure(id)
    ON DELETE RESTRICT,
  brand_id UUID
    REFERENCES inventory_brands(id)
    ON DELETE SET NULL,
  item_type VARCHAR(32) NOT NULL DEFAULT 'GOODS'
    CHECK (
      item_type IN (
        'GOODS',
        'CONSUMABLE',
        'SPARE',
        'TOOL'
      )
    ),
  barcode VARCHAR(160),
  manufacturer_part_number VARCHAR(160),
  minimum_stock_level NUMERIC(18,6)
    NOT NULL DEFAULT 0
    CHECK (
      minimum_stock_level >= 0
    ),
  reorder_level NUMERIC(18,6)
    NOT NULL DEFAULT 0
    CHECK (
      reorder_level >= 0
    ),
  reorder_quantity NUMERIC(18,6)
    NOT NULL DEFAULT 0
    CHECK (
      reorder_quantity >= 0
    ),
  standard_cost NUMERIC(18,2)
    NOT NULL DEFAULT 0
    CHECK (
      standard_cost >= 0
    ),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  is_serialized BOOLEAN NOT NULL DEFAULT FALSE,
  is_batch_tracked BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,
  updated_by_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_inventory_items_barcode
ON inventory_items(barcode)
WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_inventory_items_category
ON inventory_items(category_id);

CREATE INDEX IF NOT EXISTS
  idx_inventory_items_brand
ON inventory_items(brand_id);

CREATE INDEX IF NOT EXISTS
  idx_inventory_items_uom
ON inventory_items(unit_of_measure_id);

CREATE INDEX IF NOT EXISTS
  idx_inventory_items_active
ON inventory_items(is_active);

CREATE TABLE IF NOT EXISTS inventory_stores (
  id UUID PRIMARY KEY,
  store_code VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  property_id UUID NOT NULL
    REFERENCES properties(id)
    ON DELETE CASCADE,
  zone_id UUID
    REFERENCES zones(id)
    ON DELETE SET NULL,
  space_id UUID
    REFERENCES spaces(id)
    ON DELETE SET NULL,
  manager_person_id UUID
    REFERENCES persons(id)
    ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (
    property_id,
    store_code
  )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stores_property
ON inventory_stores(property_id);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stores_zone
ON inventory_stores(zone_id);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stores_space
ON inventory_stores(space_id);

CREATE TABLE IF NOT EXISTS inventory_bin_locations (
  id UUID PRIMARY KEY,
  store_id UUID NOT NULL
    REFERENCES inventory_stores(id)
    ON DELETE CASCADE,
  parent_bin_id UUID
    REFERENCES inventory_bin_locations(id)
    ON DELETE RESTRICT,
  bin_code VARCHAR(64) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  barcode VARCHAR(160),
  is_receiving_bin BOOLEAN
    NOT NULL DEFAULT FALSE,
  is_dispatch_bin BOOLEAN
    NOT NULL DEFAULT FALSE,
  is_quarantine_bin BOOLEAN
    NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (
    store_id,
    bin_code
  ),
  CHECK (
    parent_bin_id IS NULL
    OR parent_bin_id <> id
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_inventory_bin_locations_barcode
ON inventory_bin_locations(barcode)
WHERE barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_inventory_bin_locations_store
ON inventory_bin_locations(store_id);

CREATE INDEX IF NOT EXISTS
  idx_inventory_bin_locations_parent
ON inventory_bin_locations(parent_bin_id);

-- Stock balance exists from the beginning so later stock-ledger
-- migrations can post balances without altering the item master.
CREATE TABLE IF NOT EXISTS inventory_stock_balances (
  id UUID PRIMARY KEY,
  item_id UUID NOT NULL
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT,
  store_id UUID NOT NULL
    REFERENCES inventory_stores(id)
    ON DELETE CASCADE,
  bin_location_id UUID
    REFERENCES inventory_bin_locations(id)
    ON DELETE SET NULL,
  quantity_on_hand NUMERIC(18,6)
    NOT NULL DEFAULT 0,
  reserved_quantity NUMERIC(18,6)
    NOT NULL DEFAULT 0
    CHECK (
      reserved_quantity >= 0
    ),
  available_quantity NUMERIC(18,6)
    GENERATED ALWAYS AS (
      quantity_on_hand
      - reserved_quantity
    ) STORED,
  average_unit_cost NUMERIC(18,6)
    NOT NULL DEFAULT 0
    CHECK (
      average_unit_cost >= 0
    ),
  last_movement_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_inventory_stock_balances_location
ON inventory_stock_balances (
  item_id,
  store_id,
  COALESCE(
    bin_location_id,
    '00000000-0000-0000-0000-000000000000'::UUID
  )
);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_balances_item
ON inventory_stock_balances(item_id);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_balances_store
ON inventory_stock_balances(store_id);

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_balances_bin
ON inventory_stock_balances(bin_location_id);

-- Deterministic foundation records used by the API and tests.
INSERT INTO inventory_units_of_measure (
  id,
  code,
  name,
  symbol,
  decimal_places
)
VALUES
  (
    '33000000-0000-4000-8000-000000000001',
    'EA',
    'Each',
    'ea',
    0
  ),
  (
    '33000000-0000-4000-8000-000000000002',
    'KG',
    'Kilogram',
    'kg',
    3
  ),
  (
    '33000000-0000-4000-8000-000000000003',
    'LTR',
    'Litre',
    'L',
    3
  ),
  (
    '33000000-0000-4000-8000-000000000004',
    'MTR',
    'Metre',
    'm',
    3
  ),
  (
    '33000000-0000-4000-8000-000000000005',
    'BOX',
    'Box',
    'box',
    0
  )
ON CONFLICT (code) DO NOTHING;

INSERT INTO inventory_item_categories (
  id,
  code,
  name,
  description
)
VALUES
  (
    '33100000-0000-4000-8000-000000000001',
    'GENERAL',
    'General Inventory',
    'Default Inventory category'
  ),
  (
    '33100000-0000-4000-8000-000000000002',
    'CONSUMABLES',
    'Consumables',
    'Frequently consumed operational supplies'
  ),
  (
    '33100000-0000-4000-8000-000000000003',
    'SPARES',
    'Spares',
    'Replacement parts and maintenance spares'
  ),
  (
    '33100000-0000-4000-8000-000000000004',
    'TOOLS',
    'Tools',
    'Reusable tools and equipment'
  )
ON CONFLICT (code) DO NOTHING;
