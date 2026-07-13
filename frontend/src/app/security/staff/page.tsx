import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import SecurityStaffLookup from "@/components/staff/SecurityStaffLookup";

export default function SecurityStaffsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div>
          <p className="eyebrow">Security Operations</p>
          <h1>Staff Gate Lookup</h1>
        </div>

        <SecurityStaffLookup />
      </AdminShell>
    </ProtectedRoute>
  );
}
