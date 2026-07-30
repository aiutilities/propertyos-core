"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";

import {
  getInventoryItem,
  transitionInventoryItem,
} from "@/hooks/useInventoryItems";

import {
  InventoryItem,
} from "@/types/inventory";

function formatMoney(
  value: number,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      },
    ).format(Number(value));
  } catch {
    return `${currency} ${Number(
      value,
    ).toFixed(2)}`;
  }
}

export default function InventoryItemDetails({
  itemId,
}: {
  itemId: string;
}) {
  const [item, setItem] =
    useState<InventoryItem | null>(
      null,
    );
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [
    changedByPersonId,
    setChangedByPersonId,
  ] = useState("");
  const [remarks, setRemarks] =
    useState("");

  async function load() {
    setLoading(true);
    setError("");

    try {
      setItem(
        await getInventoryItem(itemId),
      );
    } catch (caught) {
      setItem(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load inventory item.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [itemId]);

  async function changeStatus() {
    if (
      !item ||
      !changedByPersonId.trim()
    ) {
      setError(
        "Changed By Person ID is required.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updated =
        await transitionInventoryItem(
          item.id,
          !item.isActive,
          {
            changedByPersonId:
              changedByPersonId.trim(),
            remarks:
              remarks.trim() ||
              undefined,
          },
        );

      setItem(updated);
      setRemarks("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to change item status.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        Loading inventory item…
      </div>
    );
  }

  if (!item) {
    return (
      <div className="error-state">
        <p>
          {error ||
            "Inventory item not found."}
        </p>
        <button onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  const fields = [
    ["SKU", item.sku],
    ["Name", item.name],
    ["Item Type", item.itemType],
    ["Category ID", item.categoryId],
    [
      "Unit of Measure ID",
      item.unitOfMeasureId,
    ],
    ["Brand ID", item.brandId ?? "—"],
    ["Barcode", item.barcode ?? "—"],
    [
      "Manufacturer Part Number",
      item.manufacturerPartNumber ??
        "—",
    ],
    [
      "Minimum Stock Level",
      item.minimumStockLevel,
    ],
    [
      "Reorder Level",
      item.reorderLevel,
    ],
    [
      "Reorder Quantity",
      item.reorderQuantity,
    ],
    [
      "Standard Cost",
      formatMoney(
        item.standardCost,
        item.currency,
      ),
    ],
    [
      "Serialized",
      item.isSerialized ? "Yes" : "No",
    ],
    [
      "Batch Tracked",
      item.isBatchTracked
        ? "Yes"
        : "No",
    ],
    [
      "Status",
      item.isActive
        ? "ACTIVE"
        : "INACTIVE",
    ],
  ];

  return (
    <div className="stack-lg">
      <div className="page-header">
        <div>
          <p className="eyebrow">
            Inventory Item
          </p>
          <h1>{item.name}</h1>
          <p className="muted-text">
            {item.sku}
          </p>
        </div>

        <Link
          className="secondary-button"
          href="/inventory/items"
        >
          Back to Items
        </Link>
      </div>

      <section className="panel">
        <div className="details-grid">
          {fields.map(
            ([label, value]) => (
              <div key={String(label)}>
                <span className="muted-text">
                  {label}
                </span>
                <strong>
                  {String(value)}
                </strong>
              </div>
            ),
          )}
        </div>

        {item.description ? (
          <div>
            <h3>Description</h3>
            <p>{item.description}</p>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2>
          {item.isActive
            ? "Deactivate Item"
            : "Activate Item"}
        </h2>

        <div className="form-grid">
          <label>
            Changed By Person ID
            <input
              required
              value={changedByPersonId}
              onChange={(event) =>
                setChangedByPersonId(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Remarks
            <input
              value={remarks}
              onChange={(event) =>
                setRemarks(
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        {error ? (
          <p className="text-danger">
            {error}
          </p>
        ) : null}

        <div className="form-actions">
          <button
            disabled={
              saving ||
              !changedByPersonId.trim()
            }
            onClick={changeStatus}
          >
            {saving
              ? "Saving…"
              : item.isActive
                ? "Deactivate Item"
                : "Activate Item"}
          </button>
        </div>
      </section>
    </div>
  );
}
