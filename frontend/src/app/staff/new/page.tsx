import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import StaffForm from "@/components/staff/StaffForm";

export default function NewStaffPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Staff Registry</p>
          <h1>Register Staff</h1>
        </div>

        <StaffForm />
      </AdminShell>
    </ProtectedRoute>
  );
}
