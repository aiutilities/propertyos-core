"use client";

import {
  useState,
} from "react";

import InventoryBinForm from "./InventoryBinForm";
import InventoryBinTable from "./InventoryBinTable";
import InventoryStoreForm from "./InventoryStoreForm";
import InventoryStoreTable from "./InventoryStoreTable";

import {
  transitionInventoryStore,
  useInventoryBins,
  useInventoryStores,
} from "@/hooks/useInventoryStores";

import {
  InventoryBinLocation,
  InventoryStore,
} from "@/types/inventory";

export default function InventoryStoresManager() {
  const {
    stores,
    loading,
    error,
    refresh,
  } = useInventoryStores({});

  const [selectedStore, setSelectedStore] =
    useState<InventoryStore | null>(
      null,
    );

  const [binStore, setBinStore] =
    useState<InventoryStore | null>(
      null,
    );

  const [selectedBin, setSelectedBin] =
    useState<InventoryBinLocation | null>(
      null,
    );

  const {
    bins,
    loading: binsLoading,
    error: binsError,
    refresh: refreshBins,
  } = useInventoryBins(
    binStore?.id,
  );

  const [statusPersonId, setStatusPersonId] =
    useState("");
  const [statusRemarks, setStatusRemarks] =
    useState("");
  const [statusStore, setStatusStore] =
    useState<InventoryStore | null>(
      null,
    );
  const [statusSaving, setStatusSaving] =
    useState(false);
  const [statusError, setStatusError] =
    useState("");

  async function storeSaved() {
    setSelectedStore(null);
    await refresh();
  }

  async function binSaved() {
    setSelectedBin(null);
    await refreshBins();
  }

  async function changeStatus() {
    if (
      !statusStore ||
      !statusPersonId.trim()
    ) {
      setStatusError(
        "Changed By Person ID is required.",
      );
      return;
    }

    setStatusSaving(true);
    setStatusError("");

    try {
      await transitionInventoryStore(
        statusStore.id,
        !statusStore.isActive,
        {
          changedByPersonId:
            statusPersonId.trim(),
          remarks:
            statusRemarks.trim() ||
            undefined,
        },
      );

      setStatusStore(null);
      setStatusPersonId("");
      setStatusRemarks("");
      await refresh();
    } catch (caught) {
      setStatusError(
        caught instanceof Error
          ? caught.message
          : "Unable to change store status.",
      );
    } finally {
      setStatusSaving(false);
    }
  }

  return (
    <div className="stack-lg">
      <InventoryStoreForm
        selected={selectedStore}
        onSaved={storeSaved}
        onCancel={() =>
          setSelectedStore(null)
        }
      />

      {loading ? (
        <div className="loading-state">
          Loading stores…
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
        <InventoryStoreTable
          stores={stores}
          onEdit={setSelectedStore}
          onManageBins={(store) => {
            setBinStore(store);
            setSelectedBin(null);
          }}
          onChangeStatus={(store) => {
            setStatusStore(store);
            setStatusError("");
          }}
        />
      ) : null}

      {statusStore ? (
        <section className="panel">
          <h2>
            {statusStore.isActive
              ? "Deactivate"
              : "Activate"}{" "}
            {statusStore.name}
          </h2>

          <div className="form-grid">
            <label>
              Changed By Person ID
              <input
                required
                value={statusPersonId}
                onChange={(event) =>
                  setStatusPersonId(
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Remarks
              <input
                value={statusRemarks}
                onChange={(event) =>
                  setStatusRemarks(
                    event.target.value,
                  )
                }
              />
            </label>
          </div>

          {statusError ? (
            <p className="text-danger">
              {statusError}
            </p>
          ) : null}

          <div className="form-actions">
            <button
              disabled={statusSaving}
              onClick={changeStatus}
            >
              {statusSaving
                ? "Saving…"
                : "Confirm"}
            </button>

            <button
              className="secondary-button"
              onClick={() =>
                setStatusStore(null)
              }
            >
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {binStore ? (
        <section className="stack-lg">
          <div className="page-header">
            <div>
              <p className="eyebrow">
                Store Bins
              </p>
              <h2>
                {binStore.storeCode} ·{" "}
                {binStore.name}
              </h2>
            </div>

            <button
              className="secondary-button"
              onClick={() => {
                setBinStore(null);
                setSelectedBin(null);
              }}
            >
              Close Bins
            </button>
          </div>

          <InventoryBinForm
            store={binStore}
            bins={bins}
            selected={selectedBin}
            onSaved={binSaved}
            onCancel={() =>
              setSelectedBin(null)
            }
          />

          {binsLoading ? (
            <div className="loading-state">
              Loading bins…
            </div>
          ) : null}

          {binsError ? (
            <div className="error-state">
              <p>{binsError}</p>
              <button onClick={refreshBins}>
                Retry
              </button>
            </div>
          ) : null}

          {!binsLoading &&
          !binsError ? (
            <InventoryBinTable
              bins={bins}
              onEdit={setSelectedBin}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  );
}
