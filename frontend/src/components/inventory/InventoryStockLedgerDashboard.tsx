"use client";

import {
  useState,
} from "react";

import {
  useInventoryItems,
} from "@/hooks/useInventoryItems";

import {
  useInventoryStockLedger,
} from "@/hooks/useInventoryStockLedger";

import {
  useInventoryBins,
  useInventoryStores,
} from "@/hooks/useInventoryStores";

import InventoryStockLedgerTable from "./InventoryStockLedgerTable";

const MOVEMENT_TYPES = [
  "RECEIPT",
  "ISSUE",
  "RETURN",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "ADJUSTMENT",
  "RESERVATION",
  "RESERVATION_RELEASE",
  "RESERVATION_FULFILLMENT",
];

export default function InventoryStockLedgerDashboard() {
  const [storeId, setStoreId] =
    useState("");

  const [binLocationId, setBinLocationId] =
    useState("");

  const [itemId, setItemId] =
    useState("");

  const [movementType, setMovementType] =
    useState("");

  const [referenceNumber, setReferenceNumber] =
    useState("");

  const [dateFrom, setDateFrom] =
    useState("");

  const [dateTo, setDateTo] =
    useState("");

  const {
    entries,
    loading,
    error,
    refresh,
  } = useInventoryStockLedger({
    storeId,
    binLocationId,
    itemId,
    movementType,
    referenceNumber,
    dateFrom,
    dateTo,
  });

  const { items } = useInventoryItems({
    isActive: true,
  });

  const { stores } =
    useInventoryStores({});

  const { bins } = useInventoryBins(
    storeId || undefined,
  );

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="form-grid">
          <label>
            Store
            <select
              value={storeId}
              onChange={(event) => {
                setStoreId(
                  event.target.value,
                );
                setBinLocationId("");
              }}
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
            Bin
            <select
              disabled={!storeId}
              value={binLocationId}
              onChange={(event) =>
                setBinLocationId(
                  event.target.value,
                )
              }
            >
              <option value="">
                All bins
              </option>

              {bins.map((bin) => (
                <option
                  key={bin.id}
                  value={bin.id}
                >
                  {bin.binCode} ·{" "}
                  {bin.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Item
            <select
              value={itemId}
              onChange={(event) =>
                setItemId(
                  event.target.value,
                )
              }
            >
              <option value="">
                All items
              </option>

              {items.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                >
                  {item.sku} ·{" "}
                  {item.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Movement Type
            <select
              value={movementType}
              onChange={(event) =>
                setMovementType(
                  event.target.value,
                )
              }
            >
              <option value="">
                All movements
              </option>

              {MOVEMENT_TYPES.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            Reference Number
            <input
              value={referenceNumber}
              onChange={(event) =>
                setReferenceNumber(
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
            Refresh Ledger
          </button>

          <button
            className="secondary-button"
            onClick={() => {
              setStoreId("");
              setBinLocationId("");
              setItemId("");
              setMovementType("");
              setReferenceNumber("");
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
          Loading stock movement history…
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
        <InventoryStockLedgerTable
          entries={entries}
          items={items}
          stores={stores}
        />
      ) : null}
    </div>
  );
}
