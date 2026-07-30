import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryDashboard from "@/components/inventory/InventoryDashboard";

export default function InventoryPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Procurement & Stores
            </p>
            <h1>Inventory</h1>
            <p className="muted-text">
              Monitor inventory items, stores,
              quantities, reservations and
              stock availability.
            </p>
          </div>
        </div>

        <InventoryDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
