"use client";

import { useState } from "react";

import {
  InventoryItemType,
} from "@/types/inventory";

import {
  useInventoryDashboard,
} from "@/hooks/useInventoryDashboard";

import InventoryItemTable from "./InventoryItemTable";
import InventoryMetrics from "./InventoryMetrics";
import InventoryStockTable from "./InventoryStockTable";

type ViewMode =
  | "items"
  | "stock";

export default function InventoryDashboard() {
  const [search, setSearch] =
    useState("");
  const [itemType, setItemType] =
    useState<InventoryItemType | "">("");
  const [activeOnly, setActiveOnly] =
    useState(true);
  const [
    belowReorderLevel,
    setBelowReorderLevel,
  ] = useState(false);
  const [view, setView] =
    useState<ViewMode>("items");

  const {
    items,
    stores,
    stockBalances,
    categories,
    brands,
    units,
    metrics,
    loading,
    error,
    refresh,
  } = useInventoryDashboard({
    search,
    itemType,
    activeOnly,
    belowReorderLevel,
  });

  return (
    <div className="stack-lg">
      <InventoryMetrics
        metrics={metrics}
      />

      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="Search inventory items"
            placeholder="Search SKU, name or barcode"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <select
            aria-label="Filter inventory item type"
            value={itemType}
            onChange={(event) =>
              setItemType(
                event.target
                  .value as InventoryItemType | "",
              )
            }
          >
            <option value="">
              All item types
            </option>
            {[
              "GOODS",
              "CONSUMABLE",
              "SPARE",
              "TOOL",
            ].map((value) => (
              <option
                key={value}
                value={value}
              >
                {value}
              </option>
            ))}
          </select>

          <label>
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(event) =>
                setActiveOnly(
                  event.target.checked,
                )
              }
            />
            Active only
          </label>

          <label>
            <input
              type="checkbox"
              checked={belowReorderLevel}
              onChange={(event) =>
                setBelowReorderLevel(
                  event.target.checked,
                )
              }
            />
            Reorder attention
          </label>

          <button
            className="secondary-button"
            onClick={refresh}
          >
            Refresh
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="button-row">
          <button
            className={
              view === "items"
                ? "button-link"
                : "secondary-button"
            }
            onClick={() =>
              setView("items")
            }
          >
            Items
          </button>

          <button
            className={
              view === "stock"
                ? "button-link"
                : "secondary-button"
            }
            onClick={() =>
              setView("stock")
            }
          >
            Stock Balances
          </button>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">
          Loading inventory…
        </div>
      ) : null}

      {error ? (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={refresh}>
            Retry
          </button>
        </div>
      ) : null}

      {!loading &&
      !error &&
      view === "items" ? (
        <InventoryItemTable
          items={items}
          categories={categories}
          brands={brands}
          units={units}
        />
      ) : null}

      {!loading &&
      !error &&
      view === "stock" ? (
        <InventoryStockTable
          balances={stockBalances}
          items={items}
          stores={stores}
        />
      ) : null}
    </div>
  );
}
