import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import {
  AdminShell,
} from "@/components/layout/AdminShell";
import ReservationForm from "@/components/reservation/ReservationForm";

export default function NewReservationPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">
            Booking Operations
          </p>
          <h1>
            Create Reservation
          </h1>
        </div>

        <ReservationForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
