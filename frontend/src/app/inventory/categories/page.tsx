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

import CategoryForm from "@/components/inventory/CategoryForm";
import CategoryTable from "@/components/inventory/CategoryTable";

import {
  useInventoryMasterData,
} from "@/hooks/useInventoryMasterData";

import {
  InventoryItemCategory,
} from "@/types/inventory";

export default function InventoryCategoriesPage() {
  const {
    categories,
    loading,
    error,
    refresh,
  } = useInventoryMasterData(false);

  const [selected, setSelected] =
    useState<InventoryItemCategory | null>(
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
            <h1>Item Categories</h1>
          </div>
        </div>

        <div className="stack-lg">
          <CategoryForm
            categories={categories}
            selected={selected}
            onSaved={saved}
            onCancel={() =>
              setSelected(null)
            }
          />

          {loading ? (
            <div className="loading-state">
              Loading categories…
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
            <CategoryTable
              categories={categories}
              onEdit={setSelected}
            />
          ) : null}
        </div>
      </AdminShell>
    </ProtectedRoute>
  );
}
