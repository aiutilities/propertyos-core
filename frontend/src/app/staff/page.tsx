import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import StaffDashboard from "@/components/staff/StaffDashboard";

export default function StaffsPage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Community Operations</p>
            <h1>Staff Registry</h1>
          </div>

          <Link className="button-link" href="/staff/new">
            Register Staff
          </Link>
        </div>

        <StaffDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
