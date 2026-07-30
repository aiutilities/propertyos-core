import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryItemForm from "@/components/inventory/InventoryItemForm";

export default function NewInventoryItemPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory
            </p>
            <h1>Add Inventory Item</h1>
          </div>
        </div>

        <InventoryItemForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
