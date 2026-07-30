"use client";

import {
  useState,
} from "react";

import {
  useInventoryMaterialReturns,
} from "@/hooks/useInventoryMaterialReturns";

import {
  useInventoryStores,
} from "@/hooks/useInventoryStores";

import InventoryMaterialReturnTable from "./InventoryMaterialReturnTable";

export default function InventoryMaterialReturnDashboard() {
  const [storeId, setStoreId] =
    useState("");

  const [materialIssueId, setMaterialIssueId] =
    useState("");

  const [status, setStatus] =
    useState("");

  const [reasonCode, setReasonCode] =
    useState("");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const {
    returns,
    loading,
    error,
    refresh,
  } = useInventoryMaterialReturns({
    storeId,
    materialIssueId,
    status,
    reasonCode,
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
            Material Issue ID
            <input
              value={materialIssueId}
              onChange={(event) =>
                setMaterialIssueId(
                  event.target.value,
                )
              }
            />
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
              <option value="POSTED">
                POSTED
              </option>
              <option value="CANCELLED">
                CANCELLED
              </option>
            </select>
          </label>

          <label>
            Reason Code
            <input
              value={reasonCode}
              onChange={(event) =>
                setReasonCode(
                  event.target.value,
                )
              }
            />
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
              setMaterialIssueId("");
              setStatus("");
              setReasonCode("");
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
          Loading material returns…
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
        <InventoryMaterialReturnTable
          returns={returns}
          stores={stores}
        />
      ) : null}
    </div>
  );
}
