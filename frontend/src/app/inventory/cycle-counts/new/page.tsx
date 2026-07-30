import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryCycleCountForm from "@/components/inventory/InventoryCycleCountForm";

export default function NewInventoryCycleCountPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Control
            </p>
            <h1>New Cycle Count</h1>
          </div>
        </div>

        <InventoryCycleCountForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
