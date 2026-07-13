import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import {
  AdminShell,
} from "@/components/layout/AdminShell";
import ReservationResourceForm from "@/components/reservation/ReservationResourceForm";

export default function NewReservationResourcePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">
            Booking Administration
          </p>
          <h1>
            Add Reservation Resource
          </h1>
        </div>

        <ReservationResourceForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
