import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ResidentStaffDirectory from "@/components/staff/ResidentStaffDirectory";

export default function ResidentStaffsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Resident Portal</p>
          <h1>My Staff</h1>
        </div>

        <ResidentStaffDirectory />
      </AdminShell>
    </ProtectedRoute>
  );
}
