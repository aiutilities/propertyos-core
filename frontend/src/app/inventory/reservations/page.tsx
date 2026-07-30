import Link from "next/link";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";

import {
  AdminShell,
} from "@/components/layout/AdminShell";

import InventoryReservationDashboard from "@/components/inventory/InventoryReservationDashboard";

export default function InventoryReservationsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Inventory Operations
            </p>
            <h1>Stock Reservations</h1>
          </div>

          <Link
            className="button-link"
            href="/inventory/reservations/new"
          >
            New Reservation
          </Link>
        </div>

        <InventoryReservationDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
