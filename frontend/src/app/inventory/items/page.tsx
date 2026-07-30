import Link from "next/link";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryDashboard from "@/components/inventory/InventoryDashboard";

export default function InventoryItemsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory
            </p>
            <h1>Inventory Items</h1>
          </div>

          <Link
            className="button-link"
            href="/inventory/items/new"
          >
            Add Item
          </Link>
        </div>

        <InventoryDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
