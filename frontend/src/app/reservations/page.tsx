import Link from "next/link";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import {
  AdminShell,
} from "@/components/layout/AdminShell";
import ReservationDashboard from "@/components/reservation/ReservationDashboard";

export default function ReservationsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Community Operations
            </p>
            <h1>
              Booking & Reservations
            </h1>
          </div>

          <div className="button-row">
            <Link
              className="secondary-button"
              href="/reservations/resources"
            >
              Manage Resources
            </Link>

            <Link
              className="button-link"
              href="/reservations/new"
            >
              Create Reservation
            </Link>
          </div>
        </div>

        <ReservationDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
