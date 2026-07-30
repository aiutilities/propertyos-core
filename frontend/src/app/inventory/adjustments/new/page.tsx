import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import StockAdjustmentForm from "@/components/inventory/StockAdjustmentForm";

export default function NewStockAdjustmentPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Operations
            </p>
            <h1>New Stock Adjustment</h1>
            <p className="muted-text">
              Create a draft inventory
              quantity correction for review
              and posting.
            </p>
          </div>
        </div>

        <StockAdjustmentForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
