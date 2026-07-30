"use client";

import {
  FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  createInventoryItem,
  useInventoryItems,
} from "@/hooks/useInventoryItems";

import {
  InventoryItemType,
} from "@/types/inventory";

const ITEM_TYPES: InventoryItemType[] = [
  "GOODS",
  "CONSUMABLE",
  "SPARE",
  "TOOL",
];

export default function InventoryItemForm() {
  const router = useRouter();

  const {
    categories,
    brands,
    units,
    loading,
  } = useInventoryItems({
    isActive: true,
  });

  const [form, setForm] = useState({
    sku: "",
    name: "",
    description: "",
    categoryId: "",
    unitOfMeasureId: "",
    brandId: "",
    itemType: "GOODS" as InventoryItemType,
    barcode: "",
    manufacturerPartNumber: "",
    minimumStockLevel: "0",
    reorderLevel: "0",
    reorderQuantity: "0",
    standardCost: "0",
    currency: "INR",
    isSerialized: false,
    isBatchTracked: false,
    createdByPersonId: "",
  });

  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");

  function update(
    name: string,
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const item =
        await createInventoryItem({
          sku: form.sku.trim(),
          name: form.name.trim(),
          description:
            form.description.trim() ||
            undefined,
          categoryId: form.categoryId,
          unitOfMeasureId:
            form.unitOfMeasureId,
          brandId:
            form.brandId || undefined,
          itemType: form.itemType,
          barcode:
            form.barcode.trim() ||
            undefined,
          manufacturerPartNumber:
            form.manufacturerPartNumber
              .trim() || undefined,
          minimumStockLevel: Number(
            form.minimumStockLevel,
          ),
          reorderLevel: Number(
            form.reorderLevel,
          ),
          reorderQuantity: Number(
            form.reorderQuantity,
          ),
          standardCost: Number(
            form.standardCost,
          ),
          currency:
            form.currency.trim() || "INR",
          isSerialized:
            form.isSerialized,
          isBatchTracked:
            form.isBatchTracked,
          createdByPersonId:
            form.createdByPersonId.trim(),
        });

      router.push(
        `/inventory/items/${item.id}`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create inventory item.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="form-card"
      onSubmit={submit}
    >
      <div className="form-grid">
        <label>
          SKU
          <input
            required
            value={form.sku}
            onChange={(event) =>
              update(
                "sku",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Item Name
          <input
            required
            value={form.name}
            onChange={(event) =>
              update(
                "name",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Category
          <select
            required
            disabled={loading}
            value={form.categoryId}
            onChange={(event) =>
              update(
                "categoryId",
                event.target.value,
              )
            }
          >
            <option value="">
              Select category
            </option>
            {categories.map(
              (category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.code} ·{" "}
                  {category.name}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          Unit of Measure
          <select
            required
            disabled={loading}
            value={
              form.unitOfMeasureId
            }
            onChange={(event) =>
              update(
                "unitOfMeasureId",
                event.target.value,
              )
            }
          >
            <option value="">
              Select unit
            </option>
            {units.map((unit) => (
              <option
                key={unit.id}
                value={unit.id}
              >
                {unit.code} ·{" "}
                {unit.name} (
                {unit.symbol})
              </option>
            ))}
          </select>
        </label>

        <label>
          Brand
          <select
            disabled={loading}
            value={form.brandId}
            onChange={(event) =>
              update(
                "brandId",
                event.target.value,
              )
            }
          >
            <option value="">
              No brand
            </option>
            {brands.map((brand) => (
              <option
                key={brand.id}
                value={brand.id}
              >
                {brand.code} ·{" "}
                {brand.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Item Type
          <select
            value={form.itemType}
            onChange={(event) =>
              update(
                "itemType",
                event.target
                  .value as InventoryItemType,
              )
            }
          >
            {ITEM_TYPES.map(
              (itemType) => (
                <option
                  key={itemType}
                  value={itemType}
                >
                  {itemType}
                </option>
              ),
            )}
          </select>
        </label>

        <label>
          Barcode
          <input
            value={form.barcode}
            onChange={(event) =>
              update(
                "barcode",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Manufacturer Part Number
          <input
            value={
              form.manufacturerPartNumber
            }
            onChange={(event) =>
              update(
                "manufacturerPartNumber",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Minimum Stock Level
          <input
            min="0"
            step="0.01"
            type="number"
            value={
              form.minimumStockLevel
            }
            onChange={(event) =>
              update(
                "minimumStockLevel",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Reorder Level
          <input
            min="0"
            step="0.01"
            type="number"
            value={form.reorderLevel}
            onChange={(event) =>
              update(
                "reorderLevel",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Reorder Quantity
          <input
            min="0"
            step="0.01"
            type="number"
            value={
              form.reorderQuantity
            }
            onChange={(event) =>
              update(
                "reorderQuantity",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Standard Cost
          <input
            min="0"
            step="0.01"
            type="number"
            value={form.standardCost}
            onChange={(event) =>
              update(
                "standardCost",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          Currency
          <input
            maxLength={3}
            required
            value={form.currency}
            onChange={(event) =>
              update(
                "currency",
                event.target.value
                  .toUpperCase(),
              )
            }
          />
        </label>

        <label>
          Created By Person ID
          <input
            required
            value={
              form.createdByPersonId
            }
            onChange={(event) =>
              update(
                "createdByPersonId",
                event.target.value,
              )
            }
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={
              form.isSerialized
            }
            onChange={(event) =>
              update(
                "isSerialized",
                event.target.checked,
              )
            }
          />
          Serialized Item
        </label>

        <label>
          <input
            type="checkbox"
            checked={
              form.isBatchTracked
            }
            onChange={(event) =>
              update(
                "isBatchTracked",
                event.target.checked,
              )
            }
          />
          Batch Tracked
        </label>
      </div>

      <label>
        Description
        <textarea
          rows={5}
          value={form.description}
          onChange={(event) =>
            update(
              "description",
              event.target.value,
            )
          }
        />
      </label>

      {error ? (
        <p className="text-danger">
          {error}
        </p>
      ) : null}

      <div className="form-actions">
        <button
          disabled={saving || loading}
          type="submit"
        >
          {saving
            ? "Creating…"
            : "Create Inventory Item"}
        </button>
      </div>
    </form>
  );
}
