"use client";

import {
  useState,
} from "react";

import {
  useStockAdjustments,
} from "@/hooks/useStockAdjustments";

import StockAdjustmentTable from "./StockAdjustmentTable";

export default function StockAdjustmentDashboard() {
  const [propertyId, setPropertyId] =
    useState("");
  const [storeId, setStoreId] =
    useState("");
  const [status, setStatus] =
    useState("");

  const {
    adjustments,
    loading,
    error,
    refresh,
  } = useStockAdjustments({
    propertyId,
    storeId,
    status,
  });

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="toolbar">
          <input
            aria-label="Filter by property ID"
            placeholder="Property ID"
            value={propertyId}
            onChange={(event) =>
              setPropertyId(
                event.target.value,
              )
            }
          />

          <input
            aria-label="Filter by store ID"
            placeholder="Store ID"
            value={storeId}
            onChange={(event) =>
              setStoreId(
                event.target.value,
              )
            }
          />

          <select
            aria-label="Filter adjustment status"
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value,
              )
            }
          >
            <option value="">
              All statuses
            </option>
            <option value="DRAFT">
              DRAFT
            </option>
            <option value="POSTED">
              POSTED
            </option>
            <option value="CANCELLED">
              CANCELLED
            </option>
          </select>

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
          Loading stock adjustments…
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
        <StockAdjustmentTable
          adjustments={adjustments}
        />
      ) : null}
    </div>
  );
}
