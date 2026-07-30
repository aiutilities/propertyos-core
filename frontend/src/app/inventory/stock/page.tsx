import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryStockManager from "@/components/inventory/InventoryStockManager";

export default function InventoryStockPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Operations
            </p>
            <h1>Stock Balances</h1>
            <p className="muted-text">
              Review on-hand, reserved and
              available quantities across
              inventory stores.
            </p>
          </div>
        </div>

        <InventoryStockManager />
      </AdminShell>
    </ProtectedRoute>
  );
}
