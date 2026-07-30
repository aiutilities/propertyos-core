import Link from "next/link";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryCycleCountDashboard from "@/components/inventory/InventoryCycleCountDashboard";

export default function InventoryCycleCountsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Control
            </p>
            <h1>Cycle Counts</h1>
          </div>

          <Link
            className="button-link"
            href="/inventory/cycle-counts/new"
          >
            New Cycle Count
          </Link>
        </div>

        <InventoryCycleCountDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
