"use client";

import {
  useState,
} from "react";

import {
  useInventoryItems,
} from "@/hooks/useInventoryItems";

import {
  useInventoryReservations,
} from "@/hooks/useInventoryReservations";

import {
  useInventoryStores,
} from "@/hooks/useInventoryStores";

import InventoryReservationTable from "./InventoryReservationTable";

export default function InventoryReservationDashboard() {
  const [storeId, setStoreId] =
    useState("");

  const [itemId, setItemId] =
    useState("");

  const [status, setStatus] =
    useState("");

  const {
    reservations,
    loading,
    error,
    refresh,
  } = useInventoryReservations({
    storeId,
    itemId,
    status,
  });

  const { items } = useInventoryItems({
    isActive: true,
  });

  const { stores } =
    useInventoryStores({
      isActive: true,
    });

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="toolbar">
          <select
            aria-label="Filter reservation store"
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

          <select
            aria-label="Filter reservation item"
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

          <select
            aria-label="Filter reservation status"
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
            <option value="ACTIVE">
              ACTIVE
            </option>
            <option value="PARTIALLY_FULFILLED">
              PARTIALLY FULFILLED
            </option>
            <option value="FULFILLED">
              FULFILLED
            </option>
            <option value="RELEASED">
              RELEASED
            </option>
            <option value="EXPIRED">
              EXPIRED
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
          Loading stock reservations…
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
        <InventoryReservationTable
          reservations={reservations}
          items={items}
          stores={stores}
        />
      ) : null}
    </div>
  );
}
