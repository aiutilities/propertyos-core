-- Migration: 043-add-inventory-stock-reservation-batch.sql
-- Adds Batch identity to Inventory Stock Reservations.
--
-- Batch-tracked items reserve, release and fulfil quantity against one
-- explicit Inventory Batch. Non-batch-tracked items keep batch_id NULL.

ALTER TABLE inventory_stock_reservations
  ADD COLUMN IF NOT EXISTS batch_id UUID
    REFERENCES inventory_batches(id)
    ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS
  idx_inventory_stock_reservations_batch
ON inventory_stock_reservations(
  batch_id,
  status
)
WHERE batch_id IS NOT NULL;
