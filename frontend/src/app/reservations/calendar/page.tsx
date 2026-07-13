import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import {
  AdminShell,
} from "@/components/layout/AdminShell";
import ReservationCalendar from "@/components/reservation/ReservationCalendar";

export default function ReservationCalendarPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Booking Operations
            </p>
            <h1>
              Reservation Calendar
            </h1>
          </div>
        </div>

        <ReservationCalendar />
      </AdminShell>
    </ProtectedRoute>
  );
}
