"use client";

import {
  useState,
} from "react";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import {
  AdminShell,
} from "@/components/layout/AdminShell";

import UnitForm from "@/components/inventory/UnitForm";
import UnitTable from "@/components/inventory/UnitTable";

import {
  useInventoryMasterData,
} from "@/hooks/useInventoryMasterData";

import {
  InventoryUnitOfMeasure,
} from "@/types/inventory";

export default function InventoryUnitsPage() {
  const {
    units,
    loading,
    error,
    refresh,
  } = useInventoryMasterData(false);

  const [selected, setSelected] =
    useState<InventoryUnitOfMeasure | null>(
      null,
    );

  async function saved() {
    setSelected(null);
    await refresh();
  }

  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Configuration
            </p>
            <h1>Units of Measure</h1>
          </div>
        </div>

        <div className="stack-lg">
          <UnitForm
            selected={selected}
            onSaved={saved}
            onCancel={() =>
              setSelected(null)
            }
          />

          {loading ? (
            <div className="loading-state">
              Loading units…
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
            <UnitTable
              units={units}
              onEdit={setSelected}
            />
          ) : null}
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
