import Link from "next/link";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryMaterialIssueDashboard from "@/components/inventory/InventoryMaterialIssueDashboard";

export default function InventoryMaterialIssuesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Operations
            </p>
            <h1>Material Issues</h1>
          </div>

          <Link
            className="button-link"
            href="/inventory/material-issues/new"
          >
            New Material Issue
          </Link>
        </div>

        <InventoryMaterialIssueDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
