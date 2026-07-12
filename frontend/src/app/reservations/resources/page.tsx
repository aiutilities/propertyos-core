import Link from "next/link";

import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import {
  AdminShell,
} from "@/components/layout/AdminShell";
import ReservationResourceDashboard from "@/components/reservation/ReservationResourceDashboard";

export default function ReservationResourcesPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Booking Administration
            </p>
            <h1>
              Reservation Resources
            </h1>
          </div>

          <div className="button-row">
            <Link
              className="secondary-button"
              href="/reservations"
            >
              View Reservations
            </Link>

            <Link
              className="button-link"
              href="/reservations/resources/new"
            >
              Add Resource
            </Link>
          </div>
        </div>

        <ReservationResourceDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
