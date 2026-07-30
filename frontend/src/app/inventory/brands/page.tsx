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

import BrandForm from "@/components/inventory/BrandForm";
import BrandTable from "@/components/inventory/BrandTable";

import {
  useInventoryMasterData,
} from "@/hooks/useInventoryMasterData";

import {
  InventoryBrand,
} from "@/types/inventory";

export default function InventoryBrandsPage() {
  const {
    brands,
    loading,
    error,
    refresh,
  } = useInventoryMasterData(false);

  const [selected, setSelected] =
    useState<InventoryBrand | null>(
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
            <h1>Brands</h1>
          </div>
        </div>

        <div className="stack-lg">
          <BrandForm
            selected={selected}
            onSaved={saved}
            onCancel={() =>
              setSelected(null)
            }
          />

          {loading ? (
            <div className="loading-state">
              Loading brands…
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
            <BrandTable
              brands={brands}
              onEdit={setSelected}
            />
          ) : null}
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
