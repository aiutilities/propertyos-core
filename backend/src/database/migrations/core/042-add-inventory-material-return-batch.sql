-- Migration: 042-add-inventory-material-return-batch.sql
-- Adds Batch identity to Inventory Material Return document lines.
--
-- Linked returns must preserve the item, bin and Batch identity selected
-- on the original Material Issue document.

ALTER TABLE inventory_material_return_items
  ADD COLUMN IF NOT EXISTS batch_id UUID
    REFERENCES inventory_batches(id)
    ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS
  idx_inventory_material_return_items_batch
ON inventory_material_return_items(
  batch_id
)
WHERE batch_id IS NOT NULL;

ALTER TABLE inventory_material_return_items
  DROP CONSTRAINT IF EXISTS
    uq_inventory_material_return_item;

DROP INDEX IF EXISTS
  uq_inventory_material_return_item;

CREATE UNIQUE INDEX
  uq_inventory_material_return_item
ON inventory_material_return_items(
  material_return_id,
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
