import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryMaterialReturnForm from "@/components/inventory/InventoryMaterialReturnForm";

export default function NewInventoryMaterialReturnPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Operations
            </p>
            <h1>New Material Return</h1>
          </div>
        </div>

        <InventoryMaterialReturnForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
