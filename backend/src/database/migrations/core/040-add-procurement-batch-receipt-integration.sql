-- Migration: 040-add-procurement-batch-receipt-integration.sql
-- Adds Batch/Lot capture to Procurement Goods Receipt items.
--
-- Batch resolution remains owned by Inventory.
-- Procurement stores the supplied Batch identity and the resolved Inventory
-- Batch reference for end-to-end receipt traceability.

ALTER TABLE procurement_goods_receipt_items
  ADD COLUMN IF NOT EXISTS batch_id UUID
    REFERENCES inventory_batches(id)
    ON DELETE RESTRICT,

  ADD COLUMN IF NOT EXISTS batch_number VARCHAR(120),

  ADD COLUMN IF NOT EXISTS manufacturer_batch_number VARCHAR(160),

  ADD COLUMN IF NOT EXISTS manufacture_date DATE,

  ADD COLUMN IF NOT EXISTS expiry_date DATE;

ALTER TABLE procurement_goods_receipt_items
  DROP CONSTRAINT IF EXISTS
    ck_procurement_grn_batch_number;

ALTER TABLE procurement_goods_receipt_items
  ADD CONSTRAINT
    ck_procurement_grn_batch_number
  CHECK (
    batch_number IS NULL
    OR LENGTH(TRIM(batch_number)) > 0
  );

ALTER TABLE procurement_goods_receipt_items
  DROP CONSTRAINT IF EXISTS
    ck_procurement_grn_batch_dates;

ALTER TABLE procurement_goods_receipt_items
  ADD CONSTRAINT
    ck_procurement_grn_batch_dates
  CHECK (
    manufacture_date IS NULL
    OR expiry_date IS NULL
    OR expiry_date >= manufacture_date
  );

ALTER TABLE procurement_goods_receipt_items
  DROP CONSTRAINT IF EXISTS
    ck_procurement_grn_batch_reference;

ALTER TABLE procurement_goods_receipt_items
  ADD CONSTRAINT
    ck_procurement_grn_batch_reference
  CHECK (
    batch_id IS NULL
    OR batch_number IS NOT NULL
  );

CREATE INDEX IF NOT EXISTS
  idx_procurement_grn_items_batch
ON procurement_goods_receipt_items(
  batch_id
)
WHERE batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_procurement_grn_items_batch_number
ON procurement_goods_receipt_items(
  batch_number
)
WHERE batch_number IS NOT NULL;
