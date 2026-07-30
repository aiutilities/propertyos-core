import Link from "next/link";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryMaterialReturnDashboard from "@/components/inventory/InventoryMaterialReturnDashboard";

export default function InventoryMaterialReturnsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Operations
            </p>
            <h1>Material Returns</h1>
          </div>

          <Link
            className="button-link"
            href="/inventory/material-returns/new"
          >
            New Material Return
          </Link>
        </div>

        <InventoryMaterialReturnDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
