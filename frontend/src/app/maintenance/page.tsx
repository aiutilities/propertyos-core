import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import MaintenanceDashboard from "@/components/maintenance/MaintenanceDashboard";

export default function MaintenancePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Property Operations</p>
            <h1>Maintenance</h1>
          </div>

          <Link className="button-link" href="/maintenance/new">
            Create Ticket
          </Link>
        </div>

        <MaintenanceDashboard />
      </AdminShell>
    </ProtectedRoute>
  );
}
