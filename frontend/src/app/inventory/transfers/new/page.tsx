import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryTransferForm from "@/components/inventory/InventoryTransferForm";

export default function NewInventoryTransferPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Operations
            </p>
            <h1>New Stock Transfer</h1>
          </div>
        </div>

        <InventoryTransferForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
