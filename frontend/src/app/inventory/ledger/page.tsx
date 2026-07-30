import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryStockLedgerDashboard from "@/components/inventory/InventoryStockLedgerDashboard";

export default function InventoryStockLedgerPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Audit
            </p>
            <h1>Stock Movement Ledger</h1>
            <p className="muted-text">
              Review immutable inventory
              quantity, reservation and
              costing movements.
            </p>
          </div>
        </div>

        <InventoryStockLedgerDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
