import Link from "next/link";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryTransferDashboard from "@/components/inventory/InventoryTransferDashboard";

export default function InventoryTransfersPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Operations
            </p>
            <h1>Stock Transfers</h1>
          </div>

          <Link
            className="button-link"
            href="/inventory/transfers/new"
          >
            New Transfer
          </Link>
        </div>

        <InventoryTransferDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
