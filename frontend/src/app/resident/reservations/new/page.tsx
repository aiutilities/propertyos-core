import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import {
  AdminShell,
} from "@/components/layout/AdminShell";
import ResidentReservationForm from "@/components/reservation/ResidentReservationForm";

export default function ResidentNewReservationPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">
            Resident Portal
          </p>
          <h1>Book a Resource</h1>
        </div>

        <ResidentReservationForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
