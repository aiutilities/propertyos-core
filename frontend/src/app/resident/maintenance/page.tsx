import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminShell } from "@/components/layout/AdminShell";
import ResidentMaintenanceList from "@/components/resident/ResidentMaintenanceList";

export default function ResidentMaintenancePage() {
  return (
    <ProtectedRoute>
      <AdminShell>
        <div className="page-header">
          <div>
            <p className="eyebrow">Resident Portal</p>
            <h1>My Maintenance Requests</h1>
          </div>
        </div>

        <ResidentMaintenanceList />
      </AdminShell>
    </ProtectedRoute>
  );
}
