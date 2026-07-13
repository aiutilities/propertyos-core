import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import StaffForm from "@/components/staff/StaffForm";

export default function ResidentNewStaffPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Resident Portal</p>
          <h1>Register My Staff</h1>
        </div>

        <StaffForm residentMode />
      </AdminShell>
    </ProtectedRoute>
  );
}
