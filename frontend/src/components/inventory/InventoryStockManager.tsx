"use client";

import {
  useState,
} from "react";

import {
  useInventoryDashboard,
} from "@/hooks/useInventoryDashboard";

import InventoryMetrics from "./InventoryMetrics";
import InventoryStockTable from "./InventoryStockTable";

export default function InventoryStockManager() {
  const [
    belowReorderLevel,
    setBelowReorderLevel,
  ] = useState(false);

  const {
    items,
    stores,
    stockBalances,
    metrics,
    loading,
    error,
    refresh,
  } = useInventoryDashboard({
    activeOnly: true,
    belowReorderLevel,
  });

  return (
    <div className="stack-lg">
      <InventoryMetrics
        metrics={metrics}
      />

      <section className="panel">
        <div className="toolbar">
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
            Reorder attention only
          </label>

          <button
            className="secondary-button"
            onClick={refresh}
          >
            Refresh
          </button>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">
          Loading stock balances…
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

      {!loading && !error ? (
        <InventoryStockTable
          balances={stockBalances}
          items={items}
          stores={stores}
        />
      ) : null}
    </div>
  );
}
