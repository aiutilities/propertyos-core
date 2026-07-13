import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import {
  AdminShell,
} from "@/components/layout/AdminShell";
import ResidentReservationList from "@/components/reservation/ResidentReservationList";

export default function ResidentReservationsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Resident Portal
            </p>
            <h1>My Bookings</h1>
          </div>
        </div>

        <ResidentReservationList />
      </AdminShell>
    </ProtectedRoute>
  );
}
