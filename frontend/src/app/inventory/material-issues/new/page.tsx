import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryMaterialIssueForm from "@/components/inventory/InventoryMaterialIssueForm";

export default function NewInventoryMaterialIssuePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Operations
            </p>
            <h1>New Material Issue</h1>
          </div>
        </div>

        <InventoryMaterialIssueForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
