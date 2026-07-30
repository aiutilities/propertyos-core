import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryStoresManager from "@/components/inventory/InventoryStoresManager";

export default function InventoryStoresPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Configuration
            </p>
            <h1>Stores & Bins</h1>
            <p className="muted-text">
              Configure inventory stores,
              storage bins and operational
              bin purposes.
            </p>
          </div>
        </div>

        <InventoryStoresManager />
      </AdminShell>
    </ProtectedRoute>
  );
}
