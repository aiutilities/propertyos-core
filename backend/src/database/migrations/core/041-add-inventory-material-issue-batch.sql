-- Migration: 041-add-inventory-material-issue-batch.sql
-- Adds explicit Batch identity to Inventory Material Issue document lines.
--
-- The immutable Inventory stock ledger remains authoritative for movement
-- posting. The document line stores the selected Batch for traceability,
-- validation and linked Material Returns.

ALTER TABLE inventory_material_issue_items
  ADD COLUMN IF NOT EXISTS batch_id UUID
    REFERENCES inventory_batches(id)
    ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_issue_items_batch
ON inventory_material_issue_items(
  batch_id
)
WHERE batch_id IS NOT NULL;

ALTER TABLE inventory_material_issue_items
  DROP CONSTRAINT IF EXISTS
    uq_inventory_material_issue_item;

CREATE UNIQUE INDEX IF NOT EXISTS
  uq_inventory_material_issue_item
ON inventory_material_issue_items(
  material_issue_id,
  item_id,
  COALESCE(
    bin_location_id,
    '00000000-0000-0000-0000-000000000000'::UUID
  ),
  COALESCE(
    batch_id,
    '00000000-0000-0000-0000-000000000000'::UUID
  )
);
