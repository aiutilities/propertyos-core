import {
  ProtectedRoute,
} from "@/components/auth/ProtectedRoute";
import {
  AdminShell,
} from "@/components/layout/AdminShell";
import ReservationApprovalQueue from "@/components/reservation/ReservationApprovalQueue";

export default function ReservationApprovalsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">
              Booking Administration
            </p>
            <h1>
              Reservation Approvals
            </h1>
          </div>
        </div>

        <ReservationApprovalQueue />
      </AdminShell>
    </ProtectedRoute>
  );
}
