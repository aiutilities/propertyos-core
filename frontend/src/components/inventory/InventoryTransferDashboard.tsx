"use client";

import {
  useState,
} from "react";

import {
  useInventoryStores,
} from "@/hooks/useInventoryStores";

import {
  useInventoryTransfers,
} from "@/hooks/useInventoryTransfers";

import InventoryTransferTable from "./InventoryTransferTable";

export default function InventoryTransferDashboard() {
  const [sourceStoreId, setSourceStoreId] =
    useState("");

  const [
    destinationStoreId,
    setDestinationStoreId,
  ] = useState("");

  const [status, setStatus] =
    useState("");

  const {
    transfers,
    loading,
    error,
    refresh,
  } = useInventoryTransfers({
    sourceStoreId,
    destinationStoreId,
    status,
  });

  const { stores } =
    useInventoryStores({});

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="toolbar">
          <select
            aria-label="Filter source store"
            value={sourceStoreId}
            onChange={(event) =>
              setSourceStoreId(
                event.target.value,
              )
            }
          >
            <option value="">
              All source stores
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
            aria-label="Filter destination store"
            value={destinationStoreId}
            onChange={(event) =>
              setDestinationStoreId(
                event.target.value,
              )
            }
          >
            <option value="">
              All destination stores
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
            aria-label="Filter transfer status"
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
            <option value="DISPATCHED">
              DISPATCHED
            </option>
            <option value="RECEIVED">
              RECEIVED
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
          Loading inventory transfers…
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
        <InventoryTransferTable
          transfers={transfers}
          stores={stores}
        />
      ) : null}
    </div>
  );
}
