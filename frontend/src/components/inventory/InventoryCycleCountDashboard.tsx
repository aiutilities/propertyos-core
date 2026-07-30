"use client";

import {
  useState,
} from "react";

import {
  useInventoryCycleCounts,
} from "@/hooks/useInventoryCycleCounts";

import {
  useInventoryStores,
} from "@/hooks/useInventoryStores";

import InventoryCycleCountTable from "./InventoryCycleCountTable";

export default function InventoryCycleCountDashboard() {
  const [storeId, setStoreId] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const {
    counts,
    loading,
    error,
    refresh,
  } = useInventoryCycleCounts({
    storeId,
    status,
    dateFrom,
    dateTo,
  });

  const { stores } =
    useInventoryStores({});

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="form-grid">
          <label>
            Store
            <select
              value={storeId}
              onChange={(event) =>
                setStoreId(
                  event.target.value,
                )
              }
            >
              <option value="">
                All stores
              </option>

              {stores.map((store) => (
                <option
                  key={store.id}
                  value={store.id}
                >
                  {store.storeCode} ·{" "}
                  {store.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <select
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
              <option value="IN_PROGRESS">
                IN PROGRESS
              </option>
              <option value="COMPLETED">
                COMPLETED
              </option>
              <option value="POSTED">
                POSTED
              </option>
              <option value="CANCELLED">
                CANCELLED
              </option>
            </select>
          </label>

          <label>
            Date From
            <input
              type="date"
              value={dateFrom}
              onChange={(event) =>
                setDateFrom(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Date To
            <input
              type="date"
              value={dateTo}
              onChange={(event) =>
                setDateTo(
                  event.target.value,
                )
              }
            />
          </label>
        </div>

        <div className="form-actions">
          <button
            className="secondary-button"
            onClick={refresh}
          >
            Refresh
          </button>

          <button
            className="secondary-button"
            onClick={() => {
              setStoreId("");
              setStatus("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      {loading ? (
        <div className="loading-state">
          Loading cycle counts…
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
        <InventoryCycleCountTable
          counts={counts}
          stores={stores}
        />
      ) : null}
    </div>
  );
}
