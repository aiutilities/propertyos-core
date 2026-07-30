import Link from "next/link";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import StockAdjustmentDashboard from "@/components/inventory/StockAdjustmentDashboard";

export default function StockAdjustmentsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Operations
            </p>
            <h1>Stock Adjustments</h1>
            <p className="muted-text">
              Review, post and cancel
              inventory quantity corrections.
            </p>
          </div>

          <Link
            className="button-link"
            href="/inventory/adjustments/new"
          >
            New Adjustment
          </Link>
        </div>

        <StockAdjustmentDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
