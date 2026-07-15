-- Migration: 035-add-procurement-inventory-contract.sql
-- Explicit Procurement-to-Inventory mapping and Goods Receipt destination.

ALTER TABLE procurement_purchase_order_items
  ADD COLUMN IF NOT EXISTS inventory_item_id UUID
    REFERENCES inventory_items(id)
    ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS
  idx_procurement_po_items_inventory_item
ON procurement_purchase_order_items(
  inventory_item_id
)
WHERE inventory_item_id IS NOT NULL;

ALTER TABLE procurement_goods_receipts
  ADD COLUMN IF NOT EXISTS destination_store_id UUID
    REFERENCES inventory_stores(id)
    ON DELETE RESTRICT;

ALTER TABLE procurement_goods_receipts
  ADD COLUMN IF NOT EXISTS destination_bin_location_id UUID
    REFERENCES inventory_bin_locations(id)
    ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS
  idx_procurement_grn_destination_store
ON procurement_goods_receipts(
  destination_store_id
)
WHERE destination_store_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS
  idx_procurement_grn_destination_bin
ON procurement_goods_receipts(
  destination_bin_location_id
)
WHERE destination_bin_location_id IS NOT NULL;

-- A destination bin is never valid without a destination store.
ALTER TABLE procurement_goods_receipts
  ADD CONSTRAINT
    ck_procurement_grn_destination_bin_requires_store
  CHECK (
    destination_bin_location_id IS NULL
    OR destination_store_id IS NOT NULL
  )
  NOT VALID;

-- Validate that a Goods Receipt destination store belongs to the
-- same property as the Goods Receipt.
CREATE OR REPLACE FUNCTION
  validate_procurement_grn_inventory_destination()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  store_property_id UUID;
  bin_store_id UUID;
BEGIN
  IF NEW.destination_store_id IS NULL THEN
    IF NEW.destination_bin_location_id IS NOT NULL THEN
      RAISE EXCEPTION
        'Destination bin requires a destination store'
        USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
  END IF;

  SELECT property_id
  INTO store_property_id
  FROM inventory_stores
  WHERE id = NEW.destination_store_id;

  IF store_property_id IS NULL THEN
    RAISE EXCEPTION
      'Destination Inventory store does not exist'
      USING ERRCODE = '23503';
  END IF;

  IF store_property_id <> NEW.property_id THEN
    RAISE EXCEPTION
      'Destination Inventory store must belong to the Goods Receipt property'
      USING ERRCODE = '23514';
  END IF;

  IF NEW.destination_bin_location_id IS NOT NULL THEN
    SELECT store_id
    INTO bin_store_id
    FROM inventory_bin_locations
    WHERE id = NEW.destination_bin_location_id;

    IF bin_store_id IS NULL THEN
      RAISE EXCEPTION
        'Destination Inventory bin does not exist'
        USING ERRCODE = '23503';
    END IF;

    IF bin_store_id <> NEW.destination_store_id THEN
      RAISE EXCEPTION
        'Destination Inventory bin must belong to the selected store'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
  trg_validate_procurement_grn_inventory_destination
ON procurement_goods_receipts;

CREATE TRIGGER
  trg_validate_procurement_grn_inventory_destination
BEFORE INSERT OR UPDATE OF
  property_id,
  destination_store_id,
  destination_bin_location_id
ON procurement_goods_receipts
FOR EACH ROW
EXECUTE FUNCTION
  validate_procurement_grn_inventory_destination();

-- Once a purchase-order line is mapped, ensure that only an active
-- Inventory item may be assigned.
CREATE OR REPLACE FUNCTION
  validate_procurement_po_inventory_item()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  item_is_active BOOLEAN;
BEGIN
  IF NEW.inventory_item_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT is_active
  INTO item_is_active
  FROM inventory_items
  WHERE id = NEW.inventory_item_id;

  IF item_is_active IS NULL THEN
    RAISE EXCEPTION
      'Mapped Inventory item does not exist'
      USING ERRCODE = '23503';
  END IF;

  IF item_is_active = FALSE THEN
    RAISE EXCEPTION
      'Mapped Inventory item must be active'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS
  trg_validate_procurement_po_inventory_item
ON procurement_purchase_order_items;

CREATE TRIGGER
  trg_validate_procurement_po_inventory_item
BEFORE INSERT OR UPDATE OF
  inventory_item_id
ON procurement_purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION
  validate_procurement_po_inventory_item();
